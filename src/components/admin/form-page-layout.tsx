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

interface FormPageLayoutProps {
  formTitle: string;
  formDescription: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  isViewMode?: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onSave?: () => void;
  onSaveAndNew?: () => void;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
  onEnterEditMode?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

function FormToolbar({
  isViewMode,
  isSubmitting,
  onSave,
  onSaveAndNew,
  onDelete,
  onEnterEditMode,
  onNavigateNext,
  onNavigatePrev,
  hasNext,
  hasPrev,
}: Pick<FormPageLayoutProps, 'isViewMode' | 'isSubmitting' | 'onSave' | 'onSaveAndNew' | 'onDelete' | 'onEnterEditMode' | 'onNavigateNext' | 'onNavigatePrev' | 'hasNext' | 'hasPrev'>) {
  
  if (isViewMode) {
    return (
        <div className="flex justify-between items-center w-full" data-ai-id="form-page-toolbar-view-mode">
             <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={onNavigatePrev} disabled={!hasPrev}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" onClick={onNavigateNext} disabled={!hasNext}><ChevronRight className="h-4 w-4" /></Button>
             </div>
             <Button onClick={onEnterEditMode}>
                <Edit className="mr-2 h-4 w-4" /> Entrar em Modo de Edição
             </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2" data-ai-id="form-page-toolbar-edit-mode">
      <div className="flex items-center gap-2">
        {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /> Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente este registro do banco de dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Confirmar Exclusão</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )}
        <Button variant="outline" size="sm" disabled={true}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
      </div>
      <div className="flex items-center gap-2">
        {onSaveAndNew && (
            <Button variant="secondary" onClick={onSaveAndNew} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar e Novo
            </Button>
        )}
        {onSave && (
            <Button onClick={onSave} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar
            </Button>
        )}
      </div>
    </div>
  );
}

export default function FormPageLayout({
  formTitle,
  formDescription,
  icon: Icon,
  children,
  isViewMode = false,
  isLoading = false,
  isSubmitting = false,
  onSave,
  onSaveAndNew,
  onDelete,
  onCancel,
  onEnterEditMode,
  onNavigateNext,
  onNavigatePrev,
  hasNext,
  hasPrev,
}: FormPageLayoutProps) {
  const router = useRouter();

  const handleCancel = onCancel || (() => router.back());

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full" data-ai-id="form-page-loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <Card className="shadow-lg w-full" data-ai-id="form-page-layout-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-8 w-8 text-primary" />}
              <div>
                <CardTitle className="text-2xl font-bold font-headline">{formTitle}</CardTitle>
                <CardDescription>{formDescription}</CardDescription>
              </div>
            </div>
            <div className="hidden sm:block">
                 <FormToolbar 
                    isViewMode={isViewMode} 
                    isSubmitting={isSubmitting}
                    onSave={onSave}
                    onSaveAndNew={onSaveAndNew}
                    onDelete={onDelete}
                    onEnterEditMode={onEnterEditMode}
                    onNavigateNext={onNavigateNext}
                    onNavigatePrev={onNavigatePrev}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                />
            </div>
        </div>
      </CardHeader>
      <fieldset disabled={isViewMode || isSubmitting} className="group" data-ai-id="form-page-fieldset">
        <CardContent className="p-6 bg-secondary/20 group-disabled:bg-background/20 group-disabled:cursor-not-allowed">
            {children}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 p-6 border-t">
             <div className="sm:hidden w-full">
                 <FormToolbar 
                    isViewMode={isViewMode} 
                    isSubmitting={isSubmitting}
                    onSave={onSave}
                    onSaveAndNew={onSaveAndNew}
                    onDelete={onDelete}
                    onEnterEditMode={onEnterEditMode}
                    onNavigateNext={onNavigateNext}
                    onNavigatePrev={onNavigatePrev}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                 />
            </div>
            {!isViewMode && (
                <div className="w-full flex justify-end">
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        <XCircle className="mr-2 h-4 w-4"/> Cancelar
                    </Button>
                </div>
            )}
        </CardFooter>
      </fieldset>
    </Card>
  );
}
