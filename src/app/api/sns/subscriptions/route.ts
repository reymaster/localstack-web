import { NextResponse } from 'next/server';
import { SNSClient, ListSubscriptionsByTopicCommand, UnsubscribeCommand, SubscribeCommand } from '@aws-sdk/client-sns';

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
    const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
    const response = await snsClient.send(command);
    return NextResponse.json({ subscriptions: response.Subscriptions || [] });
  } catch (error) {
    console.error('Erro ao listar assinaturas SNS:', error);
    return NextResponse.json({ error: 'Erro ao listar assinaturas SNS' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { subscriptionArn } = await request.json();
    if (!subscriptionArn) {
      return NextResponse.json({ error: 'ARN da assinatura é obrigatório' }, { status: 400 });
    }
    const command = new UnsubscribeCommand({ SubscriptionArn: subscriptionArn });
    await snsClient.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover assinatura SNS:', error);
    return NextResponse.json({ error: 'Erro ao remover assinatura SNS' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { topicArn, protocol, endpoint, filterPolicy, redrivePolicy, rawMessageDelivery } = await request.json();
    if (!topicArn || !protocol || !endpoint) {
      return NextResponse.json({ error: 'topicArn, protocol e endpoint são obrigatórios' }, { status: 400 });
    }
    const Attributes: Record<string, string> = {};
    if (filterPolicy) {
      Attributes['FilterPolicy'] = typeof filterPolicy === 'string' ? filterPolicy : JSON.stringify(filterPolicy);
    }
    if (redrivePolicy) {
      Attributes['RedrivePolicy'] = typeof redrivePolicy === 'string' ? redrivePolicy : JSON.stringify(redrivePolicy);
    }
    if (rawMessageDelivery) {
      Attributes['RawMessageDelivery'] = rawMessageDelivery;
    }
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol,
      Endpoint: endpoint,
      Attributes,
      ReturnSubscriptionArn: true,
    });
    const response = await snsClient.send(command);
    return NextResponse.json({ subscriptionArn: response.SubscriptionArn });
  } catch (error) {
    console.error('Erro ao criar assinatura SNS:', error);
    return NextResponse.json({ error: 'Erro ao criar assinatura SNS' }, { status: 500 });
  }
}
