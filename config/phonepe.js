import axios from 'axios';
import crypto from 'crypto';

/**
 * PhonePe Payment Gateway Configuration
 * Test Credentials:
 * - Client ID: M22WI0U1WRSFJ_2604272338
 * - Client Secret: ODliMTYxOWUtNjBkOS00NTFiLThlNzktMWI3YzI0Y2UxMWY4
 * - Environment: TEST
 */

const PHONEPE_CONFIG = {
  environment: process.env.PHONEPE_ENV || 'TEST',
  clientId: process.env.PHONEPE_CLIENT_ID || 'M22WI0U1WRSFJ_2604272338',
  clientSecret: process.env.PHONEPE_CLIENT_SECRET || 'ODliMTYxOWUtNjBkOS00NTFiLThlNzktMWI3YzI0Y2UxMWY4',
  appId: process.env.PHONEPE_APP_ID || 'M22WI0U1WRSFJ_2604272338',
};

const API_BASE_URL = {
  TEST: 'https://api-test.phonepe.com/v1',
  PRODUCTION: 'https://api.phonepe.com/v1',
};

const DASHBOARD_URL = {
  TEST: 'https://hold-payments-test.phonepe.com',
  PRODUCTION: 'https://hold-payments.phonepe.com',
};

/**
 * Generate X-Verify header for PhonePe API requests
 * @param {string} body - Request body as JSON string
 * @param {string} endpoint - API endpoint path
 * @returns {string} X-Verify hash
 */
export const generateXVerifyHeader = (body, endpoint) => {
  const stringToHash = body + endpoint + PHONEPE_CONFIG.clientSecret;
  const hash = crypto
    .createHash('sha256')
    .update(stringToHash)
    .digest('hex');
  return hash;
};

/**
 * Verify PhonePe webhook response
 * @param {string} responseBody - Response body from PhonePe
 * @param {string} xVerifyHeader - X-Verify header from PhonePe
 * @param {string} endpoint - API endpoint path
 * @returns {boolean} Is valid
 */
export const verifyPhonePeSignature = (responseBody, xVerifyHeader, endpoint) => {
  const stringToHash = responseBody + endpoint + PHONEPE_CONFIG.clientSecret;
  const hash = crypto
    .createHash('sha256')
    .update(stringToHash)
    .digest('hex');
  return hash === xVerifyHeader;
};

/**
 * Create PhonePe payment request payload
 * @param {Object} params - Payment parameters
 * @returns {Object} Request payload
 */
export const createPhonePePayload = ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  redirectUrl,
  callbackUrl,
}) => {
  const timestamp = Date.now();

  const payload = {
    merchantId: PHONEPE_CONFIG.appId,
    merchantTransactionId: orderId,
    merchantUserId: customerPhone,
    amount: Math.round(amount * 100), // Convert to paise
    redirectUrl: redirectUrl,
    callbackUrl: callbackUrl,
    mobileNumber: customerPhone,
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
    deviceContext: {
      deviceOS: 'WEB',
    },
  };

  return payload;
};

/**
 * Initialize PhonePe payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Payment response with redirect URL
 */
export const initializePhonePePayment = async (paymentData) => {
  try {
    const endpoint = '/pg/pay';
    const payload = createPhonePePayload(paymentData);
    const body = JSON.stringify(payload);
    const xVerifyHeader = generateXVerifyHeader(body, endpoint);

    const response = await axios.post(
      `${API_BASE_URL[PHONEPE_CONFIG.environment]}${endpoint}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-CLIENT-ID': PHONEPE_CONFIG.clientId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('PhonePe Payment Initialization Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initialize PhonePe payment');
  }
};

/**
 * Check PhonePe transaction status
 * @param {string} merchantTransactionId - Order ID / Merchant Transaction ID
 * @returns {Promise<Object>} Transaction status
 */
export const checkPhonePeTransactionStatus = async (merchantTransactionId) => {
  try {
    const endpoint = `/pg/merchants/${PHONEPE_CONFIG.appId}/transactions/${merchantTransactionId}`;
    const xVerifyHeader = generateXVerifyHeader('', endpoint);

    const response = await axios.get(
      `${API_BASE_URL[PHONEPE_CONFIG.environment]}${endpoint}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-CLIENT-ID': PHONEPE_CONFIG.clientId,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('PhonePe Status Check Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to check transaction status');
  }
};

export default {
  PHONEPE_CONFIG,
  API_BASE_URL,
  DASHBOARD_URL,
  generateXVerifyHeader,
  verifyPhonePeSignature,
  createPhonePePayload,
  initializePhonePePayment,
  checkPhonePeTransactionStatus,
};
