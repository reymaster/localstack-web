"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { BackToDashboard } from '@/components/back-to-dashboard';
import Image from 'next/image';

export default function SNSDashboard() {
  const [search, setSearch] = useState('');
  const [topics, setTopics] = useState<{ name: string; arn: string }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ name: string; arn: string } | null>(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [addProtocol, setAddProtocol] = useState('email');
  const [addEndpoint, setAddEndpoint] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterPolicy, setFilterPolicy] = useState('');
  const [redrivePolicy, setRedrivePolicy] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sqsQueues, setSqsQueues] = useState<{ QueueUrl: string; QueueName: string }[]>([]);
  const [showRawDelivery, setShowRawDelivery] = useState(false);

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

  // Buscar filas SQS quando protocolo for sqs
  useEffect(() => {
    if (addProtocol === 'sqs') {
      fetch('/api/sqs/queues')
        .then(res => res.json())
        .then(data => setSqsQueues(data.queues || []));
    }
  }, [addProtocol]);

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

  // Função para abrir modal de assinaturas
  async function handleOpenSubscriptions(topic: { name: string; arn: string }) {
    setSelectedTopic(topic);
    setShowSubscriptions(true);
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/sns/subscriptions?topicArn=${encodeURIComponent(topic.arn)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar assinaturas');
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setSubscriptions([]);
    } finally {
      setLoadingSubs(false);
    }
  }

  // Função para remover assinatura
  async function handleRemoveSubscription(subscriptionArn: string) {
    if (!window.confirm('Tem certeza que deseja remover esta assinatura?')) return;
    try {
      const res = await fetch('/api/sns/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionArn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover assinatura');
      setSubscriptions(prev => prev.filter((s: any) => s.SubscriptionArn !== subscriptionArn));
    } catch (err) {
      alert('Erro ao remover assinatura');
    }
  }

  // Função para abrir modal de publicação
  function handleOpenPublish(topic: { name: string; arn: string }) {
    setSelectedTopic(topic);
    setPublishMessage('');
    setPublishResult(null);
    setShowPublish(true);
  }

  // Função para publicar mensagem
  async function handlePublish() {
    if (!selectedTopic || !publishMessage.trim()) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch('/api/sns/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicArn: selectedTopic.arn, message: publishMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao publicar mensagem');
      setPublishResult('Mensagem publicada com sucesso!');
      setPublishMessage('');
    } catch (err: any) {
      setPublishResult(err.message || 'Erro ao publicar mensagem');
    } finally {
      setPublishing(false);
    }
  }

  // Função para adicionar assinatura
  async function handleAddSubscription() {
    if (!selectedTopic || !addProtocol || !addEndpoint.trim()) return;
    setAdding(true);
    setJsonError(null);
    let filterPolicyObj = undefined;
    let redrivePolicyObj = undefined;
    try {
      if (filterPolicy.trim()) {
        filterPolicyObj = JSON.parse(filterPolicy);
      }
      if (redrivePolicy.trim()) {
        redrivePolicyObj = JSON.parse(redrivePolicy);
      }
    } catch (e) {
      setJsonError('JSON inválido em Filter Policy ou Redrive Policy');
      setAdding(false);
      return;
    }
    try {
      const res = await fetch('/api/sns/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicArn: selectedTopic.arn,
          protocol: addProtocol,
          endpoint: addEndpoint,
          filterPolicy: filterPolicyObj,
          redrivePolicy: redrivePolicyObj,
          rawMessageDelivery: showRawDelivery ? 'true' : 'false',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar assinatura');
      // Atualiza lista
      await handleOpenSubscriptions(selectedTopic);
      setAddEndpoint('');
      setFilterPolicy('');
      setRedrivePolicy('');
      setShowAdvanced(false);
    } catch (err) {
      alert('Erro ao adicionar assinatura');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
        <BackToDashboard />
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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Application-to-application (A2A)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[30%_70%] gap-2">
                <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                        O SNS permite desacoplar publicadores de assinantes, ideal para microserviços, sistemas distribuídos e aplicações serverless.
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc ml-4">
                        <li>Mensageria Pub/Sub gerenciada</li>
                        <li>Filtragem e fanout de mensagens</li>
                        <li>Integração com Lambda, SQS, HTTP, Email</li>
                    </ul>
                </div>
                <div>
                    <Image src="/sns-a2a.png" alt="A2A" width={800} height={300} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application-to-person (A2P)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[30%_70%] gap-2">
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Envie notificações push, SMS e emails para usuários finais ou endpoints móveis.
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc ml-4">
                    <li>Push para apps móveis</li>
                    <li>Envio de SMS e emails</li>
                    <li>Fanout para múltiplos canais</li>
                  </ul>
                </div>
                <div>
                    <Image src="/sns-a2p.png" alt="A2P" width={800} height={300} />
                </div>
              </div>
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
                          <Button variant="outline" size="sm" onClick={() => handleOpenSubscriptions(topic)}>Assinaturas</Button>
                          <Button variant="outline" size="sm" onClick={() => handleOpenPublish(topic)}>Publicar</Button>
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
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Fechar</Button>
              <Button onClick={handleCreateTopic} disabled={creating || !newTopicName.trim()}>
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Assinaturas */}
      {showSubscriptions && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Assinaturas do tópico: <span className="font-mono">{selectedTopic.name}</span></h3>
            {loadingSubs ? (
              <div>Carregando assinaturas...</div>
            ) : (
              <ul className="mb-4 divide-y">
                {subscriptions.length === 0 ? (
                  <li className="py-2 text-gray-500">Nenhuma assinatura encontrada.</li>
                ) : subscriptions.map((sub, idx) => (
                  <li key={sub.SubscriptionArn || idx} className="py-2 flex justify-between items-center">
                    <span className="text-sm">{sub.Protocol}: <span className="font-mono">{sub.Endpoint}</span></span>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveSubscription(sub.SubscriptionArn)}>Remover</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 mt-4">
              <label className="font-medium">Protocolo</label>
              <select
                className="border rounded px-2 py-1"
                value={addProtocol}
                onChange={e => setAddProtocol(e.target.value)}
                disabled={adding}
              >
                <option value="email">email</option>
                <option value="lambda">lambda</option>
                <option value="http">http</option>
                <option value="https">https</option>
                <option value="sms">sms</option>
                <option value="sqs">sqs</option>
              </select>
              <label className="font-medium">Endpoint</label>
              {addProtocol === 'sqs' ? (
                <select
                  className="border rounded px-2 py-1"
                  value={addEndpoint}
                  onChange={e => setAddEndpoint(e.target.value)}
                  disabled={adding}
                >
                  <option value="">Selecione a fila SQS</option>
                  {sqsQueues.map(q => (
                    <option key={q.QueueUrl} value={`arn:aws:sqs:us-east-1:000000000000:${q.QueueName}`}>{`arn:aws:sqs:us-east-1:000000000000:${q.QueueName}`}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="border rounded px-2 py-1"
                  placeholder={
                    addProtocol === 'email' ? 'exemplo@dominio.com' :
                    addProtocol === 'lambda' ? 'arn:aws:lambda:us-east-1:000000000000:function:minha-funcao' :
                    addProtocol === 'http' ? 'http://meu-endpoint.com/path' :
                    addProtocol === 'https' ? 'https://meu-endpoint.com/path' :
                    addProtocol === 'sms' ? '+5511999999999' :
                    'Endpoint'
                  }
                  value={addEndpoint}
                  onChange={e => setAddEndpoint(e.target.value)}
                  disabled={adding}
                />
              )}
              {addProtocol === 'sqs' && (
                <div className="text-xs text-muted-foreground mb-2">Somente filas SQS padrão podem receber notificações de tópicos SNS padrão.</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={showRawDelivery}
                  onChange={e => setShowRawDelivery(e.target.checked)}
                  disabled={adding}
                  id="raw-delivery"
                />
                <label htmlFor="raw-delivery" className="text-sm">Enable raw message delivery</label>
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded px-3 py-2 my-3">
                Após criar a assinatura, pode ser necessário confirmá-la dependendo do protocolo.
              </div>
              <button
                type="button"
                className="text-blue-600 text-sm mt-2 underline self-start"
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas'}
              </button>
              {showAdvanced && (
                <div className="mt-2 border rounded p-3 bg-gray-50">
                  <label className="font-medium">Subscription filter policy (JSON)</label>
                  <textarea
                    className="border rounded px-2 py-1 w-full mb-2"
                    rows={2}
                    placeholder='{ "eventType": ["order_created"] }'
                    value={filterPolicy}
                    onChange={e => setFilterPolicy(e.target.value)}
                    disabled={adding}
                  />
                  <label className="font-medium">Redrive policy (dead-letter queue) (JSON)</label>
                  <textarea
                    className="border rounded px-2 py-1 w-full"
                    rows={2}
                    placeholder='{ "deadLetterTargetArn": "arn:aws:sqs:us-east-1:000000000000:minha-dlq" }'
                    value={redrivePolicy}
                    onChange={e => setRedrivePolicy(e.target.value)}
                    disabled={adding}
                  />
                </div>
              )}
              {jsonError && <div className="text-red-600 text-sm mt-1">{jsonError}</div>}
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setShowSubscriptions(false)} disabled={adding}>Fechar</Button>
                <Button onClick={handleAddSubscription} disabled={adding || !addEndpoint.trim()}>
                  {adding ? 'Adicionando...' : 'Criar assinatura'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Publicar Mensagem */}
      {showPublish && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Publicar mensagem em: <span className="font-mono">{selectedTopic.name}</span></h3>
            <textarea
              className="border rounded px-3 py-2 w-full mb-4"
              rows={5}
              placeholder="Digite a mensagem..."
              value={publishMessage}
              onChange={e => setPublishMessage(e.target.value)}
              disabled={publishing}
            />
            {publishResult && <div className={`mb-2 ${publishResult.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>{publishResult}</div>}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => setShowPublish(false)} disabled={publishing}>Fechar</Button>
              <Button onClick={handlePublish} disabled={publishing || !publishMessage.trim()}>
                {publishing ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
