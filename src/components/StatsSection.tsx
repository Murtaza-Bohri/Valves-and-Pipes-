"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { SectionPageLink } from "@/components/SectionPageLink";

const stats = [
  { value: 120, suffix: "+", label: "Projects delivered" },
  { value: 15, suffix: "+", label: "Years of experience" },
  { value: 40, suffix: "+", label: "Partner networks" },
];

type StatsSectionProps = {
  compact?: boolean;
  pageLink?: { href: string; label: string };
};

export function StatsSection({ compact = false, pageLink }: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-stat]", {
        y: 36,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      valueRefs.current.forEach((el, i) => {
        if (!el) return;
        const target = stats[i].value;
        const obj = { n: 0 };
        gsap.to(obj, {
          n: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.n)}`;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="experience"
      ref={sectionRef}
      className={`relative overflow-hidden px-6 sm:px-10 ${
        compact ? "py-12 sm:py-16" : "py-24 sm:py-28"
      } ${compact ? "bg-transparent" : "bg-[#141414]"}`}
    >
      {!compact && (
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#bd1115]/20 blur-3xl" />
      )}
      <div className="mx-auto max-w-6xl">
        {!compact && (
          <div className="mb-14 max-w-xl">
            <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#bd1115] uppercase">
              Experience
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl">
              Performance measured in outcomes
            </h2>
          </div>
        )}

        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-stat
              className={`border-t pt-8 ${
                compact ? "border-white/15" : "border-white/15"
              }`}
            >
              <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-white sm:text-5xl">
                <span
                  ref={(el) => {
                    valueRefs.current[i] = el;
                  }}
                >
                  0
                </span>
                <span className="text-[#bd1115]">{stat.suffix}</span>
              </p>
              <p className="mt-3 text-sm tracking-[0.12em] text-white/60 uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        {pageLink ? (
          <SectionPageLink
            href={pageLink.href}
            label={pageLink.label}
            variant="dark"
          />
        ) : null}
      </div>
    </section>
  );
}
