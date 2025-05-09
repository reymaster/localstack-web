import { NextResponse } from 'next/server';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { db } from '@/lib/db';

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
    // Buscar filas
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);
    const queues = response.QueueUrls || [];
    // Buscar total de mensagens no banco local
    const stmt = db.prepare('SELECT COUNT(*) as total FROM sqs_messages');
    const result = stmt.get();
    // Buscar mensagens das últimas 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stmtRecent = db.prepare('SELECT COUNT(*) as total FROM sqs_messages WHERE created_at >= ?');
    const resultRecent = stmtRecent.get(since);
    return NextResponse.json({
      queues: queues.length,
      messages: result?.total ?? 0,
      recentMessages: resultRecent?.total ?? 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas do SQS' }, { status: 500 });
  }
}
