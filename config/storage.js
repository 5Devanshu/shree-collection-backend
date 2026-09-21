import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';

// Railway Object Storage is Cloudflare R2, which requires virtual-hosted-style
// URLs (bucket.endpoint/key). forcePathStyle: true sends requests to
// endpoint/bucket/key instead, which R2 does not support — uploads appear to
// succeed (no SDK error) but the object is written to a wrong path and
// subsequent GET presigned URLs return 404. Remove it entirely.
//
// requestHandler.maxSockets: the SDK default is 50 concurrent connections to
// R2. A product grid loading 100-200 images at once (e.g. products?limit=200)
// blows past that instantly — everything past the first 50 queues behind
// "socket usage at capacity=50" and the browser sees those image requests
// hang as (pending) indefinitely. Raised to 200 to match realistic page loads.
const s3 = new S3Client({
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT_URL,
  region:   process.env.RAILWAY_BUCKET_REGION || 'auto',
  credentials: {
    accessKeyId:     process.env.RAILWAY_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({ maxSockets: 200 }),
});

export const BUCKET_NAME = process.env.RAILWAY_BUCKET_NAME;
export default s3;