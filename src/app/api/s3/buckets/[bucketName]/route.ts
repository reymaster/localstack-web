import { NextResponse } from 'next/server';
import { S3Client, DeleteBucketCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
});

export async function DELETE(
  request: Request,
  { params }: { params: { bucketName: string } }
) {
  try {
    const { bucketName } = params;

    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: 'Bucket excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir bucket:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir bucket' },
      { status: 500 }
    );
  }
}
