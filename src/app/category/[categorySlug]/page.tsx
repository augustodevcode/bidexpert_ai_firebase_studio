
import { getUniqueLotCategories, slugify } from '@/lib/sample-data';
import CategoryDisplay from './category-display'; // Import the new client component

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  return <CategoryDisplay params={params} />;
}

// generateStaticParams remains in the page file, as it's server-side
export async function generateStaticParams() {
  const categories = getUniqueLotCategories();
  return categories.map(category => ({
    categorySlug: slugify(category),
  }));
}
