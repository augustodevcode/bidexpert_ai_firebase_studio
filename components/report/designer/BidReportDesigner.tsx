// components/report/designer/BidReportDesigner.tsx
import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Report, ReportElement } from './types/report';
import Toolbar from './Toolbar';
import DesignCanvas from './DesignCanvas';
import PropertiesPanel from './PropertiesPanel';
import PreviewPanel from './PreviewPanel';
import { DataProvider } from './contexts/DataContext';

// Helper for managing reports in localStorage
const reportsStorageKey = 'bidReportDesignerReports';

const saveReportToStorage = (report: Report) => {
  const reports = JSON.parse(localStorage.getItem(reportsStorageKey) || '{}');
  reports[report.id] = report;
  localStorage.setItem(reportsStorageKey, JSON.stringify(reports));
};

const loadReportFromStorage = (id: string): Report | undefined => {
  const reports = JSON.parse(localStorage.getItem(reportsStorageKey) || '{}');
  return reports[id];
};

const listReportsInStorage = (): { id: string; name: string }[] => {
    const reports = JSON.parse(localStorage.getItem(reportsStorageKey) || '{}');
    return Object.keys(reports).map(id => ({ id, name: reports[id].name || `Report ${id}` }));
};


const BidReportDesigner: React.FC = () => {
  const [report, setReport] = useState<Report>({
    id: 'new-report-' + Date.now(), // Unique ID for new reports
    name: 'Untitled Report',
    elements: [],
    dataSources: [],
    filters: [],
    styles: {},
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'design' | 'preview'>('design');

    // Action Handlers
    const handleNewReport = useCallback(() => {
        if (window.confirm('Are you sure you want to create a new report? Any unsaved changes will be lost.')) {
            setReport({
                id: 'new-report-' + Date.now(),
                name: 'Untitled Report',
                elements: [],
                dataSources: [],
                filters: [],
                styles: {},
            });
            setSelectedElement(null);
            setViewMode('design');
        }
    }, []);

    const handleOpenReport = useCallback(() => {
        const availableReports = listReportsInStorage();
        if (availableReports.length === 0) {
            alert('No saved reports found.');
            return;
        }

        const reportIdToLoad = prompt(
            'Enter the ID of the report to open:\n' +
            availableReports.map(r => `${r.id} - ${r.name}`).join('\n')
        );

        if (reportIdToLoad) {
            const loadedReport = loadReportFromStorage(reportIdToLoad);
            if (loadedReport) {
                setReport(loadedReport);
                setSelectedElement(null);
                setViewMode('design');
            } else {
                alert('Report not found.');
            }
        }
    }, []);


    const handleSaveReport = useCallback(() => {
         if (!report.id || report.id.startsWith('new-report-')) {
             // If it's a new unsaved report, treat as Save As
             handleSaveAsReport();
         } else {
             saveReportToStorage(report);
             alert(`Report "${report.name}" saved successfully.`);
         }
    }, [report, handleSaveAsReport]); // Add handleSaveAsReport to dependencies


    const handleSaveAsReport = useCallback(() => {
        const newName = prompt('Enter a name for the report:');
        if (newName) {
            const newReport = { ...report, id: Date.now().toString(), name: newName };
            setReport(newReport);
            saveReportToStorage(newReport);
            alert(`Report "${newName}" saved successfully.`);
        }
    }, [report]);


  const handleUpdateElement = (id: string, updates: Partial<ReportElement>) => {
    setReport(prevReport => ({
      ...prevReport,
      elements: prevReport.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  };

  const handleSelectElement = (id: string | null) => {
    setSelectedElement(id);
  };

  const getSelectedElement = () => {
    return report.elements.find(el => el.id === selectedElement) || null;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <DataProvider>
        <div className="report-designer-container">
          <h1>Report Designer - {report.name}</h1>
          <Toolbar
              onAddElement={() => {}} // This is now handled by Dnd in DesignCanvas
              onViewChange={setViewMode}
              onNewReport={handleNewReport}
              onOpenReport={handleOpenReport}
              onSaveReport={handleSaveReport}
              onSaveAsReport={handleSaveAsReport}
          />
          <div className="designer-area" style={{ display: 'flex' }}>
            <div className="canvas-panel" style={{ flex: 1, border: '1px solid #ccc', marginRight: '8px' }}>
              {viewMode === 'design' ? (
                <DesignCanvas
                  report={report}
                  onSelectElement={handleSelectElement}
                  onUpdateElement={handleUpdateElement}
                />
              ) : (
                <PreviewPanel report={report} />
              )}
            </div>
            <div className="properties-panel" style={{ width: '300px', border: '1px solid #ccc', padding: '8px' }}>
              <PropertiesPanel
                selectedElement={getSelectedElement()}
                onUpdateElement={handleUpdateElement}
              />
            </div>
          </div>
        </div>
      </DataProvider>
    </DndProvider>
  );
};

export default BidReportDesigner;