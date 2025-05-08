import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
});

export async function GET(
  request: Request,
  context: { params: { bucketName: string } }
) {
  try {
    const { bucketName } = await context.params;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);

    return NextResponse.json(response.Contents || []);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar arquivos' },
      { status: 500 }
    );
  }
}
