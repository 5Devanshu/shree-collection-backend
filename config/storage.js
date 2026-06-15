import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT_URL,
  region:   process.env.RAILWAY_BUCKET_REGION || 'auto',
  credentials: {
    accessKeyId:     process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME;
export default s3;