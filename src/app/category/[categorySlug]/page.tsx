
import CategoryDisplay from './category-display'; 
import { sampleLotCategories } from '@/lib/sample-data';

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  return <CategoryDisplay params={params} />;
}

export async function generateStaticParams() {
  try {
    // Using sample data for static params generation
    return sampleLotCategories.map(category => ({
      categorySlug: category.slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for categories using sample data:", error);
    return []; 
  }
}
    