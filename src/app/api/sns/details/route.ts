import { NextResponse } from 'next/server';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicArn = searchParams.get('topicArn');
    if (!topicArn) {
      return NextResponse.json({ error: 'ARN do tópico é obrigatório' }, { status: 400 });
    }
    const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
    const response = await snsClient.send(command);
    return NextResponse.json({ attributes: response.Attributes });
  } catch (error) {
    console.error('Erro ao obter detalhes do tópico SNS:', error);
    return NextResponse.json({ error: 'Erro ao obter detalhes do tópico SNS' }, { status: 500 });
  }
}
