import { redirect } from 'next/navigation';
import { getLotCategories } from '@/app/admin/categories/actions';

export const dynamic = 'force-dynamic';

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  redirect(`/search?category=${params.categorySlug}`);
}

export async function generateStaticParams() {
  try {
    const categories = await getLotCategories();
    return categories.map(category => ({
      categorySlug: category.slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for categories:", error);
    return []; 
  }
}
