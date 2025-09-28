// src/components/BidReportBuilder/components/TableComponent.tsx
'use client';

const sampleData = [
    { id: 'LEIL-001', value: 'R$ 15.000,00', status: 'Vendido' },
    { id: 'LEIL-002', value: 'R$ 250.000,00', status: 'Vendido' },
    { id: 'LEIL-003', value: 'R$ 8.500,00', status: 'Aberto' },
];

export default function TableComponent() {
    return (
        <div className="w-full h-full overflow-hidden">
            <table className="w-full text-xs">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="p-1 text-left font-semibold">ID</th>
                        <th className="p-1 text-left font-semibold">Valor</th>
                        <th className="p-1 text-left font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {sampleData.map(row => (
                        <tr key={row.id} className="border-b">
                            <td className="p-1">{row.id}</td>
                            <td className="p-1">{row.value}</td>
                            <td className="p-1">{row.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
