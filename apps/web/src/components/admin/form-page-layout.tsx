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

interface FormPageLayoutProps<T> {
  pageTitle: string;
  pageDescription: string;
  icon?: LucideIcon;
  children: (formRef: React.RefObject<any>, initialData: T | null) => React.ReactNode;
  fetchAction: (id: string) => Promise<T | null>;
  deleteAction?: (id: string) => Promise<{ success: boolean; message: string; }>;
  deleteConfirmationMessage?: (item: T) => string;
  isEdit: boolean;
  entityId?: string;
}

export default function FormPageLayout<T>({
  pageTitle,
  pageDescription,
  icon: Icon,
  children,
  fetchAction,
  deleteAction,
  deleteConfirmationMessage,
  isEdit,
  entityId,
}: FormPageLayoutProps<T>) {
  const router = useRouter();
  const formRef = React.useRef<any>(null);

  const [initialData, setInitialData] = React.useState<T | null>(null);
  const [isViewMode, setIsViewMode] = React.useState(isEdit);
  const [isLoading, setIsLoading] = React.useState(isEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isEdit && entityId) {
      setIsLoading(true);
      fetchAction(entityId)
        .then(data => setInitialData(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [entityId, fetchAction, isEdit]);

  const handleSave = async () => {
    if (formRef.current && formRef.current.requestSubmit) {
      setIsSubmitting(true);
      await formRef.current.requestSubmit();
      setIsSubmitting(false);
      // O formulário interno deve lidar com o sucesso/erro e o toast
    }
  };

  const handleDelete = async () => {
    if (deleteAction && entityId) {
        await deleteAction(entityId);
    }
  };

  const entityName = initialData ? (initialData as any).name || (initialData as any).title || pageDescription : pageDescription;
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-8 w-8 text-primary" />}
              <div>
                <CardTitle className="text-2xl font-bold font-headline">{isEdit ? (isViewMode ? 'Visualizar' : 'Editar') : pageTitle}</CardTitle>
                <CardDescription>{isEdit ? entityName : pageDescription}</CardDescription>
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
            {children(formRef, initialData)}
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
