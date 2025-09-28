// src/app/category/[categorySlug]/page.tsx
/**
 * @fileoverview Página de servidor que serve como ponto de entrada para a exibição de uma categoria.
 * Este componente é responsável por receber o slug da categoria da URL, buscar
 * os dados iniciais do lado do servidor (se necessário) e renderizar o componente
 * de cliente `CategoryDisplay`, que lida com toda a lógica interativa e de busca de dados.
 */
import CategoryDisplay from './category-display'; 
import { getLotCategories } from '@/app/admin/categories/actions';

// This page component is a Server Component
export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  // O componente DynamicBreadcrumbs no Header cuidará de mostrar os breadcrumbs.
  // Não precisamos mais passar breadcrumbItems daqui.
  return <CategoryDisplay params={params} />;
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
