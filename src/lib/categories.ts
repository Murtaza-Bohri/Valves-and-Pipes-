import type { DbCategory } from "@/types/database";

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string;
  image?: string | null;
  children: CategoryTreeNode[];
};

export function buildCategoryTree(categories: DbCategory[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parent_id ?? null,
      description: category.description ?? undefined,
      image: category.image,
      children: [],
    });
  }

  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list: CategoryTreeNode[]) => {
    list.sort((a, b) => {
      const aOrder = categories.find((item) => item.id === a.id)?.sort_order ?? 0;
      const bOrder = categories.find((item) => item.id === b.id)?.sort_order ?? 0;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    });
    list.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
}

export function flattenCategoryTree(
  tree: CategoryTreeNode[],
  depth = 0
): Array<{ category: CategoryTreeNode; depth: number }> {
  return tree.flatMap((node) => [
    { category: node, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);
}

export function findCategoryBySlug(
  categories: DbCategory[],
  slug: string
): DbCategory | undefined {
  const normalized = slug.trim().toLowerCase();
  return categories.find((category) => category.slug === normalized);
}

export function getCategoryAncestorIds(
  categories: DbCategory[],
  categoryId: string
): string[] {
  const ids: string[] = [];
  let current = categories.find((category) => category.id === categoryId);

  while (current) {
    ids.unshift(current.id);
    current = current.parent_id
      ? categories.find((category) => category.id === current!.parent_id)
      : undefined;
  }

  return ids;
}

export function getCategoryBreadcrumbs(
  categories: DbCategory[],
  categoryId: string
): Array<{ id: string; name: string; slug: string }> {
  return getCategoryAncestorIds(categories, categoryId).map((id) => {
    const category = categories.find((item) => item.id === id)!;
    return { id: category.id, name: category.name, slug: category.slug };
  });
}

export function getDescendantCategoryIds(
  categories: DbCategory[],
  rootId: string,
  includeRoot = true
): string[] {
  const ids = includeRoot ? [rootId] : [];
  const children = categories.filter((category) => category.parent_id === rootId);

  for (const child of children) {
    ids.push(...getDescendantCategoryIds(categories, child.id, true));
  }

  return ids;
}

export function getDirectChildCategories(
  categories: DbCategory[],
  parentId: string | null
): DbCategory[] {
  return categories
    .filter((category) => (category.parent_id ?? null) === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function formatCategoryPath(
  categories: DbCategory[],
  categoryId: string | null
): string {
  if (!categoryId) return "None (top level)";

  return getCategoryBreadcrumbs(categories, categoryId)
    .map((item) => item.name)
    .join(" › ");
}

export function wouldCreateCategoryCycle(
  categories: Pick<DbCategory, "id" | "parent_id">[],
  categoryId: string,
  nextParentId: string | null
): boolean {
  if (!nextParentId) return false;
  if (nextParentId === categoryId) return true;

  let current: string | null = nextParentId;
  while (current) {
    if (current === categoryId) return true;
    current =
      categories.find((category) => category.id === current)?.parent_id ?? null;
  }

  return false;
}

export function getRootCategoryForId(
  categories: DbCategory[],
  categoryId: string
): DbCategory | undefined {
  const chain = getCategoryAncestorIds(categories, categoryId);
  const rootId = chain[0];
  return categories.find((category) => category.id === rootId);
}
