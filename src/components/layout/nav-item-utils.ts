/**
 * @fileoverview Helpers para manter a navegação do header estável e sem duplicidades visuais.
 */

import type { NavItem } from './main-nav';

function getNavItemIdentity(item: Pick<NavItem, 'href' | 'label' | 'contentKey'>): string {
  if (item.href) {
    return `href:${item.href}`;
  }

  if (item.contentKey) {
    return `content:${item.contentKey}`;
  }

  return `label:${item.label}`;
}

export function dedupeNavItems<T extends Pick<NavItem, 'href' | 'label' | 'contentKey'>>(
  items: readonly T[],
): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const identity = getNavItemIdentity(item);

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
}