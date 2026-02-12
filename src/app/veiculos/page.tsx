import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function VeiculosPage() {
  redirect('/search?category=veiculos');
}
