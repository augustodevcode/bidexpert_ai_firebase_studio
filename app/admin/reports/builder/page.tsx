// src/app/admin/reports/builder/page.tsx
import BidReportBuilder from '@/components/BidReportBuilder';

export default function ReportBuilderPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Construtor de Relatórios</h1>
      <BidReportBuilder />
    </div>
  );
}
