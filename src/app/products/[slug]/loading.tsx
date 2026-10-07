import { PageLayout } from "@/components/PageLayout";

export default function ProductLoading() {
  return (
    <PageLayout className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-10 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square border border-[#e8e8e8] bg-white" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-[#e8e8e8]" />
            <div className="h-4 w-full rounded bg-[#e8e8e8]" />
            <div className="h-4 w-5/6 rounded bg-[#e8e8e8]" />
            <div className="mt-8 h-48 w-full rounded bg-[#e8e8e8]" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
