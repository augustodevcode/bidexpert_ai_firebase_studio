/**
 * Category redirect page — redirects /category/[slug] to /search?category=[slug]
 * Uses force-dynamic since tenant resolution depends on request context.
 * No generateStaticParams needed — this page only redirects.
 */
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  redirect(`/search?category=${params.categorySlug}`);
}
