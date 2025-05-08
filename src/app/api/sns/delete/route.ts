import { NextResponse } from 'next/server';
import { SNSClient, DeleteTopicCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function DELETE(request: Request) {
  try {
    const { topicArn } = await request.json();
    if (!topicArn) {
      return NextResponse.json({ error: 'ARN do tópico é obrigatório' }, { status: 400 });
    }
    const command = new DeleteTopicCommand({ TopicArn: topicArn });
    await snsClient.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir tópico SNS:', error);
    return NextResponse.json({ error: 'Erro ao excluir tópico SNS' }, { status: 500 });
  }
}
