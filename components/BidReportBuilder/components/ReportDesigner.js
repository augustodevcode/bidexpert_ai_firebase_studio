import React, { forwardRef } from 'react';
import { ReportDesigner } from 'devexpress-reporting-react';
import 'devextreme/dist/css/dx.light.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.common.css';
import '@devexpress/analytics-core/dist/css/dx-analytics.light.css';
import 'devexpress-reporting/dist/css/dx-webdocumentviewer.css';
import 'ace-builds/css/ace.css';
import 'ace-builds/css/theme/dreamweaver.css';
import 'ace-builds/css/theme/ambiance.css';
import '@devexpress/analytics-core/dist/css/dx-querybuilder.css';
import 'devexpress-reporting/dist/css/dx-reportdesigner.css';

const ReportDesignerComponent = forwardRef((props, ref) => {
  const { onSelectionChanged, onReportChanged } = props;

  return (
    <ReportDesigner ref={ref}>
      <RequestOptions host="http://localhost:3000/" getDesignerModelAction="api/reports" />
      <Callbacks SelectionChanged={onSelectionChanged} ReportChanged={onReportChanged} />
    </ReportDesigner>
  );
});

export default ReportDesignerComponent;
