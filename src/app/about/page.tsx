import type { Metadata } from "next";
import { AboutSection } from "@/components/AboutSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "About Us | Himmat Oilfields & Marines",
  description: `${siteConfig.name} — ${siteConfig.tagline}. Quality products and integrated support for oil & gas, marine, and utility industries.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageLayout>
      <PageHeader
        eyebrow="About"
        title="Oilfields & marine suppliers"
        description={siteConfig.description}
      />
      <div className="mt-10">
        <AboutSection compact />
      </div>
    </PageLayout>
  );
}
