import type { Metadata } from "next";
import { PolicyLayout, PolicySection } from "@/components/PolicyLayout";
import { ContactEmailLink } from "@/components/ContactLinks";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Refund Policy | Himmat Oilfields & Marines",
  description:
    "Return and refund policy for Himmat Oilfield Equipment Trading Co. LLC.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <PolicyLayout eyebrow="Policies" title="Refund policy">
      <PolicySection title="Returns">
        <p>
          We have a 7-day return policy, which means you have 7 days after
          receiving your item to request a return.
        </p>
        <p>
          To be eligible for a return, your item must be in the same condition
          that you received it, unused, with tags, and in its original
          packaging. You&apos;ll also need the receipt or proof of purchase.
        </p>
        <p>
          To start a return, contact us at <ContactEmailLink />. Returns must
          be sent to the address we provide after your return request is
          approved.
        </p>
        <p>
          If your return is accepted, we&apos;ll send you a return shipping label
          and instructions on how and where to send your package. Items sent
          back without first requesting a return will not be accepted.
        </p>
      </PolicySection>

      <PolicySection title="Damages and issues">
        <p>
          Please inspect your order upon reception and contact us immediately if
          the item is defective, damaged, or if you receive the wrong item, so
          that we can evaluate the issue and make it right.
        </p>
      </PolicySection>

      <PolicySection title="Exceptions / non-returnable items">
        <p>
          Certain types of items cannot be returned, including custom products,
          special orders, hazardous materials, flammable liquids, or gases.
          Please get in touch if you have questions about your specific item.
        </p>
        <p>
          Unfortunately, we cannot accept returns on sale items or gift cards.
        </p>
      </PolicySection>

      <PolicySection title="Exchanges">
        <p>
          The fastest way to ensure you get what you want is to return the item
          you have, and once the return is accepted, make a separate purchase for
          the new item.
        </p>
      </PolicySection>

      <PolicySection title="European Union 14 day cooling off period">
        <p>
          Notwithstanding the above, if merchandise is being shipped into the
          European Union, you have the right to cancel or return your order
          within 14 days, for any reason and without justification. Your item
          must be in the same condition that you received it, unused, with tags,
          and in its original packaging, along with receipt or proof of purchase.
        </p>
      </PolicySection>

      <PolicySection title="Refunds">
        <p>
          We will notify you once we&apos;ve received and inspected your return,
          and let you know if the refund was approved or not. If approved,
          you&apos;ll be automatically refunded on your original payment method
          within 10 business days. Please remember it can take some time for
          your bank or credit card company to process and post the refund.
        </p>
        <p>
          If more than 15 business days have passed since we&apos;ve approved
          your return, please contact us at <ContactEmailLink />.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
