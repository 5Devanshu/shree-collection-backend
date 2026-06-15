import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import s3, { BUCKET_NAME } from '../config/storage.js';

export const uploadToS3 = async (fileBuffer, mimetype, folder = 'general') => {
  const ext = mimetype.split('/')[1] === 'jpeg' ? 'jpg' : mimetype.split('/')[1];
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET_NAME,
      Key:         key,
      Body:        fileBuffer,
      ContentType: mimetype,
    })
  );

  // Virtual-hosted-style public URL — required by Railway Object Storage
  const host = process.env.RAILWAY_BUCKET_ENDPOINT_URL
    .replace('https://', '')
    .replace(/\/$/, '');
  const url = `https://${BUCKET_NAME}.${host}/${key}`;

  return { key, url };
};

export const deleteFromS3 = async (key) => {
  if (!key) throw new Error('S3 key is required for deletion');
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key:    key,
    })
  );
};