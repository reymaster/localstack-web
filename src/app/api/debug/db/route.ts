import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT
        id,
        queue_url,
        message_id,
        body,
        attributes,
        message_attributes,
        md5_of_body,
        md5_of_message_attributes,
        sent_timestamp,
        created_at
      FROM sqs_messages
      ORDER BY created_at DESC
    `);

    const messages = stmt.all();

    return NextResponse.json({
      count: messages.length,
      messages: messages.map(msg => ({
        ...msg,
        attributes: JSON.parse(msg.attributes || '{}'),
        message_attributes: JSON.parse(msg.message_attributes || '{}'),
      })),
    });
  } catch (error) {
    console.error('Erro ao consultar banco:', error);
    return NextResponse.json(
      {
        error: 'Erro ao consultar banco',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
