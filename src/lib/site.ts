export const siteConfig = {
  name: "Himmat Oilfield Equipment Trading Co. LLC",
  shortName: "Himmat",
  legalName: "Himmat Oilfield Equipment Trading Co. LLC",
  url: "https://www.himmat.ae",
  tagline: "Oilfields & marine suppliers in the UAE",
  description:
    "Himmat Oilfield Equipment Trading Co. LLC supplies industrial pipes and valves for oil & gas, marine, power, pipeline, and utility industries across the UAE and GCC.",
  announcement:
    "Trusted pipes & valves supplier for oilfields, marine, and industrial projects across the UAE.",
  email: "sales@himmat.ae",
  phone: "+971545150172",
  phoneDisplay: "+971 54 515 0172",
  whatsapp: "971545150172",
  linkedin: "https://www.linkedin.com/company/himmat-oilfields",
  keywords: [
    "Himmat Oil Fields",
    "marine valves UAE",
    "industrial pipes UAE",
    "oilfield equipment supplier",
    "valve suppliers Dubai",
    "oil and gas pipes",
  ],
} as const;

export const socialLinks = [
  {
    label: "LinkedIn",
    href: siteConfig.linkedin,
    external: true,
    icon: "linkedin" as const,
  },
  {
    label: "WhatsApp",
    href: `https://wa.me/${siteConfig.whatsapp}`,
    external: true,
    icon: "whatsapp" as const,
  },
  {
    label: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    external: false,
    icon: "email" as const,
  },
  {
    label: siteConfig.phoneDisplay,
    href: `tel:${siteConfig.phone}`,
    external: false,
    icon: "phone" as const,
  },
] as const;
