type ProductCategoryLike = {
  id: number;
  name: string;
  parentId: number | null;
  priority: number;
};

export type ProductCategoryTreeItem<T extends ProductCategoryLike> = {
  category: T;
  depth: number;
  hasChildren: boolean;
  path: string;
};

const categoryOrder = <T extends ProductCategoryLike>(left: T, right: T) =>
  left.priority - right.priority || left.name.localeCompare(right.name);

/** Converts the flat API response into a safe, ordered category tree for forms and lists. */
export const flattenProductCategoryTree = <T extends ProductCategoryLike>(categories: T[]): ProductCategoryTreeItem<T>[] => {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const childrenByParent = new Map<number | null, T[]>();
  for (const category of categories) {
    const parentId = category.parentId && byId.has(category.parentId) ? category.parentId : null;
    const children = childrenByParent.get(parentId) ?? [];
    children.push(category);
    childrenByParent.set(parentId, children);
  }
  childrenByParent.forEach((children) => children.sort(categoryOrder));

  const items: ProductCategoryTreeItem<T>[] = [];
  const visited = new Set<number>();
  const visit = (parentId: number | null, depth: number, parentPath: string[]) => {
    for (const category of childrenByParent.get(parentId) ?? []) {
      if (visited.has(category.id)) continue;
      visited.add(category.id);
      const path = [...parentPath, category.name];
      const children = childrenByParent.get(category.id) ?? [];
      items.push({ category, depth, hasChildren: children.length > 0, path: path.join(" › ") });
      visit(category.id, depth + 1, path);
    }
  };

  visit(null, 0, []);
  for (const category of [...categories].sort(categoryOrder)) {
    if (!visited.has(category.id)) visit(category.id, 0, []);
  }
  return items;
};

export const productCategoryDescendantIds = <T extends ProductCategoryLike>(categories: T[], rootId: number) => {
  const childrenByParent = new Map<number, number[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parentId, children);
  }
  const descendants = new Set<number>();
  const pending = [...(childrenByParent.get(rootId) ?? [])];
  while (pending.length) {
    const id = pending.pop();
    if (id === undefined || descendants.has(id)) continue;
    descendants.add(id);
    pending.push(...(childrenByParent.get(id) ?? []));
  }
  return descendants;
};
