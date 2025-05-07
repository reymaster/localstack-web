import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SQLiteMessage {
  id: number;
  queue_url: string;
  message_id: string;
  body: string;
  attributes: string;
  message_attributes: string;
  md5_of_body: string;
  md5_of_message_attributes: string;
  sent_timestamp: string;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queueUrl = searchParams.get('queueUrl');

    if (!queueUrl) {
      console.error('URL da fila não fornecida');
      return NextResponse.json(
        { error: 'URL da fila é obrigatória' },
        { status: 400 }
      );
    }

    console.log('Buscando mensagens para a fila:', queueUrl);

    // Buscar mensagens do SQLite
    const stmt = db.prepare(`
      SELECT * FROM sqs_messages
      WHERE queue_url = ?
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const messages = stmt.all(queueUrl) as SQLiteMessage[];

    console.log('Mensagens encontradas:', messages.length);
    if (messages.length > 0) {
      console.log('Exemplo de mensagem:', {
        id: messages[0].id,
        messageId: messages[0].message_id,
        md5OfBody: messages[0].md5_of_body,
        md5OfAttributes: messages[0].md5_of_message_attributes,
        attributes: messages[0].attributes,
        messageAttributes: messages[0].message_attributes,
      });
    }

    return NextResponse.json({
      messages: messages.map(msg => ({
        MessageId: msg.message_id,
        Body: msg.body,
        Attributes: JSON.parse(msg.attributes || '{}'),
        MessageAttributes: JSON.parse(msg.message_attributes || '{}'),
        MD5OfBody: msg.md5_of_body,
        MD5OfMessageAttributes: msg.md5_of_message_attributes,
        SentTimestamp: msg.sent_timestamp,
        ReceiptHandle: '', // Não armazenamos o ReceiptHandle
      })),
      count: messages.length,
      queueUrl,
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar mensagens',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
