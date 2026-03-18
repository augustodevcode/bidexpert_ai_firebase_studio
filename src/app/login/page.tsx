/**
 * @fileoverview Alias público da rota de autenticação canônica.
 */
import { redirect } from 'next/navigation';

type LoginAliasPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginAliasPage({ searchParams = {} }: LoginAliasPageProps) {
  const query = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          query.append(key, item);
        }
      });
      return;
    }

    if (value) {
      query.set(key, value);
    }
  });

  redirect(query.toString() ? `/auth/login?${query.toString()}` : '/auth/login');
}