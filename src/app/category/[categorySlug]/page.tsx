import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  redirect(`/search?category=${params.categorySlug}`);
}
