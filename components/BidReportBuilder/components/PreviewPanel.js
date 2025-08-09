import React from 'react';
import { DocumentViewer } from 'devexpress-reporting-react';
import 'devextreme/dist/css/dx.light.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';

const PreviewPanel = ({ reportUrl }) => {
  return (
    <div>
      <h3>Preview</h3>
      <DocumentViewer reportUrl={reportUrl}>
        <RequestOptions host="http://localhost:3000/" invokeAction="DXXRDV" />
      </DocumentViewer>
    </div>
  );
};

export default PreviewPanel;
