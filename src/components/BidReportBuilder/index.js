'use client';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReportDesigner from './components/ReportDesigner';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import PreviewPanel from './components/PreviewPanel';
import DataSourceManager from './components/DataSourceManager';
import VariablePanel from './components/VariablePanel';
import MediaLibrary from './components/MediaLibrary';
import AIPanel from './components/AIPanel';

// Mock data and handlers for now
const mockData = {
  reports: [{ id: '1', title: 'Relatório de Vendas Q1' }],
  selectedElement: null,
  reportUrl: '1',
};

const BidReportBuilder = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Left Panel */}
        <div className="w-full lg:w-1/5 space-y-4">
          <DataSourceManager onSelectDataSource={() => {}} />
          <VariablePanel />
          <MediaLibrary onSelectImage={() => {}} />
        </div>

        {/* Center Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <Toolbar onAddElement={() => {}} onSaveReport={() => {}} onLoadReport={() => {}} onExportReport={() => {}} />
          <div className="flex-grow">
            <ReportDesigner />
          </div>
          <div className="h-1/3">
            <PreviewPanel reportUrl={mockData.reportUrl} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/4 space-y-4">
          <PropertiesPanel selectedElement={mockData.selectedElement} onElementPropertyChanged={() => {}} />
          <AIPanel onGetAIAssistance={() => {}} />
        </div>
      </div>
    </DndProvider>
  );
};

export default BidReportBuilder;
