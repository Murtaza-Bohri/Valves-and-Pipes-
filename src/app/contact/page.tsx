import type { Metadata } from "next";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig, socialLinks } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Contact Us | Himmat Oilfields & Marines",
  description: `Contact ${siteConfig.name}. Email ${siteConfig.email} or call ${siteConfig.phoneDisplay}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <PageLayout>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch"
        description="Reach our team for product enquiries, quotes, and project support."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 px-6 sm:px-10 md:grid-cols-2">
        <div className="border border-[#e8e8e8] bg-[#f7f7f7] p-8">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-[#141414]">
            Direct contact
          </h2>
          <ul className="space-y-4 text-sm text-[#6b6b6b]">
            <li>
              <span className="block text-xs font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
                Email
              </span>
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-base transition-colors hover:text-[#bd1115]"
              >
                {siteConfig.email}
              </a>
            </li>
            <li>
              <span className="block text-xs font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
                Phone
              </span>
              <a
                href={`tel:${siteConfig.phone}`}
                className="text-base transition-colors hover:text-[#bd1115]"
              >
                {siteConfig.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <div className="border border-[#e8e8e8] bg-white p-8">
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-[#141414]">
            Connect online
          </h2>
          <ul className="space-y-3 text-sm">
            {socialLinks.map((link) => (
              <li key={link.icon}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="font-medium text-[#6b6b6b] transition-colors hover:text-[#bd1115]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}
