import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/app/admin/actions";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <AdminShell adminName={session.name}>{children}</AdminShell>;
}

export async function generateMetadata() {
  return {
    title: "Admin | Himmat",
    robots: { index: false, follow: false },
  };
}
