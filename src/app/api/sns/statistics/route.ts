import { NextResponse } from 'next/server';
import { SNSClient, ListTopicsCommand, ListSubscriptionsCommand, ListPlatformApplicationsCommand } from '@aws-sdk/client-sns';

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
    const [topicsRes, subsRes, platRes] = await Promise.all([
      snsClient.send(new ListTopicsCommand({})),
      snsClient.send(new ListSubscriptionsCommand({})),
      snsClient.send(new ListPlatformApplicationsCommand({})),
    ]);
    return NextResponse.json({
      topics: topicsRes.Topics?.length || 0,
      platformApplications: platRes.PlatformApplications?.length || 0,
      subscriptions: subsRes.Subscriptions?.length || 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas SNS:', error);
    return NextResponse.json({
      topics: 0,
      platformApplications: 0,
      subscriptions: 0,
      error: 'Erro ao buscar estatísticas SNS',
    }, { status: 500 });
  }
}
