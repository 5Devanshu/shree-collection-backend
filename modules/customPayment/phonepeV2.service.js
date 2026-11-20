import axios from 'axios';
import crypto from 'crypto';

const getBaseUrl = () => (String(process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION'
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox');
const getTokenUrl = () => (String(process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION'
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token');

let cachedToken = null;
let tokenExpiresAt = 0;

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required PhonePe configuration: ${name}`);
  return value;
};

const getAccessToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt - 60 > now) return cachedToken;

  const body = new URLSearchParams({
    client_id: required('PHONEPE_CLIENT_ID'),
    client_version: required('PHONEPE_CLIENT_VERSION'),
    client_secret: required('PHONEPE_CLIENT_SECRET'),
    grant_type: 'client_credentials',
  });

  const response = await axios.post(getTokenUrl(), body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  const { access_token: accessToken, expires_at: expiresAt } = response.data || {};
  if (!accessToken || !expiresAt) throw new Error('PhonePe authorization returned an invalid token');

  cachedToken = accessToken;
  tokenExpiresAt = Number(expiresAt);
  return cachedToken;
};

const phonePeRequest = async (config) => {
  const accessToken = await getAccessToken();
  return axios({
    ...config,
    baseURL: getBaseUrl(),
    headers: {
      Authorization: `O-Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    },
    timeout: 15000,
  });
};

export const createPayment = async ({ merchantOrderId, amount, redirectUrl }) => {
  const response = await phonePeRequest({
    method: 'post',
    url: '/checkout/v2/pay',
    data: {
      merchantOrderId,
      amount: Math.round(amount * 100),
      expireAfter: 1200,
      paymentFlow: {
        type: 'PG_CHECKOUT',
        merchantUrls: { redirectUrl },
      },
    },
  });

  const data = response.data || {};
  return {
    gatewayOrderId: data.orderId || data.gatewayOrderId || '',
    redirectUrl: data.redirectUrl || data.tokenUrl || data.checkoutUrl || '',
  };
};

export const getOrderStatus = async (merchantOrderId) => {
  const response = await phonePeRequest({
    method: 'get',
    url: `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`,
    params: { details: 'true' },
  });
  return response.data || {};
};

export const verifyWebhook = (rawBody, headers) => {
  const keyId = process.env.PHONEPE_WEBHOOK_KEY_ID;
  const secret = process.env.PHONEPE_WEBHOOK_SECRET;
  const receivedKeyId = headers['x-phonepe-checksum-key-id'];
  const receivedSignature = headers['x-phonepe-checksum-signature'];

  if (keyId && secret && receivedKeyId && receivedSignature) {
    if (receivedKeyId !== keyId) return false;
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const received = Buffer.from(receivedSignature);
    const expected = Buffer.from(digest);
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  }

  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  const authorization = headers.authorization;
  if (username && password && authorization) {
    const expected = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
    const received = Buffer.from(authorization.replace(/^sha256=/i, ''));
    const expectedBuffer = Buffer.from(expected);
    return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
  }

  return false;
};
