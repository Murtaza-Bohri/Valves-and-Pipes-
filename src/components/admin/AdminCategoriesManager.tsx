"use client";

import { useActionState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type AdminActionState,
} from "@/app/admin/actions";
import type { DbCategory } from "@/types/database";

const initialState: AdminActionState = {};

type AdminCategoriesManagerProps = {
  categories: DbCategory[];
};

export function AdminCategoriesManager({
  categories,
}: AdminCategoriesManagerProps) {
  const [createState, createAction, createPending] = useActionState(
    createCategory,
    initialState
  );

  return (
    <div className="space-y-8">
      <section className="border border-[#e8e8e8] bg-white p-6">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-[#141414]">
          Add category
        </h2>
        <CategoryForm
          action={createAction}
          pending={createPending}
          state={createState}
          submitLabel="Create category"
        />
      </section>

      <section className="border border-[#e8e8e8] bg-white p-6">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-xl text-[#141414]">
          All categories
        </h2>

        {categories.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">No categories yet.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryEditor key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryEditor({ category }: { category: DbCategory }) {
  const [state, action, pending] = useActionState(updateCategory, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    initialState
  );

  return (
    <div className="border border-[#e8e8e8] bg-[#f7f7f7] p-5">
      <CategoryForm
        action={action}
        pending={pending}
        state={state}
        category={category}
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
  );
}

function CategoryForm({
  action,
  pending,
  state,
  category,
  submitLabel,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
  state: AdminActionState;
  category?: DbCategory;
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
