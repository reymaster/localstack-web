import { NextResponse } from 'next/server';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function GET() {
  try {
    const command = new ListTopicsCommand({});
    const response = await snsClient.send(command);
    const topics = (response.Topics || []).map(t => ({
      arn: t.TopicArn,
      name: t.TopicArn?.split(':').pop() || '',
    }));
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Erro ao listar tópicos SNS:', error);
    return NextResponse.json({ error: 'Erro ao listar tópicos SNS' }, { status: 500 });
  }
}
