import { siteConfig, socialLinks } from "@/lib/site";
import { Linkedin, Mail, MessageCircle, Phone } from "lucide-react";

const iconMap = {
  linkedin: Linkedin,
  whatsapp: MessageCircle,
  email: Mail,
  phone: Phone,
} as const;

export function AnnouncementBar() {
  return (
    <div
      className="bg-[#bd1115] text-white"
      role="region"
      aria-label="Announcement and contact links"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-center text-[11px] font-medium tracking-wide sm:text-left sm:text-xs">
          {siteConfig.announcement}
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
          {socialLinks.map((link) => {
            const Icon = iconMap[link.icon];

            return (
              <li key={link.icon}>
                <a
                  href={link.href}
                  {...(link.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-white/95 transition-colors hover:text-white sm:text-xs"
                  aria-label={link.label}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden md:inline">{link.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
