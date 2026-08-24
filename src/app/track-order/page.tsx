import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/TrackOrderClient";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Track Order | Himmat Oilfields & Marines",
  description: "Track your Himmat order using your Order ID and email.",
  path: "/track-order",
});

type TrackOrderPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const { order } = await searchParams;

  return (
    <PageLayout className="bg-[#f7f7f7]">
      <PageHeader
        eyebrow="Orders"
        title="Track your order"
        description="Enter your Order ID and the email used at checkout."
      />
      <div className="mt-10">
        <TrackOrderClient initialOrderNumber={order ?? ""} />
      </div>
    </PageLayout>
  );
}
