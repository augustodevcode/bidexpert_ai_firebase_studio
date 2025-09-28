// src/services/data-source.service.ts
/**
 * @fileoverview Este arquivo contém a classe DataSourceService, responsável
 * por gerenciar as Fontes de Dados disponíveis para o Construtor de Relatórios.
 * Ele serve como uma camada de abstração sobre o repositório, permitindo
 * buscar e manipular as definições de quais modelos e campos da aplicação
 * podem ser utilizados nos relatórios.
 */
import { DataSourceRepository } from '@/repositories/data-source.repository';
import type { DataSource, Prisma as PrismaTypes } from '@prisma/client';

export class DataSourceService {
  private repository: DataSourceRepository;

  constructor() {
    this.repository = new DataSourceRepository();
  }

  async getDataSources(): Promise<DataSource[]> {
    return this.repository.findAll();
  }

  async getDataSourceById(id: string): Promise<DataSource | null> {
    return this.repository.findById(id);
  }

  async createDataSource(data: Omit<DataSource, 'id'>): Promise<{ success: boolean; message: string; dataSource?: DataSource }> {
    try {
      const newDataSource = await this.repository.create(data as PrismaTypes.DataSourceCreateInput);
      return { success: true, message: 'Fonte de dados criada com sucesso.', dataSource: newDataSource };
    } catch (error: any) {
      console.error("Error in DataSourceService.create:", error);
      return { success: false, message: `Falha ao criar fonte de dados: ${error.message}` };
    }
  }

  async updateDataSource(id: string, data: Partial<Omit<DataSource, 'id'>>): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.update(id, data as PrismaTypes.DataSourceUpdateInput);
      return { success: true, message: 'Fonte de dados atualizada com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DataSourceService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar fonte de dados: ${error.message}` };
    }
  }

  async deleteDataSource(id: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.repository.delete(id);
      return { success: true, message: 'Fonte de dados excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in DataSourceService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir fonte de dados: ${error.message}` };
    }
  }
}
