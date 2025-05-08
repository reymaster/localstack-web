import { NextResponse } from 'next/server';
import { SNSClient, PublishCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { db } from '@/lib/db';

const snsClient = new SNSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

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
    const { topicArn, message } = await request.json();
    if (!topicArn || !message) {
      return NextResponse.json({ error: 'topicArn e message são obrigatórios' }, { status: 400 });
    }
    // Publica no SNS
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: message,
    });
    const response = await snsClient.send(command);

    // Busca assinaturas do tópico
    const listSubs = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
    const subsRes = await snsClient.send(listSubs);
    const subscriptions = subsRes.Subscriptions || [];

    // Para cada assinatura SQS, envia mensagem e persiste no SQLite
    for (const sub of subscriptions) {
      if (sub.Protocol === 'sqs' && sub.Endpoint) {
        const queueArn = sub.Endpoint;
        // Extrai o nome da fila do ARN
        const queueName = queueArn.split(':').pop();
        const queueUrl = `http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/${queueName}`;
        const sqsCmd = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: message,
        });
        const sqsRes = await sqsClient.send(sqsCmd);
        // Persistir no SQLite
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
        };
        stmt.run(
          queueUrl,
          sqsRes.MessageId,
          message,
          JSON.stringify(attributes),
          JSON.stringify({}),
          sqsRes.MD5OfMessageBody || '',
          sqsRes.MD5OfMessageAttributes || '',
          new Date().toISOString()
        );
      }
    }
    return NextResponse.json({ messageId: response.MessageId });
  } catch (error) {
    console.error('Erro ao publicar mensagem SNS:', error);
    return NextResponse.json({ error: 'Erro ao publicar mensagem SNS' }, { status: 500 });
  }
}
