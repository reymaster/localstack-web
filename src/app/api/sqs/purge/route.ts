import { NextResponse } from 'next/server';
import { SQSClient, PurgeQueueCommand } from '@aws-sdk/client-sqs';
import { db } from '@/lib/db';

const sqsClient = new SQSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

export async function POST(request: Request) {
  try {
    const { queueUrl } = await request.json();

    if (!queueUrl) {
      return NextResponse.json(
        { error: 'URL da fila é obrigatória' },
        { status: 400 }
      );
    }

    // Limpar fila no SQS
    const command = new PurgeQueueCommand({
      QueueUrl: queueUrl,
    });

    await sqsClient.send(command);

    // Limpar mensagens no SQLite
    const stmt = db.prepare(`
      DELETE FROM sqs_messages
      WHERE queue_url = ?
    `);

    const result = stmt.run(queueUrl);

    return NextResponse.json({
      success: true,
      message: 'Fila limpa com sucesso',
      deletedCount: result.changes,
    });
  } catch (error) {
    console.error('Erro ao limpar fila:', error);
    return NextResponse.json(
      {
        error: 'Erro ao limpar fila',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
