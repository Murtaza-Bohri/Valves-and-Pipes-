import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export function JsonLd() {
  const schema = [organizationJsonLd(), websiteJsonLd()];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
