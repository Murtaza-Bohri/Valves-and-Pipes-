"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProduct, type AdminActionState } from "@/app/admin/actions";
import { ProductForm } from "@/components/admin/AdminProductForm";
import type { DbCategory } from "@/types/database";

const initialState: AdminActionState = {};

type AdminAddProductFormProps = {
  categories: DbCategory[];
};

export function AdminAddProductForm({ categories }: AdminAddProductFormProps) {
  const [state, action, pending] = useActionState(createProduct, initialState);

  if (categories.length === 0) {
    return (
      <div className="border border-[#fff3cd] bg-[#fffbf0] p-6 text-sm text-[#141414]">
        <p className="font-semibold">Add a category first</p>
        <p className="mt-2 text-[#6b6b6b]">
          Every product needs a category. Create one in{" "}
          <Link href="/admin/categories" className="font-semibold text-[#bd1115] underline">
            Categories
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <section className="border border-[#e8e8e8] bg-white p-6">
      <ProductForm
        action={action}
        pending={pending}
        state={state}
        categories={categories}
        submitLabel="Create product"
      />
    </section>
  );
}
