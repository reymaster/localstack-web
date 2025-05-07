import { NextResponse } from 'next/server';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

export async function GET() {
  try {
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);

    // Extrair apenas as URLs das filas e criar objetos com nome e URL
    const queues = response.QueueUrls?.map(url => {
      const queueName = url.split('/').pop() || '';
      return {
        QueueUrl: url,
        QueueName: queueName
      };
    }) || [];

    return NextResponse.json({ queues });
  } catch (error) {
    console.error('Erro ao listar filas SQS:', error);
    return NextResponse.json(
      { error: 'Erro ao listar filas SQS' },
      { status: 500 }
    );
  }
}
