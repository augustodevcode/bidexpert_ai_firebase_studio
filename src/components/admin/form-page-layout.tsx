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
  isValid?: boolean; // Novo prop para o estado de validade do formulário
  headerActions?: React.ReactNode; 
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
  isValid,
  onSave,
  onSaveAndNew,
  onDelete,
  onEnterEditMode,
  onNavigateNext,
  onNavigatePrev,
  hasNext,
  hasPrev,
}: Pick<FormPageLayoutProps, 'isViewMode' | 'isSubmitting' | 'isValid' | 'onSave' | 'onSaveAndNew' | 'onDelete' | 'onEnterEditMode' | 'onNavigateNext' | 'onNavigatePrev' | 'hasNext' | 'hasPrev'>) {
  
  if (isViewMode) {
    return (
        <div className="wrapper-form-toolbar-view" data-ai-id="form-page-toolbar-view-mode">
             <div className="wrapper-nav-controls">
                <Button size="icon" variant="outline" onClick={onNavigatePrev} disabled={!hasPrev} data-ai-id="form-page-btn-prev" className="btn-nav-prev"><ChevronLeft className="icon-nav-control" /></Button>
                <Button size="icon" variant="outline" onClick={onNavigateNext} disabled={!hasNext} data-ai-id="form-page-btn-next" className="btn-nav-next"><ChevronRight className="icon-nav-control" /></Button>
             </div>
             <Button onClick={onEnterEditMode} data-ai-id="form-page-btn-edit-mode" className="btn-enter-edit">
                <Edit className="icon-btn-start" /> Entrar em Modo de Edição
             </Button>
        </div>
    )
  }

  return (
    <div className="wrapper-form-toolbar-edit" data-ai-id="form-page-toolbar-edit-mode">
      <div className="wrapper-toolbar-actions-left">
        {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isSubmitting} data-ai-id="form-page-btn-delete-trigger" className="btn-delete-record"><Trash2 className="icon-btn-start" /> Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="content-alert-dialog">
                <AlertDialogHeader className="header-alert-dialog">
                  <AlertDialogTitle className="title-alert-dialog">Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="desc-alert-dialog">
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente este registro do banco de dados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="footer-alert-dialog">
                  <AlertDialogCancel className="btn-alert-cancel">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="btn-alert-confirm" data-ai-id="form-page-btn-delete-confirm">Confirmar Exclusão</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        )}
        <Button variant="outline" size="sm" disabled={true} className="btn-print-record"><Printer className="icon-btn-start" /> Imprimir</Button>
      </div>
      <div className="wrapper-toolbar-actions-right">
        {onSaveAndNew && (
            <Button variant="secondary" onClick={onSaveAndNew} disabled={isSubmitting || !isValid} data-ai-id="form-page-btn-save-new" className="btn-save-new-record">
                {isSubmitting ? <Loader2 className="icon-btn-spinner"/> : <Save className="icon-btn-start" />}
                Salvar e Novo
            </Button>
        )}
        {onSave && (
            <Button onClick={onSave} disabled={isSubmitting || !isValid} data-ai-id="form-page-btn-save" className="btn-save-record">
                {isSubmitting ? <Loader2 className="icon-btn-spinner"/> : <Save className="icon-btn-start" />}
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
  isValid = true, // Default to true to not break forms that don't pass it yet
  headerActions,
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
        <div className="wrapper-form-loading" data-ai-id="form-page-loading-spinner">
            <Loader2 className="icon-form-loading-spinner" />
        </div>
    );
  }

  return (
    <Card className="card-form-page" data-ai-id="form-page-layout-card">
      <CardHeader className="header-card-form">
        <div className="wrapper-form-header-content">
            <div className="wrapper-form-title-section">
              {Icon && <Icon className="icon-form-header" />}
              <div className="wrapper-form-title-text">
                <CardTitle className="header-form-title">{formTitle}</CardTitle>
                <CardDescription className="desc-form-subtitle">{formDescription}</CardDescription>
              </div>
            </div>
            <div className="wrapper-form-header-actions">
                {headerActions}
                <div className="wrapper-desktop-toolbar">
                     <FormToolbar 
                        isViewMode={isViewMode} 
                        isSubmitting={isSubmitting}
                        isValid={isValid}
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
        </div>
      </CardHeader>
      <fieldset disabled={isViewMode || isSubmitting} className="group-form-fieldset" data-ai-id="form-page-fieldset">
        <CardContent className="content-card-form" data-ai-id="form-page-content">
            {children}
        </CardContent>
        <CardFooter className="footer-card-form" data-ai-id="form-page-footer">
             <div className="wrapper-mobile-toolbar">
                 <FormToolbar 
                    isViewMode={isViewMode} 
                    isSubmitting={isSubmitting}
                    isValid={isValid}
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
                <div className="wrapper-cancel-action">
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting} data-ai-id="form-page-btn-cancel" className="btn-form-cancel">
                        <XCircle className="icon-btn-start"/> Cancelar
                    </Button>
                </div>
            )}
        </CardFooter>
      </fieldset>
    </Card>
  );
}
