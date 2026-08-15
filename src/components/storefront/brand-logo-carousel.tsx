"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";

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
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [interacting, setInteracting] = useState(false);

  const scrollToBrand = useCallback((index: number) => {
    const track = trackRef.current;
    const items = track?.querySelectorAll<HTMLElement>("[data-brand-slide]");

    if (!track || !items?.length) return;

    const wrappedIndex = (index + items.length) % items.length;
    const target = items[wrappedIndex];
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActiveIndex(wrappedIndex);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (interacting || reducedMotion.matches) return;

    const timer = window.setInterval(() => {
      scrollToBrand(activeIndex + 1);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [activeIndex, interacting, scrollToBrand]);

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
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
    >
      <Container className="storefront-container">
        <div className="brand-carousel__heading">
          <p className="type-eyebrow text-[var(--color-action)]">Explore by brand</p>
          <h2 className="brand-carousel__title" id="brand-carousel-title">
            The names behind your next upgrade.
          </h2>
        </div>

        <div className="brand-carousel__frame">
          <div
            aria-label="Shop products by brand"
            className="brand-carousel__track"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
            }}
            onFocus={() => setInteracting(true)}
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
