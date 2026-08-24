import type { Metadata } from "next";
import { PolicyLayout, PolicySection } from "@/components/PolicyLayout";
import { ContactEmailLink, ContactPhoneLink } from "@/components/ContactLinks";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Cancellation & Returns | Himmat Oilfields & Marines",
  description:
    "Delivery, cancellation, returns and warranty policy for Himmat Oilfield Equipment Trading Co. LLC.",
  path: "/cancellations-and-returns",
});

export default function CancellationsAndReturnsPage() {
  return (
    <PolicyLayout
      eyebrow="Policies"
      title="Cancellation & Returns"
      subtitle="Delivery, Cancellation, Returns & Warranty Policy"
    >
      <p>
        At {siteConfig.name}, we work with trusted suppliers and vendors to
        ensure efficient order fulfillment and dependable service. Please read
        the following policy carefully before placing your order.
      </p>

      <PolicySection title="1. Delivery of Orders">
        <p>
          Himmat partners with suppliers and vendors who maintain stock of their
          products for prompt dispatch and delivery.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[#141414]">Typical Dispatch Time:</strong> 2
            to 7 working days within the UAE.
          </li>
          <li>
            <strong className="text-[#141414]">Delivery Charges:</strong> Any
            applicable delivery or shipping charges will be shown before order
            confirmation.
          </li>
          <li>
            <strong className="text-[#141414]">Delivery Timeline Update:</strong>{" "}
            If dispatch or delivery may take longer than 7 working days, our team
            will contact you with a revised timeline.
          </li>
        </ul>
        <p>
          Approved refunds will be processed through the original payment method
          within 7 to 15 working days from the date of refund approval.
        </p>
      </PolicySection>

      <PolicySection title="2. Partial Shipment Policy">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Partial shipments may be made to reduce waiting time and improve
            fulfillment efficiency.
          </li>
          <li>
            You will only be charged the delivery fee shown at checkout unless
            otherwise agreed in advance.
          </li>
          <li>
            Unavailable items may be cancelled individually with a refund for
            those items only.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="3. Order Cancellation">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Orders may be cancelled without penalty{" "}
            <strong className="text-[#141414]">before dispatch</strong>.
          </li>
          <li>
            Once dispatched or handed over for delivery, cancellation may not be
            possible.
          </li>
          <li>
            Approved refunds are processed to the original payment method within
            7 to 15 working days.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="4. Returns & Replacement Policy">
        <p>
          Customers are requested to verify product suitability before placing an
          order. Returns are generally not accepted for change of mind, incorrect
          customer selection, compatibility issues not caused by incorrect
          listing, or special procurement items.
        </p>
        <p>
          A return or replacement may be accepted within 3 days of delivery for
          manufacturing defects, wrong product delivery, or damaged condition on
          receipt.
        </p>
        <p>
          A <strong className="text-[#141414]">20% restocking fee</strong> may
          apply on approved returns not attributable to Himmat error.
        </p>
      </PolicySection>

      <PolicySection title="5. Return Process">
        <p>
          To initiate a return or replacement request, contact{" "}
          <ContactEmailLink /> within the eligible period with your order
          details and supporting images or videos where applicable.
        </p>
      </PolicySection>

      <PolicySection title="6. Return Shipping Costs">
        <p>
          Return shipping may be reimbursed for Himmat errors. Otherwise, return
          shipping charges may be borne by the customer and deducted from the
          refund.
        </p>
      </PolicySection>

      <PolicySection title="7. Refund Policy">
        <ul className="list-disc space-y-2 pl-5">
          <li>Refunds are made through the original mode of payment.</li>
          <li>Processing typically takes 7 to 15 working days after approval.</li>
          <li>Banking or payment gateway delays are outside Himmat&apos;s control.</li>
        </ul>
      </PolicySection>

      <PolicySection title="8. Warranty Issues">
        <p>
          For warranty support, email <ContactEmailLink /> with order details,
          images or videos of the issue, and a clear description of the problem.
        </p>
      </PolicySection>

      <PolicySection title="9. Product Images, Descriptions & Availability">
        <p>
          Product images are for illustration purposes only. Himmat reserves the
          right to correct errors and cancel orders arising from inaccuracies,
          with a full refund where applicable.
        </p>
      </PolicySection>

      <PolicySection title="10. Non-Returnable Products">
        <ul className="list-disc space-y-2 pl-5">
          <li>Electrical items once installed or used</li>
          <li>Consumables and chemical products</li>
          <li>Custom-made, special-order, bulk, or indent items</li>
        </ul>
      </PolicySection>

      <PolicySection title="11. Force Majeure">
        <p>
          Himmat is not liable for delays caused by events beyond reasonable
          control, including natural disasters, government restrictions, supply
          chain disruption, or labor disputes.
        </p>
      </PolicySection>

      <PolicySection title="12. Limitation of Liability">
        <p>
          Himmat&apos;s liability for any product purchased through the website
          is limited to the amount paid for the relevant product, to the maximum
          extent permitted by applicable law.
        </p>
      </PolicySection>

      <PolicySection title="13. Contact Us">
        <p>
          <strong className="text-[#141414]">Email:</strong> <ContactEmailLink />
        </p>
        <p>
          <strong className="text-[#141414]">Phone:</strong> <ContactPhoneLink />
        </p>
        <p>
          For questions regarding delivery, returns, cancellations, or warranty
          support, please contact our customer service team.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
