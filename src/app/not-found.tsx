"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-6 h-6" />
            Página não encontrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">404</h2>
            <p className="text-gray-600">
              Desculpe, a página que você está procurando ainda não está disponível.
            </p>
          </div>
          <div className="flex justify-center">
            <Link href="/">
              <Button variant="default">
                Voltar para o Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
