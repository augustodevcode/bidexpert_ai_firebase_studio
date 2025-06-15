'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCities, deleteCity } from './actions';
import type { CityInfo } from '@/types';
import { PlusCircle, Edit, Trash2, Building2, AlertTriangle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useState } from 'react';
import { useEffect } from 'react';
function DeleteCityButton({ cityId, cityName, onDelete }: { cityId: string; cityName: string; onDelete: (id: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmDelete = async () => {
    await onDelete(cityId);
    setIsOpen(false);
  };

  return (

    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" aria-label="Excluir Cidade">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent><p>Excluir Cidade</p></TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle> 
          <AlertDialogDescription>
            Tem certeza que deseja excluir a cidade "{cityName}"? Esta ação não pode ser desfeita e pode afetar lotes associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      const data = await getCities();
      setCities(data);
      setLoading(false);
    };

    fetchCities();
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold font-headline flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-primary" />
                Gerenciar Cidades
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova cidades da plataforma.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/cities/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Cidade
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <p className="font-semibold">Carregando cidades...</p>
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-secondary/30 rounded-md">
                <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                <p className="font-semibold">Nenhuma cidade encontrada.</p>
                <p className="text-sm">Comece adicionando uma nova cidade.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome da Cidade</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead>Cód. IBGE</TableHead>
                      <TableHead className="text-center">Lotes</TableHead>
                      <TableHead className="text-right w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell>{city.stateUf}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{city.ibgeCode || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{city.lotCount || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700" aria-label="Editar Cidade">
                                <Link href={`/admin/cities/${city.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar Cidade</p></TooltipContent>
                          </Tooltip>
                          <DeleteCityButton cityId={city.id} cityName={city.name} onDelete={deleteCity} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
