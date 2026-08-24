import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

type PageLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageLayout({ children, className = "bg-white" }: PageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main
        className={`min-h-screen pb-16 pt-[calc(var(--site-header-height)+3rem)] ${className}`}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-10">
      <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
        {eyebrow}
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#141414] sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#6b6b6b] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
