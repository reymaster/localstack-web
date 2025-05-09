"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Search, MessageSquare, Trash2, Send, Plus } from "lucide-react";
import { BackToDashboard } from "@/components/back-to-dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Queue = {
  QueueUrl: string;
  QueueName: string;
};

type Message = {
  MessageId: string;
  Body: string;
  Attributes: {
    [key: string]: string;
  };
  MessageAttributes?: { [key: string]: any };
  MD5OfBody?: string;
  MD5OfMessageAttributes?: string;
  SentTimestamp?: string;
  ReceiptHandle?: string;
  createdAt?: string;
};

const ITEMS_PER_PAGE = 5;

export default function SQSQueues() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [filteredQueues, setFilteredQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showMessagesDialog, setShowMessagesDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [showCreateQueueDialog, setShowCreateQueueDialog] = useState(false);
  const [newQueueName, setNewQueueName] = useState("");
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch('/api/sqs/queues');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQueues(data.queues || []);
        setFilteredQueues(data.queues || []);
      } catch (error) {
        console.error("Erro ao buscar filas SQS:", error);
        setError("Não foi possível carregar as filas SQS");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueues();
  }, []);

  useEffect(() => {
    const filtered = queues.filter(queue =>
      queue.QueueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      queue.QueueUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQueues(filtered);
    setCurrentPage(1);
  }, [searchTerm, queues]);

  const fetchMessages = async (queueUrl: string) => {
    setIsLoadingMessages(true);
    try {
      console.log('Buscando mensagens para:', queueUrl);
      const response = await fetch(`/api/sqs/messages?queueUrl=${encodeURIComponent(queueUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('Dados recebidos:', {
        count: data.count,
        queueUrl: data.queueUrl,
        messageCount: data.messages?.length || 0,
      });

      if (!Array.isArray(data.messages)) {
        console.error('Formato de resposta inválido:', data);
        throw new Error('Formato de resposta inválido');
      }

      setMessages(data.messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      setMessages([]);
      // Opcional: mostrar um toast ou alerta para o usuário
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const purgeQueue = async (queueUrl: string) => {
    setIsPurging(true);
    try {
      const response = await fetch('/api/sqs/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueUrl }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Recarregar mensagens após o purge
      await fetchMessages(queueUrl);
    } catch (error) {
      console.error("Erro ao limpar fila:", error);
    } finally {
      setIsPurging(false);
      setShowPurgeDialog(false);
    }
  };

  const handleMessagesClick = async (queue: Queue) => {
    setSelectedQueue(queue);
    setShowMessagesDialog(true);
    setMessageSearchTerm(""); // Limpa a busca ao abrir o diálogo
    await fetchMessages(queue.QueueUrl);
  };

  const handlePurgeClick = (queue: Queue) => {
    setSelectedQueue(queue);
    setShowPurgeDialog(true);
  };

  const handleSendMessage = async (queueUrl: string) => {
    setIsSending(true);
    try {
      const response = await fetch('/api/sqs/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueUrl, messageBody }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setMessageBody("");
      setShowSendDialog(false);
      await fetchMessages(queueUrl);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return;

    setIsCreatingQueue(true);
    try {
      const response = await fetch('/api/sqs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queueName: newQueueName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQueues(prevQueues => [...prevQueues, data.queue]);
      setNewQueueName("");
      setShowCreateQueueDialog(false);
    } catch (error) {
      console.error("Erro ao criar fila:", error);
    } finally {
      setIsCreatingQueue(false);
    }
  };

  const totalPages = Math.ceil(filteredQueues.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentQueues = filteredQueues.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            size="default"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              size="default"
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)} size="default">1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)} size="default">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              size="default"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const filteredMessages = messages.filter(message => {
    const searchTerm = messageSearchTerm.toLowerCase();
    return (
      message.MessageId.toLowerCase().includes(searchTerm) ||
      message.Body.toLowerCase().includes(searchTerm) ||
      JSON.stringify(message.Attributes).toLowerCase().includes(searchTerm)
    );
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const res = await fetch('/api/sqs/statistics');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
    interval = setInterval(fetchStats, 10000); // Atualiza a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-8 min-h-screen">
      <BackToDashboard />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Filas SQS</h1>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Filas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{loadingStats ? '-' : stats?.queues ?? '-'}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{loadingStats ? '-' : stats?.messages ?? '-'}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold text-primary">{loadingStats ? '-' : stats?.recentMessages ?? '-'}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              Lista de Filas
            </CardTitle>
            <Button
              onClick={() => setShowCreateQueueDialog(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Criar Nova Fila
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <span>Carregando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-600">
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar filas..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              {filteredQueues.length === 0 ? (
                <div className="flex items-center justify-center h-32 border rounded bg-gray-50 text-gray-600">
                  <span>Nenhuma fila encontrada</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {currentQueues.map((queue) => (
                      <div key={queue.QueueUrl} className="flex items-center justify-between p-3 border rounded bg-white">
                        <div>
                          <h3 className="font-medium">{queue.QueueName}</h3>
                          <p className="text-sm text-gray-500">{queue.QueueUrl}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMessagesClick(queue)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Mensagens
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedQueue(queue);
                              setMessageBody("");
                              setShowSendDialog(true);
                            }}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Mensagem
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePurgeClick(queue)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    {renderPagination()}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showMessagesDialog} onOpenChange={setShowMessagesDialog}>
        <DialogContent className="min-w-[50vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              Mensagens da Fila: {selectedQueue?.QueueName}
            </DialogTitle>
            <DialogDescription>
              Visualize as mensagens disponíveis nesta fila
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nas mensagens..."
              value={messageSearchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[60vh] pr-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando mensagens...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {messages.length === 0
                    ? "Nenhuma mensagem disponível"
                    : "Nenhuma mensagem encontrada com o termo de busca"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <Card key={message.MessageId}>
                    <CardHeader>
                      <CardTitle className="text-sm">ID da Mensagem: {message.MessageId}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Corpo da Mensagem:</h4>
                          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                            {message.Body}
                          </pre>
                        </div>
                        {message.SentTimestamp && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">SentTimestamp:</h4>
                            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                              {message.SentTimestamp}
                            </pre>
                          </div>
                        )}
                        {message.MD5OfBody && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">MD5 do Corpo:</h4>
                            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                              {message.MD5OfBody}
                            </pre>
                          </div>
                        )}
                        {message.MD5OfMessageAttributes && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">MD5 dos Atributos:</h4>
                            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                              {message.MD5OfMessageAttributes}
                            </pre>
                          </div>
                        )}
                        {message.createdAt && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Criado em:</h4>
                            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                              {message.createdAt}
                            </pre>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-sm mb-2">Atributos Personalizados:</h4>
                          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words">
                            {message.MessageAttributes && Object.keys(message.MessageAttributes).length > 0
                              ? JSON.stringify(message.MessageAttributes, null, 2)
                              : "{}"}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMessagesDialog(false);
                setMessageSearchTerm("");
              }}
              size="default"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar Mensagens</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja limpar todas as mensagens da fila{' '}
              <strong>{selectedQueue?.QueueName}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPurgeDialog(false)}
              disabled={isPurging}
              size="default"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedQueue && purgeQueue(selectedQueue.QueueUrl)}
              disabled={isPurging}
              size="default"
            >
              {isPurging ? 'Limpando...' : 'Limpar Mensagens'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription>
              Envie uma mensagem para a fila {selectedQueue?.QueueName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Corpo da Mensagem:</label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full h-32 p-2 mt-1 border rounded-md"
                placeholder="Digite o conteúdo da mensagem..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={isSending}
              size="default"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedQueue && handleSendMessage(selectedQueue.QueueUrl)}
              disabled={isSending || !messageBody.trim()}
              size="default"
            >
              {isSending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateQueueDialog} onOpenChange={setShowCreateQueueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Fila SQS</DialogTitle>
            <DialogDescription>
              Digite o nome para a nova fila SQS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Fila:</label>
              <Input
                value={newQueueName}
                onChange={(e) => setNewQueueName(e.target.value)}
                placeholder="Digite o nome da fila..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateQueueDialog(false)}
              disabled={isCreatingQueue}
              size="default"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateQueue}
              disabled={isCreatingQueue || !newQueueName.trim()}
              size="default"
            >
              {isCreatingQueue ? "Criando..." : "Criar Fila"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
