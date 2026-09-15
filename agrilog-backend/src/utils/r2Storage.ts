import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import path from 'path';
import { Readable } from 'stream';

const endpoint = process.env.R2_ENDPOINT || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.R2_BUCKET_NAME || 'agrilog';
const publicUrl = process.env.R2_PUBLIC_URL || '';

export const isR2Configured = (): boolean => {
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucketName);
};

let s3ClientInstance: S3Client | null = null;

export const getR2Client = (): S3Client => {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
};

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
}

/**
 * Upload a file buffer to Cloudflare R2
 */
export const uploadToR2 = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'images'
): Promise<UploadResult> => {
  const client = getR2Client();
  const fileExt = path.extname(originalName).toLowerCase();
  const sanitizedBase = path.basename(originalName, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueKey = `${folder}/${Date.now()}-${sanitizedBase}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await client.send(command);

  let url: string;
  if (publicUrl && publicUrl.trim() !== '') {
    const cleanPublicUrl = publicUrl.trim().replace(/\/$/, '');
    url = `${cleanPublicUrl}/${uniqueKey}`;
  } else {
    // Relative API proxy path; callers can make it absolute using req context if desired
    url = `/api/upload/file/${uniqueKey}`;
  }

  return {
    key: uniqueKey,
    url,
    bucket: bucketName,
    size: fileBuffer.length,
  };
};

/**
 * Fetch an object stream from Cloudflare R2
 */
export const getFileFromR2 = async (key: string) => {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await client.send(command);
  return {
    stream: response.Body as Readable,
    contentType: response.ContentType || 'application/octet-stream',
    contentLength: response.ContentLength,
    eTag: response.ETag,
    lastModified: response.LastModified,
  };
};

/**
 * Delete an object from Cloudflare R2
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await client.send(command);
};
