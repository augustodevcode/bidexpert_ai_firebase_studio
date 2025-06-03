
import { getLotCategories } from '@/app/admin/categories/actions'; // Use the action
import CategoryDisplay from './category-display'; 

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  // CategoryDisplay is a client component and will handle fetching its own specific data
  // based on the slug, or we can pass initial data here if we fetch it.
  // For now, CategoryDisplay will fetch based on slug.
  return <CategoryDisplay params={params} />;
}

// generateStaticParams can fetch categories to generate paths at build time
export async function generateStaticParams() {
  try {
    const categories = await getLotCategories();
    return categories.map(category => ({
      categorySlug: category.slug,
    }));
  } catch (error) {
    console.error("Failed to generate static params for categories:", error);
    return []; // Return empty array on error to avoid build failure
  }
}
