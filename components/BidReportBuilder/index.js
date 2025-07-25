import React, { useState, useEffect } from 'react';
import ReportDesigner from './components/ReportDesigner';
import AIPanel from './components/AIPanel';
import styles from './styles/ReportBuilder.css';

const BidReportBuilder = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
      });
  }, []);

  return (
    <div className={styles.container}>
      <h1>Bid Report Builder</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <ReportDesigner />
        </div>
        <div style={{ width: '300px', marginLeft: '20px' }}>
          <AIPanel />
        </div>
      </div>
      <div>
        <h2>Reports</h2>
        <ul>
          {reports.map((report) => (
            <li key={report.id}>{report.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BidReportBuilder;
