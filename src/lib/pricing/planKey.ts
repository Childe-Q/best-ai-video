import type { PricingPlan } from '@/types/tool';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getPlanReactKey(
  plan: PricingPlan | { id?: string; name?: string },
  index: number,
  scope = 'plan',
): string {
  const id = String(plan.id || '').trim();
  if (id) {
    return `${scope}-${id}`;
  }

  const name = String(plan.name || '').trim();
  if (name) {
    return `${scope}-${slugify(name)}-${index}`;
  }

  return `${scope}-${index}`;
}
