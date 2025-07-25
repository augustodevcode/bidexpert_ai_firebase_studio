import React, { useState, useEffect } from 'react';
import ReportDesigner from './components/ReportDesigner';
import AIPanel from './components/AIPanel';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import DataSourceManager from './components/DataSourceManager';
import PreviewPanel from './components/PreviewPanel';
import styles from './styles/ReportBuilder.css';

const BidReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [reportUrl, setReportUrl] = useState('');

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

  return (
    <div className={styles.container}>
      <h1>Bid Report Builder</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', marginRight: '20px' }}>
          <DataSourceManager />
          <Toolbar />
        </div>
        <div style={{ flex: 1 }}>
          <ReportDesigner />
        </div>
        <div style={{ width: '300px', marginLeft: '20px' }}>
          <PropertiesPanel selectedElement={selectedElement} />
          <AIPanel />
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
      <div>
        <PreviewPanel reportUrl={reportUrl} />
      </div>
    </div>
  );
};

export default BidReportBuilder;
