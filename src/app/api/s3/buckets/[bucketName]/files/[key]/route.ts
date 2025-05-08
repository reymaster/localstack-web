import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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
  context: { params: { bucketName: string; key: string } }
) {
  try {
    const { bucketName, key } = await context.params;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: decodeURIComponent(key),
    });
    const response = await s3Client.send(command);
    const body = await response.Body.transformToByteArray();
    const contentType = response.ContentType || 'application/octet-stream';
    return new Response(Buffer.from(body), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${decodeURIComponent(key)}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao obter arquivo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { bucketName: string; key: string } }
) {
  try {
    const { bucketName, key } = params;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: 'Arquivo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir arquivo' },
      { status: 500 }
    );
  }
}
