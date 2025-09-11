// src/components/admin/form-page-layout.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, XCircle, ChevronLeft, ChevronRight, Copy, PlusCircle, Trash2, Edit, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormPageLayoutProps<T> {
  pageTitle: string;
  fetchAction: (id: string) => Promise<T | null>;
  deleteAction?: (id: string) => Promise<{ success: boolean; message: string; }>;
  entityId?: string;
  entityName?: string;
  routeBase?: string;
  icon?: LucideIcon;
  children: (initialData: T | null, formRef: React.RefObject<any>, handleSubmit: (submitFn: () => Promise<any>) => void) => React.ReactNode;
  isEdit: boolean;
  pageDescription?: string;
  deleteConfirmation?: (item: T) => boolean;
  deleteConfirmationMessage?: (item: T) => string;
}

export default function FormPageLayout<T extends { id: string, name?: string | null, title?: string | null }>({
  pageTitle,
  pageDescription,
  icon: Icon,
  children,
  fetchAction,
  deleteAction,
  deleteConfirmation,
  deleteConfirmationMessage,
  isEdit,
  entityId,
  entityName,
  routeBase,
}: FormPageLayoutProps<T>) {
  const router = useRouter();
  const formRef = React.useRef<any>(null);
  const { toast } = useToast();

  const [initialData, setInitialData] = React.useState<T | null>(null);
  const [isViewMode, setIsViewMode] = React.useState(isEdit);
  const [isLoading, setIsLoading] = React.useState(isEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (isEdit && entityId) {
      setIsLoading(true);
      try {
        const data = await fetchAction(entityId);
        if (data) {
          setInitialData(data);
        } else {
          router.push(routeBase || '/admin/dashboard');
          toast({ title: "Erro", description: `${entityName} não encontrado.`, variant: "destructive" });
        }
      } catch (e: any) {
        console.error(`Failed to fetch ${entityName}:`, e);
        toast({ title: "Erro", description: `Falha ao buscar dados d${entityName === 'Cidade' || entityName === 'Comarca' ? 'a' : 'o'} ${entityName}.`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  }, [isEdit, entityId, fetchAction, router, toast, entityName, routeBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (submitFn: () => Promise<any>) => {
    setIsSubmitting(true);
    const result = await submitFn();
    setIsSubmitting(false);
    if (result && result.success) {
      toast({ title: 'Sucesso!', description: `${entityName} salvo com sucesso.` });
      fetchData(); // Refetch data to show latest updates
      setIsViewMode(true); // Return to view mode on success
    } else if(result) {
      toast({ title: `Erro ao Salvar ${entityName}`, description: result.message, variant: 'destructive' });
    }
  };
  
  const handleSave = () => {
    formRef.current?.requestSubmit();
  }

  const handleDelete = async () => {
    if (deleteAction && entityId) {
        const itemToDelete = initialData;
        if (deleteConfirmation && itemToDelete && !deleteConfirmation(itemToDelete)) {
            toast({ title: "Ação não permitida", description: deleteConfirmationMessage ? deleteConfirmationMessage(itemToDelete) : `Este item não pode ser excluído.`, variant: "destructive" });
            return;
        }

        const result = await deleteAction(entityId);
        if (result.success) {
            toast({ title: "Sucesso! 개발!", description: result.message });
            router.push(routeBase || '/admin/dashboard');
            router.refresh(); // Ensure the list page is updated
        } else {
            toast({ title: "Erro ao Excluir", description: result.message, variant: "destructive" });
        }
    }
  };

  const finalTitle = isEdit ? (isViewMode ? 'Visualizar' : 'Editar') : pageTitle;
  const finalDescription = isEdit ? (initialData?.name || initialData?.title || 'Carregando...') : pageDescription || '';
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  if (isEdit && !initialData) {
     return <div className="text-center py-10">Não foi possível carregar os dados para este registro.</div>;
  }

  return (
    <Card className="shadow-lg w-full" data-ai-id={`form-page-layout-${entityId || 'new'}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-8 w-8 text-primary" />}
              <div>
                <CardTitle className="text-2xl font-bold font-headline">{finalTitle}</CardTitle>
                <CardDescription>{finalDescription}</CardDescription>
              </div>
            </div>
            {isEdit && (
                 <div className="flex items-center gap-2">
                    {isViewMode ? (
                        <Button onClick={() => setIsViewMode(false)}>
                            <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
                        </Button>
                    ) : (
                         <>
                            <Button variant="outline" onClick={() => setIsViewMode(true)} disabled={isSubmitting}>
                                <XCircle className="mr-2 h-4 w-4" /> Cancelar Edição
                            </Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                Salvar Alterações
                            </Button>
                        </>
                    )}
                 </div>
            )}
        </div>
      </CardHeader>
      <fieldset disabled={isViewMode || isSubmitting} className="group">
        <CardContent className="p-6 bg-secondary/20 group-disabled:bg-muted/10 group-disabled:cursor-not-allowed">
            {initialData ? children(initialData, formRef, handleSubmit) : children(null, formRef, handleSubmit)}
        </CardContent>
        {!isEdit && ( // Footer with actions only for NEW pages
            <CardFooter className="flex justify-end p-6 border-t">
                 <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Criar Registro
                </Button>
            </CardFooter>
        )}
      </fieldset>
    </Card>
  );
}
