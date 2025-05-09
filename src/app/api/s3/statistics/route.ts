import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
});

export async function GET() {
  try {
    // Buscar buckets
    const bucketsRes = await s3Client.send(new ListBucketsCommand({}));
    const buckets = bucketsRes.Buckets || [];
    let totalObjects = 0;
    for (const bucket of buckets) {
      const objectsRes = await s3Client.send(new ListObjectsV2Command({ Bucket: bucket.Name }));
      totalObjects += (objectsRes.Contents?.length || 0);
    }
    return NextResponse.json({
      buckets: buckets.length,
      objects: totalObjects,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas do S3' }, { status: 500 });
  }
}
