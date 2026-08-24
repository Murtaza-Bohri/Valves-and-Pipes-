import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { CategoriesSection } from "@/components/CategoriesSection";
import { StatsSection } from "@/components/StatsSection";
import { HomeContactSection } from "@/components/HomeContactSection";
import { Footer } from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";
import { getStoreCategories } from "@/lib/products-data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Himmat Oilfields & Marines | Pipes & Valves Suppliers in UAE",
  description: siteConfig.description,
  path: "/",
});

export default async function Home() {
  const categories = await getStoreCategories();

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <Hero />
        <AboutSection
          pageLink={{ href: "/about", label: "Learn more about us" }}
        />
        <CategoriesSection
          categories={categories}
          pageLink={{ href: "/categories", label: "View all categories" }}
        />
        <StatsSection
          pageLink={{ href: "/experience", label: "See our track record" }}
        />
        <HomeContactSection
          pageLink={{ href: "/contact", label: "Contact us" }}
        />
        <Footer />
      </div>
    </>
  );
}
