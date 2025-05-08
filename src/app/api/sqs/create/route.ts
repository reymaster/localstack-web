import { NextResponse } from 'next/server';
import { SQSClient, CreateQueueCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function POST(request: Request) {
  try {
    const { queueName } = await request.json();

    if (!queueName) {
      return NextResponse.json(
        { error: 'Nome da fila é obrigatório' },
        { status: 400 }
      );
    }

    const command = new CreateQueueCommand({
      QueueName: queueName,
    });

    const response = await sqsClient.send(command);

    if (!response.QueueUrl) {
      throw new Error('URL da fila não retornada');
    }

    return NextResponse.json({
      queue: {
        QueueUrl: response.QueueUrl,
        QueueName: queueName,
      },
    });
  } catch (error) {
    console.error('Erro ao criar fila SQS:', error);
    return NextResponse.json(
      { error: 'Erro ao criar fila SQS' },
      { status: 500 }
    );
  }
}
