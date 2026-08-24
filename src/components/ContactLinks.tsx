import { siteConfig } from "@/lib/site";

export function ContactEmailLink() {
  return (
    <a
      href={`mailto:${siteConfig.email}`}
      className="font-medium text-[#bd1115] hover:underline"
    >
      {siteConfig.email}
    </a>
  );
}

export function ContactPhoneLink() {
  return (
    <a
      href={`tel:${siteConfig.phone}`}
      className="font-medium text-[#bd1115] hover:underline"
    >
      {siteConfig.phoneDisplay}
    </a>
  );
}
