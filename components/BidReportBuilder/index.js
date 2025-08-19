// src/components/BidReportBuilder/index.js
'use client';

import React, { useState, useEffect } from 'react';
import { ReportDesigner } from 'devexpress-reporting-react';
import 'devexpress-reporting/dx-reportdesigner';
import './styles/ReportBuilder.css';

const BidReportBuilder = () => {
    // Estado para manter a URL do relatório ou os dados
    const [reportUrl, setReportUrl] = useState("Products");

    // Endpoint do backend que o Report Designer usará para se comunicar
    const host = '/api/reporting';
    const designer_path = '/DXXRDV'; 

    return (
        <div style={{ width: "100%", height: "1000px" }}>
            <ReportDesigner.Embed 
                reportUrl={reportUrl} 
                requestOptions={{ host, getDesignerPath: designer_path }}
            >
            </ReportDesigner.Embed>
        </div>
    );
};

export default BidReportBuilder;
