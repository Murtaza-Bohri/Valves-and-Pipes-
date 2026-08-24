import type { Metadata } from "next";
import { StatsSection } from "@/components/StatsSection";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Experience | Himmat Oilfields & Marines",
  description:
    "Himmat Oil Fields — projects delivered, years of experience, and partner networks across the UAE and GCC.",
  path: "/experience",
});

export default function ExperiencePage() {
  return (
    <PageLayout>
      <PageHeader
        eyebrow="Experience"
        title="Performance measured in outcomes"
        description="Trusted delivery across oil & gas, marine, and industrial supply projects."
      />
      <div className="mx-auto mt-10 max-w-6xl px-6 sm:px-10">
        <div className="overflow-hidden bg-[#141414]">
          <StatsSection compact />
        </div>
      </div>
    </PageLayout>
  );
}
