// components/report/designer/BidReportDesigner.tsx
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

    const previewRef = useRef<HTMLDivElement>(null); // Ref for preview panel

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

    const handleExportPdf = useCallback(async () => {
        if (viewMode !== 'preview' || !previewRef.current) {
            alert('Please switch to Preview mode before exporting.');
            return;
        }

        // Temporarily switch to preview mode if not already
        const originalViewMode = viewMode;
        if (originalViewMode !== 'preview') {
             setViewMode('preview');
             // Wait for the view to render in preview mode - this might need a more robust solution
             await new Promise(resolve => setTimeout(resolve, 100));
        }


        const canvas = await html2canvas(previewRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height], // Use canvas dimensions
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${report.name || 'report'}.pdf`);

         // Switch back to original view mode if we changed it
    }, [report, viewMode]);
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
              onExportPdf={handleExportPdf} // Pass the export handler
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
                <div ref={previewRef} style={{ width: '100%', height: '100%' }}> {/* Attach ref to a container */}
                    <PreviewPanel report={report} />
                </div>
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