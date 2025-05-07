import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:4566/_localstack/health');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao verificar saúde do LocalStack:', error);
    return NextResponse.json({ error: 'Falha ao conectar com LocalStack' }, { status: 500 });
  }
}
