import { NextResponse } from 'next/server';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
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
    const { queueUrl, messageBody, messageAttributes } = await request.json();

    if (!queueUrl || !messageBody) {
      return NextResponse.json(
        { error: 'URL da fila e corpo da mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: messageAttributes,
    });

    const response = await sqsClient.send(command);
    console.log('Resposta do SQS:', JSON.stringify(response, null, 2));

    // Persistir a mensagem no SQLite
    const stmt = db.prepare(`
      INSERT INTO sqs_messages (
        queue_url,
        message_id,
        body,
        attributes,
        message_attributes,
        md5_of_body,
        md5_of_message_attributes,
        sent_timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const attributes = {
      SentTimestamp: new Date().toISOString(),
      ...response.Attributes,
    };

    const result = stmt.run(
      queueUrl,
      response.MessageId,
      messageBody,
      JSON.stringify(attributes),
      JSON.stringify(messageAttributes || {}),
      response.MD5OfMessageBody || '',
      response.MD5OfMessageAttributes || '',
      new Date().toISOString()
    );

    console.log('Mensagem salva no SQLite:', {
      messageId: response.MessageId,
      md5OfBody: response.MD5OfMessageBody,
      md5OfAttributes: response.MD5OfMessageAttributes,
      attributes,
      messageAttributes,
    });

    return NextResponse.json({
      messageId: response.MessageId,
      queueUrl,
      md5OfBody: response.MD5OfMessageBody,
      md5OfAttributes: response.MD5OfMessageAttributes,
      attributes,
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json(
      {
        error: 'Erro ao enviar mensagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
