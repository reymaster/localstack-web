// app/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Server, Database, Cloud, List, DollarSign } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const services = [
  { name: "Lambda", icon: <Server /> },
  { name: "API Gateway", icon: <Cloud /> },
  { name: "S3", icon: <Database /> },
  { name: "SQS", icon: <List /> },
  { name: "SNS", icon: <List /> },
];

type ServiceStatus = {
  [key: string]: 'running' | 'available' | 'disabled';
};

export default function Home() {
  const [localstackServices, setLocalstackServices] = useState<ServiceStatus | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkServices = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLocalstackServices(data.services);
      } catch (error) {
        console.error("Erro ao conectar com LocalStack:", error);
        setLocalstackServices({});
      }
    };

    checkServices();
  }, []);

  const runningServices = localstackServices
    ? Object.entries(localstackServices)
        .filter(([_, status]) => status === 'running')
        .map(([service]) => service)
    : [];

  const availableServices = localstackServices
    ? Object.entries(localstackServices)
        .filter(([_, status]) => status === 'available')
        .map(([service]) => service)
    : [];

  const renderServiceCard = (title: string, serviceList: string[], emptyMessage: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!isClient || localstackServices === null ? (
          <div className="flex items-center justify-center h-32">
            <span>Carregando...</span>
          </div>
        ) : serviceList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border rounded bg-gray-50 text-gray-600">
            <span>{emptyMessage}</span>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-1 gap-2">
              {serviceList.map((serviceName) => {
                const serviceInfo = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
                const servicePath = serviceName.toLowerCase() === 'sqs' ? '/sqs' :
                                  serviceName.toLowerCase() === 'sns' ? '/sns' :
                                  serviceName.toLowerCase() === 's3' ? '/s3' : '#';
                return (
                  <div key={serviceName} className="flex items-center gap-3 p-3 border rounded bg-white hover:bg-gray-50 transition-colors">
                    {serviceInfo?.icon || <Server className="w-5 h-5" />}
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {servicePath !== '#' ? (
                          <Link
                            href={servicePath}
                            className="block hover:text-blue-600 transition-colors"
                          >
                            {serviceInfo?.name || serviceName}
                          </Link>
                        ) : (
                          serviceInfo?.name || serviceName
                        )}
                      </h3>
                      <p className="text-sm text-green-600">Ativo</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Console LocalStack</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderServiceCard(
          "Todos os Serviços",
          Object.keys(localstackServices || {}),
          "Nenhum serviço encontrado"
        )}
        {renderServiceCard(
          "Serviços em Execução",
          runningServices,
          "Nenhum serviço em execução"
        )}
        {renderServiceCard(
          "Serviços Disponíveis",
          availableServices,
          "Nenhum serviço disponível"
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Bem-vindo */}
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao LocalStack</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-4">
              <li>Documentação</li>
              <li>Tutoriais</li>
              <li>Comunidade</li>
            </ul>
          </CardContent>
        </Card>
        {/* Saúde */}
        <Card>
          <CardHeader>
            <CardTitle>Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <span>Sem dados de saúde</span>
          </CardContent>
        </Card>
        {/* Custos */}
        <Card>
          <CardHeader>
            <CardTitle>
              <DollarSign className="inline mr-2" />
              Custos e Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li className="text-red-600">Acesso negado</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
