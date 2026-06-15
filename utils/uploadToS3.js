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

  // Store the key — generate presigned URL on the fly when serving
  return { key, url: key }; // store key as url for now
};

// Generate a presigned URL valid for 7 days
export const getPresignedUrl = async (key, expiresInSeconds = 604800) => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
};

export const deleteFromS3 = async (key) => {
  if (!key) throw new Error('S3 key is required');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
};