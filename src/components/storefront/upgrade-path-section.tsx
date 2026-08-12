"use client";

import Image from "next/image";
import Link from "next/link";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Container } from "@/components/ui/container";

const upgradePaths = [
  {
    id: "phones",
    code: "01",
    label: "Phones",
    eyebrow: "Pocket-ready",
    title: "Find the phone that fits your everyday.",
    description:
      "Explore current GadgetMoTo phones with confirmed variants and prices.",
    href: "/phones",
    action: "Explore phones",
  },
  {
    id: "tablets",
    code: "02",
    label: "Tablets",
    eyebrow: "More room",
    title: "Open up a bigger way to work and unwind.",
    description:
      "Browse the verified tablet catalog and compare the available configurations.",
    href: "/tablets",
    action: "Explore tablets",
  },
  {
    id: "compare",
    code: "03",
    label: "Compare",
    eyebrow: "Side by side",
    title: "Turn a shortlist into a clearer decision.",
    description:
      "Compare up to three products using confirmed GadgetMoTo catalog details.",
    href: "/compare",
    action: "Start comparing",
  },
  {
    id: "sale",
    code: "04",
    label: "Sale",
    eyebrow: "Current offers",
    title: "See today’s marked-down devices in one place.",
    description:
      "Open the current sale selection and review each product’s confirmed pricing.",
    href: "/sale",
    action: "View sale products",
  },
] as const;

export function UpgradePathSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePath = upgradePaths[activeIndex];

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % upgradePaths.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + upgradePaths.length) % upgradePaths.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = upgradePaths.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    const tabs = event.currentTarget
      .closest<HTMLElement>("[role='tablist']")
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs?.[nextIndex]?.focus();
  };

  return (
    <section aria-labelledby="upgrade-path-title" className="upgrade-path">
      <Container className="storefront-container upgrade-path__container">
        <div className="upgrade-path__heading">
          <p className="type-eyebrow text-sky-300">Find your route</p>
          <h2 id="upgrade-path-title">Choose your next upgrade path.</h2>
          <p>
            Move between the ways to explore GadgetMoTo, then jump directly to
            the catalog view that matches what you need.
          </p>
        </div>

        <div className="upgrade-path__shell">
          <div aria-label="Choose an upgrade path" className="upgrade-path__tabs" role="tablist">
            {upgradePaths.map((path, index) => (
              <button
                aria-controls="upgrade-path-panel"
                aria-selected={activeIndex === index}
                className="upgrade-path__tab"
                id={`upgrade-path-tab-${path.id}`}
                key={path.id}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                <span>{path.code}</span>
                {path.label}
              </button>
            ))}
          </div>

          <div className="upgrade-path__content-grid">
            <div
              aria-labelledby={`upgrade-path-tab-${activePath.id}`}
              className="upgrade-path__panel"
              id="upgrade-path-panel"
              role="tabpanel"
            >
              <div aria-live="polite" className="upgrade-path__copy">
                <p>{activePath.eyebrow}</p>
                <h3>{activePath.title}</h3>
                <span>{activePath.description}</span>
              </div>
              <Link className="upgrade-path__action" href={activePath.href}>
                {activePath.action}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div aria-hidden="true" className="upgrade-path__visual" data-path={activePath.id}>
              <div className="upgrade-path__grid" />
              <div className="upgrade-path__orbit upgrade-path__orbit--one" />
              <div className="upgrade-path__orbit upgrade-path__orbit--two" />
              <div className="upgrade-path__scan" />
              <div className="upgrade-path__device upgrade-path__device--primary">
                <Image
                  alt=""
                  className="upgrade-path__device-logo"
                  height={900}
                  sizes="(max-width: 639px) 6rem, 10rem"
                  src="/brand/gadgetmoto-admin-logo.jpg"
                  width={901}
                />
              </div>
              <div className="upgrade-path__device upgrade-path__device--secondary" />
              <div className="upgrade-path__sale-signal">PRICE ↓</div>
              <div className="upgrade-path__status">
                <span>ACTIVE PATH</span>
                <strong>{activePath.label}</strong>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
