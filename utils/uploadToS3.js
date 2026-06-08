import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import s3, { BUCKET_NAME } from '../config/storage.js';

// ─── Upload a single file buffer to Railway Bucket ────────────────────────────
// Returns { key, url } — key is stored in DB for later deletion
// url is the public-accessible URL stored as the image src
export const uploadToS3 = async (fileBuffer, mimetype, folder = 'general') => {
  const ext = mimetype.split('/')[1] === 'jpeg' ? 'jpg' : mimetype.split('/')[1];
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
      // Note: Railway Bucket access control is configured at the bucket level,
      // not per-object. Set the bucket to "Public" in Railway dashboard.
    })
  );

  // Construct the public URL
  // Railway Bucket public URL format: {endpoint}/{bucket}/{key}
  const endpoint = process.env.RAILWAY_BUCKET_ENDPOINT_URL.replace(/\/$/, '');
  const url = `${endpoint}/${BUCKET_NAME}/${key}`;

  return { key, url };
};

// ─── Delete a file from Railway Bucket ───────────────────────────────────────
// Called by deleteMediaService — pass the stored s3Key from Media record
export const deleteFromS3 = async (key) => {
  if (!key) throw new Error('S3 key is required for deletion');

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
};