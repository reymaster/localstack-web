import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, CreateBucketCommand } from '@aws-sdk/client-s3';

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
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    return NextResponse.json(response.Buckets || []);
  } catch (error) {
    console.error('Erro ao listar buckets:', error);
    return NextResponse.json(
      { error: 'Erro ao listar buckets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do bucket é obrigatório' },
        { status: 400 }
      );
    }

    const command = new CreateBucketCommand({
      Bucket: name,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: 'Bucket criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar bucket:', error);
    return NextResponse.json(
      { error: 'Erro ao criar bucket' },
      { status: 500 }
    );
  }
}
