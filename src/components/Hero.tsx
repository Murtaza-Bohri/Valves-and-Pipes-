"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { siteConfig } from "@/lib/site";
import { motion } from "motion/react";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { scale: 1.12 },
        {
          scale: 1,
          duration: 2.2,
          ease: "power2.out",
        }
      );

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });

      tl.from(logoRef.current, {
        y: 56,
        opacity: 0,
        duration: 1.1,
      })
        .from(
          lineRef.current,
          {
            scaleX: 0,
            duration: 0.7,
            transformOrigin: "left center",
          },
          "-=0.5"
        )
        .from(
          subRef.current,
          {
            y: 28,
            opacity: 0,
            duration: 0.85,
          },
          "-=0.35"
        )
        .from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.4"
        );

      gsap.to(imageRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative flex min-h-screen items-end overflow-hidden"
    >
      <div ref={imageRef} className="absolute inset-0">
        <Image
          src="/banner.png"
          alt={`${siteConfig.shortName} oil terminal operations banner`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      <div className="relative z-10 w-full px-6 pb-20 pt-[calc(var(--site-header-height)+2rem)] sm:px-10 sm:pb-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div ref={logoRef} className="max-w-xl">
            <Image
              src="/logo.png"
              alt={`${siteConfig.shortName} logo`}
              width={764}
              height={158}
              className="h-auto w-full max-w-[280px] sm:max-w-[360px] md:max-w-[420px]"
              priority
            />
          </div>
          <div ref={lineRef} className="my-7 h-[3px] w-16 bg-[#bd1115]" />
          <p
            ref={subRef}
            className="max-w-md text-base leading-relaxed text-white/85 sm:text-lg"
          >
            Specialized integrated support and top-quality supplies for oil &
            gas, marine, power, and utility industries.
          </p>
          <motion.a
            ref={ctaRef}
            href="#about"
            className="mt-9 inline-flex items-center justify-center bg-[#bd1115] px-8 py-3.5 text-sm font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-[#9a0e12]"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Discover Himmat
          </motion.a>
        </div>
      </div>
    </section>
  );
}
