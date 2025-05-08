import { NextResponse } from 'next/server';

export async function GET() {
  // Mock de estatísticas para a dashboard SNS
  return NextResponse.json({
    topics: 22,
    platformApplications: 0,
    subscriptions: 3,
    messagesPublished: 1200,
    messagesDelivered: 1180,
    deadLettered: 5,
  });
}
