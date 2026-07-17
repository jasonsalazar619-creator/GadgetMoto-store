"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HeroMotionProps = {
  children: ReactNode;
};

export function HeroMotion({ children }: HeroMotionProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const matchMedia = gsap.matchMedia();

      matchMedia.add(
        {
          allowMotion: "(prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
          mobile: "(max-width: 767px)",
          finePointer: "(pointer: fine) and (hover: hover)",
        },
        (context) => {
          if (context.conditions?.reduceMotion) {
            return;
          }

          const hero = scope.current?.querySelector<HTMLElement>("[data-hero-root]");
          if (!hero) {
            return;
          }

          const isMobile = Boolean(context.conditions?.mobile);
          const ambientTweens: gsap.core.Tween[] = [];

          const entrance = gsap.timeline({
            defaults: { ease: "power3.out" },
            paused: true,
            onComplete: () => ambientTweens.forEach((tween) => tween.play()),
          });

          entrance
            .from("[data-hero-glow], [data-hero-ring]", {
              autoAlpha: 0,
              scale: 0.9,
              duration: 0.72,
              stagger: 0.08,
              transformOrigin: "center",
            })
            .from("[data-hero-eyebrow]", { autoAlpha: 0, y: isMobile ? 16 : 20, duration: 0.48 }, 0.1)
            .from(
              "[data-hero-line]",
              { autoAlpha: 0, y: isMobile ? 30 : 45, duration: 0.68, stagger: 0.09 },
              0.18,
            )
            .from("[data-hero-copy]", { autoAlpha: 0, y: isMobile ? 18 : 24, duration: 0.56 }, 0.46)
            .from(
              "[data-hero-action]",
              { autoAlpha: 0, y: isMobile ? 12 : 18, duration: 0.48, stagger: 0.08 },
              0.56,
            )
            .from(
              "[data-hero-device-visual='tablet']",
              { autoAlpha: 0, x: isMobile ? 14 : 32, y: isMobile ? 20 : 34, rotation: "+=5", scale: 0.9, duration: 0.9 },
              0.24,
            )
            .from(
              "[data-hero-device-visual='phone']",
              { autoAlpha: 0, y: isMobile ? 42 : 70, rotation: "-=4", scale: 0.88, duration: 0.96 },
              0.34,
            )
            .from(
              "[data-hero-card]",
              { autoAlpha: 0, scale: 0.85, y: isMobile ? 12 : 18, duration: 0.52, stagger: 0.1 },
              0.76,
            );

          ambientTweens.push(
            gsap.to("[data-hero-device-ambient='phone']", {
              y: isMobile ? -4 : -7,
              duration: 3.4,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
            gsap.to("[data-hero-device-ambient='tablet']", {
              y: isMobile ? 3 : 5,
              duration: 4.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
            gsap.to("[data-hero-ring-ambient]", {
              rotation: (index) => (index === 0 ? 3 : -2.5),
              duration: 13,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
              stagger: 1.2,
            }),
          );

          gsap.utils.toArray<HTMLElement>("[data-hero-card-ambient]").forEach((card, index) => {
            ambientTweens.push(
              gsap.to(card, {
                y: isMobile ? -2 - index : -3 - index * 1.5,
                duration: 3.8 + index * 0.55,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                paused: true,
              }),
            );
          });

          const scrollTimeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: isMobile ? 0.65 : 0.85,
              invalidateOnRefresh: true,
            },
          });

          scrollTimeline
            .to("[data-hero-text-scroll]", { y: isMobile ? -42 : -90, autoAlpha: isMobile ? 0.25 : 0.08 }, 0)
            .to("[data-hero-device-scroll='phone']", { y: isMobile ? -30 : -78, scale: isMobile ? 1.025 : 1.07 }, 0)
            .to("[data-hero-device-scroll='tablet']", { y: isMobile ? -18 : -46, scale: isMobile ? 1.01 : 1.025 }, 0)
            .to("[data-hero-ring-scroll]", { y: isMobile ? -12 : -28, rotation: (index) => (index === 0 ? 5 : -4) }, 0)
            .to("[data-hero-card-scroll]", {
              x: (index) => [isMobile ? -8 : -24, isMobile ? -5 : -18, isMobile ? 8 : 24][index] ?? 0,
              y: (index) => [isMobile ? -8 : -22, isMobile ? 5 : 14, isMobile ? 7 : 18][index] ?? 0,
              autoAlpha: 0.28,
            }, 0);

          let removePointerDepth: (() => void) | undefined;

          if (context.conditions?.finePointer && !isMobile) {
            const ringLayers = gsap.utils.toArray<HTMLElement>("[data-hero-ring-pointer]");
            const tabletLayer = hero.querySelector<HTMLElement>("[data-hero-device-pointer='tablet']");
            const phoneLayer = hero.querySelector<HTMLElement>("[data-hero-device-pointer='phone']");
            const cardLayers = gsap.utils.toArray<HTMLElement>("[data-hero-card-pointer]");
            const pointerTargets = [...ringLayers, tabletLayer, phoneLayer, ...cardLayers].filter(
              (target): target is HTMLElement => Boolean(target),
            );

            const movers = pointerTargets.map((target, index) => {
              const ring = index < ringLayers.length;
              const tablet = target === tabletLayer;
              const phone = target === phoneLayer;
              const depth = ring ? 4 : tablet ? 10 : phone ? 16 : 18;

              return {
                x: gsap.quickTo(target, "x", { duration: 0.55, ease: "power3.out" }),
                y: gsap.quickTo(target, "y", { duration: 0.55, ease: "power3.out" }),
                rotation: gsap.quickTo(target, "rotation", { duration: 0.65, ease: "power3.out" }),
                depth,
              };
            });

            const handlePointerMove = (event: PointerEvent) => {
              const bounds = hero.getBoundingClientRect();
              const isInsideHero =
                event.clientX >= bounds.left &&
                event.clientX <= bounds.right &&
                event.clientY >= bounds.top &&
                event.clientY <= bounds.bottom;

              if (!isInsideHero) {
                resetPointerDepth();
                return;
              }

              const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
              const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;

              movers.forEach((mover) => {
                mover.x(normalizedX * mover.depth * 2);
                mover.y(normalizedY * mover.depth * 1.35);
                mover.rotation(normalizedX * Math.min(2, mover.depth * 0.12));
              });
            };

            const resetPointerDepth = () => {
              movers.forEach((mover) => {
                mover.x(0);
                mover.y(0);
                mover.rotation(0);
              });
            };

            window.addEventListener("pointermove", handlePointerMove);
            removePointerDepth = () => {
              window.removeEventListener("pointermove", handlePointerMove);
              gsap.killTweensOf(pointerTargets);
            };
          }

          entrance.play(0);
          ScrollTrigger.refresh();

          return () => {
            removePointerDepth?.();
            ambientTweens.forEach((tween) => tween.kill());
          };
        },
      );

      return () => matchMedia.revert();
    },
    { scope },
  );

  return (
    <div className="contents" ref={scope}>
      {children}
    </div>
  );
}
