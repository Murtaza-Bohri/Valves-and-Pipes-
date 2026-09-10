"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminDisplayName, getAdminEmail } from "@/lib/admin";
import { validateProductPricing } from "@/lib/pricing";
import {
  wouldCreateCategoryCycle,
} from "@/lib/categories";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminActionState = {
  error?: string;
  success?: string;
};

function revalidateCatalog() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories", "layout");
  revalidatePath("/products", "layout");
}

function parseHasImpa(formData: FormData) {
  return formData.get("has_impa") === "yes";
}

function parsePrice(formData: FormData, hasImpa: boolean) {
  if (hasImpa) return null;
  const value = Number(formData.get("price"));
  return Number.isFinite(value) ? value : null;
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProduct(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const mainImage = String(formData.get("main_image") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const brandId = String(formData.get("brand_id") ?? "").trim();
  const hasImpa = parseHasImpa(formData);
  const price = parsePrice(formData, hasImpa);

  if (!name || !description || !categoryId || !mainImage) {
    return { error: "Name, category, description, and main image are required." };
  }

  const pricingError = validateProductPricing({
    hasImpa: false,
    price,
    impaCount: 0,
  });

  if (!hasImpa && pricingError) {
    return { error: pricingError };
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(String(formData.get("slug") ?? "") || name);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description,
      category_id: categoryId,
      brand_id: brandId || null,
      main_image: mainImage,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      has_impa: hasImpa,
      price: hasImpa ? null : price,
      is_active: formData.get("is_active") === "on",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await supabase.from("product_images").insert({
    product_id: data.id,
    image_url: mainImage,
    is_primary: true,
    sort_order: 0,
  });

  revalidateCatalog();
  redirect("/admin/products");
}

export async function updateProduct(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const mainImage = String(formData.get("main_image") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const brandId = String(formData.get("brand_id") ?? "").trim();
  const hasImpa = parseHasImpa(formData);
  const price = parsePrice(formData, hasImpa);
  const confirmRemoveImpa = formData.get("confirm_remove_impa") === "yes";
  const previousHasImpa = formData.get("previous_has_impa") === "yes";

  if (!id || !name || !description || !categoryId || !mainImage) {
    return { error: "All required product fields must be filled." };
  }

  const supabase = await createSupabaseServerClient();

  const { count: impaCount } = await supabase
    .from("product_impa")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if (previousHasImpa && !hasImpa && !confirmRemoveImpa) {
    return {
      error: "Confirm IMPA removal to switch this product to direct pricing.",
    };
  }

  if (hasImpa && (impaCount ?? 0) < 1) {
    return { error: "Add at least one IMPA entry before saving an IMPA product." };
  }

  if (!hasImpa) {
    const pricingError = validateProductPricing({
      hasImpa: false,
      price,
      impaCount: 0,
    });
    if (pricingError) {
      return { error: pricingError };
    }
  }

  if (previousHasImpa && !hasImpa) {
    await supabase.from("product_impa").delete().eq("product_id", id);
  }

  const slug = slugify(String(formData.get("slug") ?? "") || name);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description,
      category_id: categoryId,
      brand_id: brandId || null,
      main_image: mainImage,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      has_impa: hasImpa,
      price: hasImpa ? null : price,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  const { data: primaryImage } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", id)
    .eq("is_primary", true)
    .maybeSingle();

  if (primaryImage?.id) {
    await supabase
      .from("product_images")
      .update({ image_url: mainImage })
      .eq("id", primaryImage.id);
  } else {
    await supabase.from("product_images").insert({
      product_id: id,
      image_url: mainImage,
      is_primary: true,
      sort_order: 0,
    });
  }

  revalidateCatalog();
  return { success: "Product updated." };
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("products").delete().eq("id", id);
  revalidateCatalog();
}

export async function createImpaEntry(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const productId = String(formData.get("product_id") ?? "");
  const impaNumber = String(formData.get("impa_number") ?? "").trim();
  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const inventoryUom = String(formData.get("inventory_uom") ?? "EA").trim();
  const price = Number(formData.get("price") ?? 0);
  const isDefault = formData.get("is_default") === "on";

  if (!productId || !impaNumber || !itemDescription || !Number.isFinite(price)) {
    return { error: "IMPA number, description, and price are required." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("has_impa")
    .eq("id", productId)
    .single();

  if (!product?.has_impa) {
    return {
      error: "Enable IMPA pricing on this product before adding IMPA entries.",
    };
  }

  if (isDefault) {
    await supabase
      .from("product_impa")
      .update({ is_default: false })
      .eq("product_id", productId);
  }

  const { error } = await supabase.from("product_impa").insert({
    product_id: productId,
    impa_number: impaNumber,
    item_description: itemDescription,
    inventory_uom: inventoryUom || "EA",
    price,
    is_default: isDefault,
  });

  if (error) {
    return { error: error.message };
  }

  await supabase
    .from("products")
    .update({ has_impa: true, price: null })
    .eq("id", productId);

  revalidateCatalog();
  return { success: "IMPA entry added." };
}

export async function updateImpaEntry(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const impaNumber = String(formData.get("impa_number") ?? "").trim();
  const itemDescription = String(formData.get("item_description") ?? "").trim();
  const inventoryUom = String(formData.get("inventory_uom") ?? "EA").trim();
  const price = Number(formData.get("price") ?? 0);
  const isDefault = formData.get("is_default") === "on";

  if (!id || !productId || !impaNumber || !itemDescription) {
    return { error: "All IMPA fields are required." };
  }

  const supabase = await createSupabaseServerClient();

  if (isDefault) {
    await supabase
      .from("product_impa")
      .update({ is_default: false })
      .eq("product_id", productId);
  }

  const { error } = await supabase
    .from("product_impa")
    .update({
      impa_number: impaNumber,
      item_description: itemDescription,
      inventory_uom: inventoryUom || "EA",
      price,
      is_default: isDefault,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateCatalog();
  return { success: "IMPA entry updated." };
}

export async function deleteImpaEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  if (!id || !productId) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("product_impa").delete().eq("id", id);

  const { count } = await supabase
    .from("product_impa")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((count ?? 0) === 0) {
    await supabase
      .from("products")
      .update({ has_impa: true, price: null })
      .eq("id", productId);
  }

  revalidateCatalog();
}

export async function createCategory(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;

  if (!name) {
    return { error: "Category name is required." };
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(String(formData.get("slug") ?? "") || name);

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parent) {
      return { error: "Selected parent category was not found." };
    }
  }

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    parent_id: parentId,
    description: description || null,
    image: image || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: formData.get("is_active") !== "off",
  });

  if (error) {
    return { error: error.message };
  }

  revalidateCatalog();
  return { success: "Category created." };
}

export async function updateCategory(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;

  if (!id || !name) {
    return { error: "Category name is required." };
  }

  const supabase = await createSupabaseServerClient();
  const slug = slugify(String(formData.get("slug") ?? "") || name);

  const { data: allCategories, error: listError } = await supabase
    .from("categories")
    .select("id, parent_id");

  if (listError) {
    return { error: listError.message };
  }

  if (
    wouldCreateCategoryCycle(allCategories ?? [], id, parentId)
  ) {
    return { error: "Invalid parent category. That would create a circular hierarchy." };
  }

  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parent) {
      return { error: "Selected parent category was not found." };
    }
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      parent_id: parentId,
      description: description || null,
      image: image || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateCatalog();
  return { success: "Category updated." };
}

export async function deleteCategory(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Category not found." };

  const supabase = await createSupabaseServerClient();

  const { data: allCategories, error: listError } = await supabase
    .from("categories")
    .select("id, parent_id");

  if (listError) {
    return { error: listError.message };
  }

  const categories = (allCategories ?? []) as Array<{ id: string; parent_id: string | null }>;

  const childCount = categories.filter((category) => category.parent_id === id).length;
  if (childCount > 0) {
    return {
      error:
        "This category contains child categories. Please move or remove them before deleting.",
    };
  }

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      error:
        "This category contains products. Please move or remove them before deleting.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidateCatalog();
  return { success: "Category deleted." };
}

export async function updateOrderStatus(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as import("@/types/database").OrderStatus;
  const note = String(formData.get("note") ?? "").trim();

  if (!orderId || !status) {
    return { error: "Order and status are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  if (note) {
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status,
      note,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: "Order status updated." };
}

export async function updateCustomerActive(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const profileId = String(formData.get("profile_id") ?? "");
  const isActive = formData.get("is_active") === "yes";

  if (!profileId) {
    return { error: "Customer not found." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/customers");
  return { success: isActive ? "Customer activated." : "Customer deactivated." };
}

export async function getAdminSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    email: user.email ?? getAdminEmail(),
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      getAdminDisplayName(),
  };
}
