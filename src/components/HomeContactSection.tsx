import { siteConfig, socialLinks } from "@/lib/site";
import { SectionPageLink } from "@/components/SectionPageLink";

type HomeContactSectionProps = {
  pageLink?: { href: string; label: string };
};

export function HomeContactSection({ pageLink }: HomeContactSectionProps) {
  return (
    <section
      id="contact"
      className="border-t border-[#e8e8e8] bg-white px-6 py-24 sm:px-10 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
            Contact
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[#141414] sm:text-4xl">
            Get in touch
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#6b6b6b]">
            Reach our team for product enquiries, quotes, and project support
            across the UAE and GCC.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-[#e8e8e8] bg-[#f7f7f7] p-6">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
              Email
            </p>
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-sm font-medium text-[#141414] transition-colors hover:text-[#bd1115]"
            >
              {siteConfig.email}
            </a>
          </div>

          <div className="border border-[#e8e8e8] bg-[#f7f7f7] p-6">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
              Phone
            </p>
            <a
              href={`tel:${siteConfig.phone}`}
              className="text-sm font-medium text-[#141414] transition-colors hover:text-[#bd1115]"
            >
              {siteConfig.phoneDisplay}
            </a>
          </div>

          {socialLinks.slice(0, 2).map((link) => (
            <div
              key={link.icon}
              className="border border-[#e8e8e8] bg-[#f7f7f7] p-6"
            >
              <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#bd1115] uppercase">
                {link.label}
              </p>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#141414] transition-colors hover:text-[#bd1115]"
              >
                Connect on {link.label}
              </a>
            </div>
          ))}
        </div>

        {pageLink ? (
          <SectionPageLink href={pageLink.href} label={pageLink.label} />
        ) : null}
      </div>
    </section>
  );
}
