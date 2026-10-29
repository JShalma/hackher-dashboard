"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Section, Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  eventPhotos2026,
  photosIntro,
  type EventPhoto,
} from "@/content/photos";
import { cn } from "@/lib/utils";

/** Pixels per frame at 60fps ≈ 28px/s - slow enough to read faces. */
const AUTO_SCROLL_SPEED = 0.45;
/** After manual control, wait before auto-scroll resumes. */
const RESUME_MS = 4200;

const tileWidth: Record<EventPhoto["orientation"], string> = {
  landscape: "w-[min(78vw,22rem)] sm:w-[26rem]",
  portrait: "w-[min(58vw,15rem)] sm:w-[17rem]",
};

function PhotoTile({
  photo,
  priority = false,
  inert = false,
}: {
  photo: EventPhoto;
  priority?: boolean;
  /** Duplicate set for seamless loop - hide from AT. */
  inert?: boolean;
}) {
  return (
    <li
      aria-hidden={inert || undefined}
      className={cn(
        "group relative h-52 shrink-0 overflow-hidden border border-border bg-espresso transition-[border-color,box-shadow] duration-300 ease-out hover:border-honey hover:shadow-[4px_4px_0_0_var(--color-honey)] sm:h-60",
        tileWidth[photo.orientation],
      )}
    >
      <Image
        src={photo.src}
        alt={inert ? "" : photo.alt}
        fill
        sizes={
          photo.orientation === "portrait"
            ? "(min-width: 640px) 17rem, 58vw"
            : "(min-width: 640px) 26rem, 78vw"
        }
        priority={priority}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </li>
  );
}

/**
 * Compact horizontal photo strip with gentle auto-scroll.
 * Pauses on hover, focus, reduced motion, and after arrow clicks.
 */
export function PhotoMoments() {
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const setWidthRef = React.useRef(0);
  const pausedRef = React.useRef(false);
  const resumeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [reduceMotion, setReduceMotion] = React.useState(false);

  const measureSet = React.useEffectEvent(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const loopStart = el.children[eventPhotos2026.length] as
      | HTMLElement
      | undefined;
    if (!first || !loopStart) return;
    // Distance from first tile to its duplicate - one full set including gaps.
    setWidthRef.current = loopStart.offsetLeft - first.offsetLeft;
  });

  const pauseAuto = React.useEffectEvent((holdMs?: number) => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    if (holdMs != null) {
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false;
      }, holdMs);
    }
  });

  const resumeAuto = React.useEffectEvent(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
    pausedRef.current = false;
  });

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    measureSet();
    window.addEventListener("resize", measureSet);
    return () => window.removeEventListener("resize", measureSet);
  }, []);

  React.useEffect(() => {
    if (reduceMotion) return;

    let raf = 0;
    const tick = () => {
      const el = scrollerRef.current;
      const loopAt = setWidthRef.current;
      if (el && loopAt > 0 && !pausedRef.current) {
        el.scrollLeft += AUTO_SCROLL_SPEED;
        if (el.scrollLeft >= loopAt) {
          el.scrollLeft -= loopAt;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  React.useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    pauseAuto(RESUME_MS);
    const loopAt = setWidthRef.current;
    const delta = dir * Math.min(el.clientWidth * 0.75, 360);
    let next = el.scrollLeft + delta;
    if (loopAt > 0) {
      if (next < 0) next += loopAt;
      if (next >= loopAt) next -= loopAt;
    }
    el.scrollTo({ left: next, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <Section spacing="md" bleed>
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-foreground/65">
              {photosIntro.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {photosIntro.title}
            </h2>
            <p className="mt-2 text-foreground/70 text-pretty">
              {photosIntro.description}
            </p>
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous photos"
              onClick={() => scrollByDir(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next photos"
              onClick={() => scrollByDir(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Container>

      <div
        className="relative mt-8"
        onPointerEnter={() => pauseAuto()}
        onPointerLeave={() => resumeAuto()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12"
        />

        <ul
          ref={scrollerRef}
          tabIndex={0}
          aria-label="2026 hackathon photos"
          onFocus={() => pauseAuto()}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              resumeAuto();
            }
          }}
          onPointerDown={() => pauseAuto(RESUME_MS)}
          className="flex gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {eventPhotos2026.map((photo, index) => (
            <PhotoTile key={photo.src} photo={photo} priority={index < 3} />
          ))}
          {/* Seamless loop duplicate */}
          {eventPhotos2026.map((photo) => (
            <PhotoTile key={`loop-${photo.src}`} photo={photo} inert />
          ))}
        </ul>
      </div>
    </Section>
  );
}
