'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { BackToDashboard } from '@/components/back-to-dashboard';

interface Bucket {
  name: string;
  creationDate: string;
}

interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

export default function S3Management() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [newBucketName, setNewBucketName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [isObjectsDialogOpen, setIsObjectsDialogOpen] = useState(false);
  const [isUploadingObject, setIsUploadingObject] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openObjectsDialog = async (bucketName: string) => {
    setSelectedBucket(bucketName);
    setIsObjectsDialogOpen(true);
    await fetchObjects(bucketName);
  };

  const closeObjectsDialog = () => {
    setIsObjectsDialogOpen(false);
    setObjects([]);
    setSelectedBucket(null);
  };

  const fetchObjects = async (bucketName: string) => {
    try {
      const response = await fetch(`/api/s3/buckets/${bucketName}/files`);
      const data = await response.json();
      const objs = (data || []).map((obj: any) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
      setObjects(objs);
    } catch (error) {
      toast.error('Erro ao carregar objetos');
    }
  };

  const handleShowDropzone = () => setShowDropzone(true);
  const handleHideDropzone = () => setShowDropzone(false);

  const handleObjectUpload = async (e: React.ChangeEvent<HTMLInputElement> | File[] | File | null) => {
    let files: File[] = [];
    if (e && 'target' in e) {
      files = Array.from(e.target.files || []);
    } else if (Array.isArray(e)) {
      files = e;
    } else if (e instanceof File) {
      files = [e];
    }
    if (!files.length || !selectedBucket) return;
    setIsUploadingObject(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`/api/s3/buckets/${selectedBucket}/upload`, {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          toast.success(`Arquivo "${file.name}" enviado com sucesso`);
        } else {
          toast.error(`Erro ao enviar "${file.name}"`);
        }
      }
      fetchObjects(selectedBucket);
      setShowDropzone(false);
    } catch (error) {
      toast.error('Erro ao enviar arquivos');
    } finally {
      setIsUploadingObject(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!selectedBucket) return;
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    await handleObjectUpload(files);
  };

  const deleteObject = async (key: string) => {
    if (!selectedBucket) return;
    if (!confirm(`Tem certeza que deseja excluir o objeto ${key}?`)) return;
    try {
      const response = await fetch(`/api/s3/buckets/${selectedBucket}/files/${key}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Objeto excluído com sucesso');
        fetchObjects(selectedBucket);
      } else {
        throw new Error('Falha ao excluir objeto');
      }
    } catch (error) {
      toast.error('Erro ao excluir objeto');
    }
  };

  const viewObject = (key: string) => {
    if (!selectedBucket) return;
    const url = `/api/s3/buckets/${selectedBucket}/files/${key}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  const filteredBuckets = buckets.filter((bucket) =>
    bucket.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <BackToDashboard />
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
                  <td className="px-6 py-4 border-b text-center flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openObjectsDialog(bucket.name)}
                    >
                      Ver Objetos
                    </Button>
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

      {/* Dialog de Objetos do Bucket */}
      <Dialog open={isObjectsDialogOpen} onOpenChange={closeObjectsDialog}>
        <DialogContent className="min-w-[60vw] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Objetos do Bucket: <span className="font-mono">{selectedBucket}</span></DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={handleShowDropzone}
              disabled={isUploadingObject}
            >
              Fazer Upload
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleObjectUpload}
              disabled={isUploadingObject}
              multiple
            />
          </div>
          {showDropzone ? (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 cursor-pointer hover:border-primary transition relative"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ minHeight: 200 }}
            >
              <span className="mb-2">Arraste e solte arquivos aqui para fazer upload</span>
              <span className="text-xs mb-4">ou clique para selecionar (vários arquivos suportados)</span>
              <Button variant="outline" className="absolute top-2 right-2" size="sm" onClick={e => { e.stopPropagation(); handleHideDropzone(); }}>Cancelar</Button>
            </div>
          ) : (
            objects.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 cursor-pointer hover:border-primary transition"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                style={{ minHeight: 200 }}
              >
                <span className="mb-2">Arraste e solte arquivos aqui para fazer upload</span>
                <span className="text-xs">ou clique para selecionar (vários arquivos suportados)</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 w-full">
                <table className="min-w-full w-full bg-white">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Nome</th>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Tamanho</th>
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Modificado em</th>
                      <th className="px-4 py-2 border-b text-center text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objects.map((obj) => (
                      <tr key={obj.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b font-mono">{obj.key}</td>
                        <td className="px-4 py-2 border-b">{obj.size ? (obj.size / 1024).toFixed(2) + ' KB' : '-'}</td>
                        <td className="px-4 py-2 border-b">{obj.lastModified ? new Date(obj.lastModified).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 border-b text-center flex gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => viewObject(obj.key)}>Visualizar</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteObject(obj.key)}>Excluir</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
