'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

export default function BucketFiles() {
  const params = useParams();
  const bucketName = params.bucketName as string;
  const [files, setFiles] = useState<S3Object[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/s3/buckets/${bucketName}/files`);
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      toast.error('Erro ao carregar arquivos');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/s3/buckets/${bucketName}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Arquivo enviado com sucesso');
        fetchFiles();
      } else {
        throw new Error('Falha ao enviar arquivo');
      }
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = async (key: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo ${key}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/s3/buckets/${bucketName}/files/${key}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Arquivo excluído com sucesso');
        fetchFiles();
      } else {
        throw new Error('Falha ao excluir arquivo');
      }
    } catch (error) {
      toast.error('Erro ao excluir arquivo');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [bucketName]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Arquivos do Bucket: {bucketName}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {files.map((file) => (
          <Card key={file.key}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{file.key}</span>
                <Button
                  variant="destructive"
                  onClick={() => deleteFile(file.key)}
                >
                  Excluir
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
              <p>Última modificação: {new Date(file.lastModified).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
