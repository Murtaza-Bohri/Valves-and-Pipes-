"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type AdminActionState,
} from "@/app/admin/actions";
import { useActionState } from "react";
import { buildCategoryTree, type CategoryTreeNode } from "@/lib/categories";
import { CategoryParentSelect } from "@/components/admin/CategoryParentSelect";
import type { DbCategory } from "@/types/database";

const initialState: AdminActionState = {};

type AdminCategoriesManagerProps = {
  categories: DbCategory[];
};

export function AdminCategoriesManager({ categories }: AdminCategoriesManagerProps) {
  const [search, setSearch] = useState("");
  const [createParentId, setCreateParentId] = useState("");
  const [createState, createAction, createPending] = useActionState(
    createCategory,
    initialState
  );

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  const filteredTree = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tree;

    const filterNodes = (nodes: CategoryTreeNode[]): CategoryTreeNode[] =>
      nodes
        .map((node) => ({
          ...node,
          children: filterNodes(node.children),
        }))
        .filter(
          (node) =>
            node.name.toLowerCase().includes(query) ||
            node.slug.toLowerCase().includes(query) ||
            node.children.length > 0
        );

    return filterNodes(tree);
  }, [search, tree]);

  return (
    <div className="space-y-8">
      <section className="border border-[#e8e8e8] bg-white p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#141414]">
            Add category
          </h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="w-full max-w-sm border border-[#e0e0e0] bg-white px-3 py-2 text-sm outline-none focus:border-[#bd1115] sm:ml-auto"
          />
        </div>

        <CategoryForm
          key={`create-${createParentId}`}
          action={createAction}
          pending={createPending}
          state={createState}
          categories={categories}
          parentId={createParentId}
          submitLabel="Create category"
        />
      </section>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-xl text-[#141414]">
          Category tree
        </h2>

        {filteredTree.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No categories match your search.</p>
        ) : (
          <div className="space-y-3">
            {filteredTree.map((node) => (
              <CategoryTreeNodeEditor
                key={node.id}
                node={node}
                categories={categories}
                onAddChild={setCreateParentId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryTreeNodeEditor({
  node,
  categories,
  depth = 0,
  onAddChild,
}: {
  node: CategoryTreeNode;
  categories: DbCategory[];
  depth?: number;
  onAddChild: (parentId: string) => void;
}) {
  const category = categories.find((item) => item.id === node.id)!;
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateCategory, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    initialState
  );

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="border border-[#e8e8e8] bg-[#f7f7f7] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mr-2 text-sm font-semibold text-[#141414]"
            >
              {node.children.length ? (expanded ? "▼" : "▶") : "•"}
            </button>
            <span className="font-semibold text-[#141414]">{node.name}</span>
            <span className="ml-2 text-xs text-[#6b6b6b]">/{node.slug}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onAddChild(node.id)}
              className="text-xs font-semibold tracking-[0.12em] text-[#141414] uppercase hover:text-[#bd1115]"
            >
              Add child
            </button>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              className="text-xs font-semibold tracking-[0.12em] text-[#141414] uppercase hover:text-[#bd1115]"
            >
              {editing ? "Close" : "Edit"}
            </button>
            <Link
              href={`/categories/${node.slug}`}
              className="text-xs font-semibold tracking-[0.12em] text-[#141414] uppercase hover:text-[#bd1115]"
            >
              View
            </Link>
          </div>
        </div>

        {editing ? (
          <div className="mt-4 border-t border-[#e8e8e8] pt-4">
            <CategoryForm
              action={action}
              pending={pending}
              state={state}
              category={category}
              categories={categories}
              submitLabel="Save category"
            />

            <form action={deleteAction} className="mt-4">
              <input type="hidden" name="id" value={category.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="text-xs font-semibold tracking-[0.14em] text-[#bd1115] uppercase hover:underline disabled:opacity-60"
              >
                {deletePending ? "Deleting..." : "Delete category"}
              </button>
              {deleteState.error ? (
                <p className="mt-2 text-sm text-[#bd1115]">{deleteState.error}</p>
              ) : null}
              {deleteState.success ? (
                <p className="mt-2 text-sm text-green-700">{deleteState.success}</p>
              ) : null}
            </form>
          </div>
        ) : null}
      </div>

      {expanded &&
        node.children.map((child) => (
          <CategoryTreeNodeEditor
            key={child.id}
            node={child}
            categories={categories}
            depth={depth + 1}
            onAddChild={onAddChild}
          />
        ))}
    </div>
  );
}

function CategoryForm({
  action,
  pending,
  state,
  category,
  categories,
  parentId,
  onParentChange,
  submitLabel,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
  state: AdminActionState;
  category?: DbCategory;
  categories: DbCategory[];
  parentId?: string;
  onParentChange?: (value: string) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <Field label="Name" name="name" defaultValue={category?.name} />
      <Field label="Slug" name="slug" defaultValue={category?.slug} />
      <Field
        label="Sort order"
        name="sort_order"
        type="number"
        defaultValue={String(category?.sort_order ?? 0)}
        required={false}
      />
      <Field
        label="Image path"
        name="image"
        defaultValue={category?.image ?? ""}
        required={false}
      />

      <CategoryParentSelect
        categories={categories}
        defaultValue={category?.parent_id ?? parentId ?? ""}
        excludeId={category?.id}
      />

      {onParentChange ? (
        <p className="sm:col-span-2 text-xs text-[#6b6b6b]">
          Tip: use &quot;Add child&quot; on a category row to pre-select its parent here.
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-[#141414] sm:col-span-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={category?.is_active !== false}
        />
        Active on storefront
      </label>

      <div className="sm:col-span-2">
        <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
          Description
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
          className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
        />
      </div>

      {state.error ? (
        <p className="sm:col-span-2 text-sm text-[#bd1115]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="sm:col-span-2 text-sm text-green-700">{state.success}</p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#bd1115] px-5 py-2.5 text-xs font-semibold tracking-[0.14em] text-white uppercase hover:bg-[#9a0e12] disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold tracking-[0.14em] text-[#141414] uppercase">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required && name !== "slug"}
        className="w-full border border-[#e0e0e0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#bd1115]"
      />
    </div>
  );
}
