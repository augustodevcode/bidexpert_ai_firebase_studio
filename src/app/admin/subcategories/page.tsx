// src/app/admin/subcategories/page.tsx
/**
 * @fileoverview Página principal para listagem e gerenciamento de Subcategorias.
 * Utiliza o componente DataTable para exibir os dados com funcionalidade
 * completa de CRUD (criar, editar, excluir).
 */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSubcategoriesByParentIdAction, createSubcategoryAction, updateSubcategoryAction } from './actions';
import { getLotCategories } from '@/app/admin/categories/actions';
import type { Subcategory, LotCategory } from '@/types';
import { Layers, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import CrudFormContainer from '@/components/admin/CrudFormContainer';
import SubcategoryForm from './subcategory-form';
import type { SubcategoryFormValues } from './subcategory-form-schema';

export default function AdminSubcategoriesPage() {
  const [allParentCategories, setAllParentCategories] = useState<LotCategory[]>([]);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string | undefined>(undefined);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchPageData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedCategories = await getLotCategories();
        if (isMounted) {
          const categoriesWithSubcats = fetchedCategories.filter(c => c.hasSubcategories);
          setAllParentCategories(categoriesWithSubcats);
          if (categoriesWithSubcats.length > 0 && !selectedParentCategoryId) {
            setSelectedParentCategoryId(categoriesWithSubcats[0].id);
          }
        }
      } catch (e) {
        console.error('Error fetching parent categories:', e);
        if (isMounted) {
          setError('Falha ao buscar categorias principais.');
          toast({ title: 'Erro', description: 'Falha ao buscar categorias principais.', variant: 'destructive' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchPageData();
    return () => { isMounted = false; };
  }, [toast, selectedParentCategoryId]);

  const fetchSubcategories = useCallback(async () => {
    if (!selectedParentCategoryId) {
        setSubcategories([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const fetchedSubcategories = await getSubcategoriesByParentIdAction(selectedParentCategoryId);
        const parentName = allParentCategories.find(c => c.id === selectedParentCategoryId)?.name || '';
        setSubcategories(fetchedSubcategories.map(s => ({...s, parentCategoryName: parentName})));
    } catch (e) {
        console.error(`Error fetching subcategories for ${selectedParentCategoryId}:`, e);
        setError('Falha ao buscar subcategorias.');
        toast({ title: 'Erro', description: 'Falha ao buscar subcategorias.', variant: 'destructive' });
        setSubcategories([]);
    } finally {
        setIsLoading(false);
    }
  }, [selectedParentCategoryId, allParentCategories, toast]);

  useEffect(() => {
    let isMounted = true;
    if (allParentCategories.length > 0) {
      if (isMounted) fetchSubcategories();
    }
    return () => { isMounted = false; };
  }, [fetchSubcategories, allParentCategories]);

  const handleDelete = useCallback((id: string) => {
    setSubcategories(prev => prev.filter(sub => sub.id !== id));
  }, []);

  const handleEdit = useCallback((subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setIsFormOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingSubcategory(null);
  }, []);

  const handleSubmitForm = async (data: SubcategoryFormValues) => {
     let result;
     if (!editingSubcategory) {
       result = await createSubcategoryAction(data);
     } else {
       result = await updateSubcategoryAction(editingSubcategory.id, data);
     }

     if (result.success) {
        await fetchSubcategories();
     }
     return result;
  };

  const columns = useMemo(() => createColumns({ onDelete: handleDelete, onEdit: handleEdit }), [handleDelete, handleEdit]);

  return (
    <div className="space-y-6" data-ai-id="admin-subcategories-page-container">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline flex items-center">
              <Layers className="h-6 w-6 mr-2 text-primary" />
              Subcategorias
            </CardTitle>
            <CardDescription>
              Gerencie as subcategorias da plataforma. Adicione, edite ou exclua subcategorias.
            </CardDescription>
          </div>
          <Button onClick={() => { setEditingSubcategory(null); setIsFormOpen(true); }} data-ai-id="new-subcategory-button">
            <PlusCircle className="mr-2 h-4 w-4" /> Nova Subcategoria
          </Button>
        </CardHeader>
        <CardContent>
            <div className="mb-4">
              <Select
                value={selectedParentCategoryId}
                onValueChange={setSelectedParentCategoryId}
                disabled={allParentCategories.length === 0 || isLoading}
              >
                <SelectTrigger id="parentCategorySelect" className="w-full sm:w-auto sm:min-w-[250px]">
                  <SelectValue placeholder={allParentCategories.length > 0 ? "Selecione uma categoria principal" : "Nenhuma categoria com subcategorias"} />
                </SelectTrigger>
                <SelectContent>
                  {allParentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                   {allParentCategories.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma categoria com subcategorias encontrada.</p>}
                </SelectContent>
              </Select>
            </div>

            <DataTable
              columns={columns}
              data={subcategories}
              isLoading={isLoading}
              error={error}
              searchColumnId="name"
              searchPlaceholder="Buscar por nome da subcategoria..."
            />
        </CardContent>
      </Card>
      
      <CrudFormContainer
        isOpen={isFormOpen}
        onClose={handleCloseModal}
        mode="modal"
        title={!editingSubcategory ? "Nova Subcategoria" : "Editar Subcategoria"}
        description={!editingSubcategory ? "Preencha os dados da nova subcategoria" : "Altere os dados da subcategoria"}
      >
        <SubcategoryForm
          initialData={editingSubcategory}
          parentCategories={allParentCategories}
          onSubmitAction={handleSubmitForm}
          onSuccess={handleCloseModal}
          onCancel={handleCloseModal}
          formTitle={!editingSubcategory ? "Nova Subcategoria" : "Editar Subcategoria"}
          formDescription=""
          submitButtonText={!editingSubcategory ? "Cadastrar Subcategoria" : "Salvar"}
        />
      </CrudFormContainer>
    </div>
  );
}