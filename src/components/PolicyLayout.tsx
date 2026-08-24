import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

type PolicyLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function PolicyLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: PolicyLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white pb-16 pt-[calc(var(--site-header-height)+3rem)]">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <Link
            href="/"
            className="mb-8 inline-block text-sm font-semibold tracking-[0.12em] text-[#bd1115] uppercase transition-colors hover:text-[#9a0e12]"
          >
            ← Back to home
          </Link>

          <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
            {eyebrow}
          </p>
          <h1 className="mb-4 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#141414] sm:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mb-10 text-lg text-[#6b6b6b]">{subtitle}</p>
          ) : (
            <div className="mb-10" />
          )}

          <article className="space-y-10 text-base leading-relaxed text-[#6b6b6b]">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#141414]">
        {title}
      </h2>
      {children}
    </section>
  );
}
