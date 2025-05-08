import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
});

export async function POST(
  request: Request,
  context: { params: { bucketName: string } }
) {
  try {
    const { bucketName } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: file.name,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: 'Arquivo enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
