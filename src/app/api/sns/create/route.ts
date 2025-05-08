import { NextResponse } from 'next/server';
import { SNSClient, CreateTopicCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function POST(request: Request) {
  try {
    const { topicName } = await request.json();
    if (!topicName) {
      return NextResponse.json({ error: 'Nome do tópico é obrigatório' }, { status: 400 });
    }
    const command = new CreateTopicCommand({ Name: topicName });
    const response = await snsClient.send(command);
    return NextResponse.json({ topicArn: response.TopicArn, topicName });
  } catch (error) {
    console.error('Erro ao criar tópico SNS:', error);
    return NextResponse.json({ error: 'Erro ao criar tópico SNS' }, { status: 500 });
  }
}
