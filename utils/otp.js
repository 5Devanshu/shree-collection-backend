import crypto from 'crypto';

export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

export const hashOtp = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');