"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Container } from "@/components/ui/container";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const brands = [
  {
    name: "Xiaomi",
    logo: "/brands/xiaomi.svg",
    logoHeight: 512,
    logoWidth: 512,
    logoKind: "symbol",
    tone: "xiaomi",
  },
  {
    name: "Apple",
    logo: "/brands/apple.svg",
    logoHeight: 1000,
    logoWidth: 814,
    logoKind: "symbol",
    tone: "apple",
  },
  {
    name: "POCO",
    logo: "/brands/poco.svg",
    logoHeight: 60,
    logoWidth: 106,
    logoKind: "compact",
    tone: "poco",
  },
  {
    name: "Redmi",
    logo: "/brands/redmi.svg",
    logoHeight: 119,
    logoWidth: 512,
    logoKind: "wordmark",
    tone: "redmi",
  },
  {
    name: "Infinix",
    logo: "/brands/infinix.svg",
    logoHeight: 111,
    logoWidth: 512,
    logoKind: "wordmark",
    tone: "infinix",
  },
  {
    name: "TECNO",
    logo: "/brands/tecno.svg",
    logoHeight: 103,
    logoWidth: 512,
    logoKind: "wordmark",
    tone: "tecno",
  },
] as const;

export function BrandLogoCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const items = track
        ? Array.from(
            track.querySelectorAll<HTMLElement>("[data-brand-slide]"),
          )
        : [];

      if (!section || !track || items.length < 2) return;

      const media = gsap.matchMedia();

      media.add(
        {
          allowMotion: "(prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          track.scrollLeft = 0;
          setActiveIndex(0);

          if (context.conditions?.reduceMotion) return;

          track.classList.add("brand-carousel__track--scroll-driven");

          const maximumScroll = () =>
            Math.max(0, track.scrollWidth - track.clientWidth);
          const scrollPosition = (index: number) =>
            Math.min(
              maximumScroll(),
              Math.max(0, items[index].offsetLeft - track.offsetLeft),
            );
          const stepDistance = () =>
            Math.max(420, Math.min(window.innerHeight * 0.55, 620));

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              anticipatePin: 1,
              end: () => `+=${stepDistance() * (items.length - 1)}`,
              invalidateOnRefresh: true,
              onUpdate: (trigger) => {
                setActiveIndex(
                  Math.min(
                    items.length - 1,
                    Math.round(trigger.progress * (items.length - 1)),
                  ),
                );
              },
              pin: true,
              scrub: true,
              start: "top top",
              trigger: section,
            },
          });

          items.slice(1).forEach((_, index) => {
            timeline.to(track, {
              duration: 1,
              scrollLeft: () => scrollPosition(index + 1),
            });
          });

          return () => {
            track.classList.remove("brand-carousel__track--scroll-driven");
          };
        },
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  const syncActiveBrand = () => {
    const track = trackRef.current;
    const items = track?.querySelectorAll<HTMLElement>("[data-brand-slide]");
    if (!track || !items?.length) return;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const distance = Math.abs(item.offsetLeft - track.offsetLeft - track.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  return (
    <section
      aria-labelledby="brand-carousel-title"
      className="brand-carousel"
      ref={sectionRef}
    >
      <Container className="storefront-container">
        <div className="brand-carousel__heading">
          <div>
            <p className="type-eyebrow text-[var(--color-action)]">
              Explore by brand
            </p>
            <h2 className="brand-carousel__title" id="brand-carousel-title">
              The names behind your next upgrade.
            </h2>
          </div>
          <div aria-hidden="true" className="brand-carousel__progress">
            <div className="brand-carousel__progress-label">
              <span>Scroll to explore</span>
              <strong>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(brands.length).padStart(2, "0")}
              </strong>
            </div>
            <span className="brand-carousel__progress-track">
              <span
                className="brand-carousel__progress-value"
                style={{ width: `${((activeIndex + 1) / brands.length) * 100}%` }}
              />
            </span>
          </div>
        </div>

        <div className="brand-carousel__frame">
          <div
            aria-label="Shop products by brand"
            className="brand-carousel__track"
            onScroll={syncActiveBrand}
            ref={trackRef}
            role="region"
            tabIndex={0}
          >
            {brands.map((brand, index) => (
              <Link
                aria-label={`Shop ${brand.name} products`}
                className={`brand-carousel__slide brand-carousel__slide--${brand.tone}`}
                data-brand-slide
                data-active={index === activeIndex ? "true" : undefined}
                href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                key={brand.name}
              >
                <span className="brand-carousel__meta" aria-hidden="true">
                  <span>Featured brand</span>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </span>
                <span className="brand-carousel__logo-stage">
                  <Image
                    alt={`${brand.name} logo`}
                    className={`brand-carousel__image brand-carousel__image--${brand.logoKind}`}
                    height={brand.logoHeight}
                    src={brand.logo}
                    unoptimized
                    width={brand.logoWidth}
                  />
                </span>
                <span className="brand-carousel__link">
                  Shop {brand.name} <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Showing {brands[activeIndex].name} in the brand carousel.
        </p>
      </Container>
    </section>
  );
}
