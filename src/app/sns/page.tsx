"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

export default function SNSDashboard() {
  const [search, setSearch] = useState('');
  const [topics, setTopics] = useState<{ name: string; arn: string }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Buscar estatísticas e tópicos
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsRes, topicsRes] = await Promise.all([
          fetch('/api/sns/statistics'),
          fetch('/api/sns/list'),
        ]);
        const statsData = await statsRes.json();
        const topicsData = await topicsRes.json();
        setStats(statsData);
        setTopics(topicsData.topics || []);
      } catch (err) {
        setError('Erro ao carregar dados do SNS');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  async function handleCreateTopic() {
    if (!newTopicName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/sns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName: newTopicName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar tópico');
      setTopics(prev => [...prev, { name: data.topicName, arn: data.topicArn }]);
      setShowCreate(false);
      setNewTopicName('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tópico');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Amazon SNS</h1>
      {/* Resumo dos recursos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Tópicos</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{stats ? stats.topics : '-'}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aplicações de Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{stats ? stats.platformApplications : '-'}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{stats ? stats.subscriptions : '-'}</span>
          </CardContent>
        </Card>
      </div>

      {/* Visão geral do SNS */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Visão Geral do Amazon SNS</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Application-to-application (A2A)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">
                O SNS permite desacoplar publicadores de assinantes, ideal para microserviços, sistemas distribuídos e aplicações serverless.
              </p>
              <ul className="text-xs text-muted-foreground list-disc ml-4">
                <li>Mensageria Pub/Sub gerenciada</li>
                <li>Filtragem e fanout de mensagens</li>
                <li>Integração com Lambda, SQS, HTTP, Email</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application-to-person (A2P)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">
                Envie notificações push, SMS e emails para usuários finais ou endpoints móveis.
              </p>
              <ul className="text-xs text-muted-foreground list-disc ml-4">
                <li>Push para apps móveis</li>
                <li>Envio de SMS e emails</li>
                <li>Fanout para múltiplos canais</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lista de tópicos SNS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tópicos SNS</h2>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Tópico
          </Button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar tópicos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-1/2"
          />
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <Card>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">Carregando...</div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                {filteredTopics.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Nenhum tópico encontrado
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filteredTopics.map(topic => (
                      <li key={topic.arn} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <span className="font-mono text-sm font-medium">{topic.name}</span>
                          <div className="text-xs text-muted-foreground">{topic.arn}</div>
                        </div>
                        <div className="mt-2 md:mt-0 flex gap-2">
                          <Button variant="outline" size="sm">Assinaturas</Button>
                          <Button variant="outline" size="sm">Publicar</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Modal simples para criar tópico */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar novo tópico SNS</h3>
            <input
              type="text"
              placeholder="Nome do tópico"
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-4"
              disabled={creating}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Cancelar</Button>
              <Button onClick={handleCreateTopic} disabled={creating || !newTopicName.trim()}>
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
