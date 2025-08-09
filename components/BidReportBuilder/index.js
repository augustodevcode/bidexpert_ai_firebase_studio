import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Joyride from 'react-joyride';
import ReportDesigner from './components/ReportDesigner';
import AIPanel from './components/AIPanel';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import DataSourceManager from './components/DataSourceManager';
import PreviewPanel from './components/PreviewPanel';
import VariablePanel from './components/VariablePanel';
import MediaLibrary from './components/MediaLibrary';
import { steps } from './tour';
import styles from './styles/ReportBuilder.css';

const BidReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [reportUrl, setReportUrl] = useState('');
  const [runTour, setRunTour] = useState(false);
  const designerRef = useRef();

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        if (data.length > 0) {
          setReportUrl(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    // This is a placeholder for checking if the user is new
    // In a real application, you would check a value in localStorage or a database
    const isNewUser = true;
    if (isNewUser) {
      setRunTour(true);
    }
  }, []);

  const handleAddElement = (elementType) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = designer.CreateControl(elementType, report);
      report.bands.detail.controls.add(control);
    }
  };

  const handleSelectionChanged = (sender, e) => {
    setSelectedElement(e.selected);
  };

  const handleSelectDataSource = (dataSource) => {
    if (designerRef.current && selectedElement) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = report.getControlById(selectedElement.id);
      if (control) {
        control.dataSource = dataSource;
      }
    }
  };

  const handleReportChanged = (sender, e) => {
    setReportUrl(e.report.url);
  };

  const handleGetAIAssistance = async (request) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const reportJson = JSON.stringify(report.serialize());

      return await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, report: reportJson }),
      });
    }
  };

  const handleElementPropertyChanged = (element, propertyName, propertyValue) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = report.getControlById(element.id);
      if (control) {
        control[propertyName] = propertyValue;
      }
    }
  };

  const handleSaveReport = async () => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const reportJson = report.serialize();

      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Report',
          description: 'A new report created from the designer',
          definition: reportJson,
        }),
      });
    }
  };

  const handleLoadReport = async () => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const response = await fetch(`/api/reports/${reportUrl}`);
      const reportJson = await response.json();
      designer.OpenReport(reportJson.definition);
    }
  };

  const handleDropVariable = (variable) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = designer.CreateControl('XRLabel', report);
      control.text = variable.value;
      report.bands.detail.controls.add(control);
    }
  };

  const handleExportReport = async (format) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const reportJson = report.serialize();

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          report: reportJson,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      a.click();
    }
  };

  const handleSelectImage = (image) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = designer.CreateControl('XRPictureBox', report);
      control.imageUrl = image.url;
      report.bands.detail.controls.add(control);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <Joyride steps={steps} run={runTour} continuous={true} />
        <h1>Bid Report Builder</h1>
        <div style={{ display: 'flex' }}>
          <div className="data-source-manager" style={{ width: '200px', marginRight: '20px' }}>
            <DataSourceManager onSelectDataSource={handleSelectDataSource} />
            <VariablePanel />
            <MediaLibrary onSelectImage={handleSelectImage} />
            <div className="toolbar">
              <Toolbar onAddElement={handleAddElement} onSaveReport={handleSaveReport} onLoadReport={handleLoadReport} onExportReport={handleExportReport} />
            </div>
          </div>
          <div className="report-designer" style={{ flex: 1 }}>
            <ReportDesigner ref={designerRef} onSelectionChanged={handleSelectionChanged} onReportChanged={handleReportChanged} onDrop={handleDropVariable} />
          </div>
          <div style={{ width: '300px', marginLeft: '20px' }}>
            <div className="properties-panel">
              <PropertiesPanel selectedElement={selectedElement} onElementPropertyChanged={handleElementPropertyChanged} />
            </div>
            <div className="ai-panel">
              <AIPanel onGetAIAssistance={handleGetAIAssistance} />
            </div>
          </div>
        </div>
        <div>
          <h2>Reports</h2>
          <ul>
            {reports.map((report) => (
              <li key={report.id} onClick={() => setReportUrl(report.id)}>
                {report.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="preview-panel">
          <PreviewPanel reportUrl={reportUrl} />
        </div>
      </div>
    </DndProvider>
  );
};

export default BidReportBuilder;
