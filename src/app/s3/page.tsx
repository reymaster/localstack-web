'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Bucket {
  name: string;
  creationDate: string;
}

export default function S3Management() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [newBucketName, setNewBucketName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const fetchBuckets = async () => {
    try {
      const response = await fetch('/api/s3/buckets');
      const data = await response.json();
      const buckets = (data || []).map((bucket: any) => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate,
      }));
      setBuckets(buckets);
    } catch (error) {
      toast.error('Erro ao carregar buckets');
    }
  };

  const createBucket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBucketName) {
      toast.error('Nome do bucket é obrigatório');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/s3/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBucketName }),
      });
      if (response.ok) {
        toast.success('Bucket criado com sucesso');
        setNewBucketName('');
        setOpenDialog(false);
        fetchBuckets();
      } else {
        throw new Error('Falha ao criar bucket');
      }
    } catch (error) {
      toast.error('Erro ao criar bucket');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBucket = async (bucketName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o bucket ${bucketName}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/s3/buckets/${bucketName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Bucket excluído com sucesso');
        fetchBuckets();
      } else {
        throw new Error('Falha ao excluir bucket');
      }
    } catch (error) {
      toast.error('Erro ao excluir bucket');
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  const filteredBuckets = buckets.filter((bucket) =>
    bucket.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Buckets S3</h1>

      <div className="mb-4 flex justify-between items-center gap-2 flex-wrap">
        <span className="font-semibold text-lg">Buckets Criados</span>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Pesquisar bucket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="default">Criar Bucket</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Bucket</DialogTitle>
              </DialogHeader>
              <form onSubmit={createBucket} className="flex flex-col gap-4 mt-2">
                <Input
                  placeholder="Nome do bucket"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  autoFocus
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Bucket'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Criado em</th>
              <th className="px-6 py-3 border-b text-center text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuckets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhum bucket encontrado.</td>
              </tr>
            ) : (
              filteredBuckets.map((bucket) => (
                <tr key={bucket.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b font-mono">{bucket.name}</td>
                  <td className="px-6 py-4 border-b">{bucket.creationDate ? new Date(bucket.creationDate).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 border-b text-center">
                    <Button
                      variant="destructive"
                      onClick={() => deleteBucket(bucket.name)}
                      size="sm"
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
