import { notFound } from "next/navigation";
import { AdminOrderDetail } from "@/components/admin/AdminOrdersList";
import { getAdminOrderDetail } from "@/lib/orders";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const detail = await getAdminOrderDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <AdminOrderDetail
      order={detail.order}
      items={detail.items}
      history={detail.history}
    />
  );
}
