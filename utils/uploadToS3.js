import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import s3, { BUCKET_NAME } from '../config/storage.js';

export const uploadToS3 = async (fileBuffer, mimetype, folder = 'general') => {
  const ext = mimetype.split('/')[1] === 'jpeg' ? 'jpg' : mimetype.split('/')[1];
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         key,
    Body:        fileBuffer,
    ContentType: mimetype,
  }));

  // Store proxy URL — served through our own backend
  const backendUrl = process.env.BACKEND_URL || 'https://shree-collection-backend-production.up.railway.app';
  const url = `${backendUrl}/api/media/file/${encodeURIComponent(key)}`;

  return { key, url };
};

export const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};

export const deleteFromS3 = async (key) => {
  if (!key) throw new Error('S3 key is required');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
};