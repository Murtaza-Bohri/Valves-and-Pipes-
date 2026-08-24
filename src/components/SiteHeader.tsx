import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Navbar } from "@/components/Navbar";
import { getStoreCategories } from "@/lib/products-data";

export async function SiteHeader() {
  const categories = await getStoreCategories();

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <AnnouncementBar />
      <Navbar categories={categories} />
    </div>
  );
}
