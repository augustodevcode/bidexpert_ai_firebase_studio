import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ImoveisPage() {
  redirect('/search?category=imoveis');
}
