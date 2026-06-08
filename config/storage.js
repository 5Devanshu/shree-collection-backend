import { S3Client } from '@aws-sdk/client-s3';

// Railway Object Storage — S3-compatible bucket
// Mirrors config/cloudinary.js which exports a configured client
const s3 = new S3Client({
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT_URL,
  region: process.env.RAILWAY_BUCKET_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // required for Railway / MinIO-compatible endpoints
});

export const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME;

export default s3;