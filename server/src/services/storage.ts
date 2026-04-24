import { env } from '../config/env';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, '../../uploads/photos');

export async function uploadPhoto(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `${uuid()}.${ext}`;

  // In production, use R2/S3. In dev, save locally.
  if (env.R2_ENDPOINT && env.R2_ACCESS_KEY) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
      },
    });

    const key = `photos/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `${env.R2_ENDPOINT}/${env.R2_BUCKET}/${key}`;
  }

  // Local dev: save to disk, serve via static middleware
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/photos/${filename}`;
}
