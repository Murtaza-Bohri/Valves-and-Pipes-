"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { SectionPageLink } from "@/components/SectionPageLink";

type AboutSectionProps = {
  compact?: boolean;
  pageLink?: { href: string; label: string };
};

export function AboutSection({ compact = false, pageLink }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal]", {
        y: 48,
        opacity: 0,
        duration: 0.95,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`relative bg-white px-6 sm:px-10 ${
        compact ? "py-12 sm:py-16" : "py-24 sm:py-32"
      }`}
    >
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:items-center">
        {!compact && (
          <div data-reveal>
            <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
              Who we are
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#141414] sm:text-5xl">
              Oilfields & marine suppliers
            </h2>
          </div>
        )}

        <div
          data-reveal
          className={`space-y-6 ${compact ? "lg:col-span-2" : ""}`}
        >
          <div className="h-[3px] w-14 bg-[#bd1115]" />
          <p className="text-base leading-relaxed text-[#6b6b6b] sm:text-lg">
            We provide specialized integrated support services and top-quality
            product and equipment supplies to upstream and downstream Oil &
            Gas, Refining, Petrochemical, Marine, Power, Pipeline, Desalination,
            Water and Utility Industries across the globe.
          </p>
          <p className="text-base leading-relaxed text-[#6b6b6b] sm:text-lg">
            We aim to provide our customers with quality products and services at
            competitive prices, building undisputed relationships with our
            suppliers and customers.
          </p>
        </div>
        {pageLink ? (
          <SectionPageLink href={pageLink.href} label={pageLink.label} />
        ) : null}
      </div>
    </section>
  );
}
