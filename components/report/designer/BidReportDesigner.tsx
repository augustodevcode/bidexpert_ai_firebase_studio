// components/report/designer/BidReportDesigner.tsx
import React, { useState, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Report, ReportElement } from './types/report';
import * as XLSX from 'sheetjs'; // Import SheetJS
import Toolbar from './Toolbar';
import DesignCanvas from './DesignCanvas';
import PropertiesPanel from './PropertiesPanel';
import PreviewPanel from './PreviewPanel';
import { DataProvider, useData } from './contexts/DataContext'; // Import useData

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
    const { getDataSource } = useData(); // Use the useData hook

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

         // Switch back to original view mode if we changed it - this part needs to be more robust
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


    const handleExportXlsx = useCallback(() => {
        // Find all table elements in the report
        const tableElements = report.elements.filter(el => el.type === 'table') as any[]; // Use any for now, will refine types later

        if (tableElements.length === 0) {
            alert('No table elements found in the report to export.');
            return;
        }

        const workbook = XLSX.utils.book_new();

        tableElements.forEach(tableElement => {
            const dataSource = getDataSource(tableElement.dataSourceId);
            if (dataSource && dataSource.data && tableElement.columns.length > 0) {
                // Prepare data for the sheet
                const sheetData = [tableElement.columns.map((col: any) => col.label)]; // Header row
                dataSource.data.forEach((rowData: any) => {
                    const row = tableElement.columns.map((col: any) => rowData[col.field] || '');
                    sheetData.push(row);
                });

                // Create a worksheet and append to workbook
                const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
                XLSX.utils.book_append_sheet(workbook, worksheet, tableElement.id.substring(0, 31)); // Use element id as sheet name, truncated
            }
        });

         if (workbook.SheetNames.length > 0) {
             XLSX.writeFile(workbook, `${report.name || 'report'}.xlsx`);
         } else {
             alert('No data found in table elements to export to XLSX.');
         }

    }, [report, getDataSource]);


    const handleExportCsv = useCallback(() => {
         // Find all table elements in the report
         const tableElements = report.elements.filter(el => el.type === 'table') as any[]; // Use any for now

         if (tableElements.length === 0) {
             alert('No table elements found in the report to export.');
             return;
         }

        tableElements.forEach(tableElement => {
             const dataSource = getDataSource(tableElement.dataSourceId);
             if (dataSource && dataSource.data && tableElement.columns.length > 0) {
                 // Prepare CSV data
                 const header = tableElement.columns.map((col: any) => col.label).join(',');
                 const rows = dataSource.data.map((rowData: any) =>
                     tableElement.columns.map((col: any) => `"${String(rowData[col.field] || '').replace(/"/g, '""')}"`).join(',') // Handle commas and quotes
                 );

                 const csvContent = [header, ...rows].join('\n');

                 // Create a blob and download
                 const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                 const link = document.createElement('a');
                 link.href = URL.createObjectURL(blob);
                 link.setAttribute('download', `${report.name || 'report'}-${tableElement.id}.csv`);
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
             }
        });
    }, [report, getDataSource]);

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
              onExportXlsx={handleExportXlsx} // Pass XLSX handler
              onExportCsv={handleExportCsv} // Pass CSV handler
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