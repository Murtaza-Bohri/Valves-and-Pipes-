import { PageLayout } from "@/components/PageLayout";

export default function CategoryLoading() {
  return (
    <PageLayout className="bg-[#f7f7f7]">
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-10 sm:px-10">
        <div className="mb-6 h-4 w-48 rounded bg-[#e8e8e8]" />
        <div className="mb-4 h-10 w-2/3 max-w-md rounded bg-[#e8e8e8]" />
        <div className="mb-10 h-4 w-full max-w-xl rounded bg-[#e8e8e8]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square border border-[#e8e8e8] bg-white"
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
