"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Slide = { src: string; title: string; alt: string };

export function HeroSlider({ slides, children }: { slides: Slide[]; children: ReactNode }) {
  const trackId = useId();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    const next = (index + slides.length) % slides.length;
    element.scrollTo({ left: element.clientWidth * next });
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + (event.key === "ArrowRight" ? 1 : -1));
    }
  }

  return <section className="home-hero" aria-label="Motosiklet servisimiz" aria-roledescription="görsel sunumu" onKeyDown={onKeyDown}>
    <div className="home-hero__content">{children}</div>
    <div id={trackId} ref={track} tabIndex={0} role="group" aria-label="Servis görselleri"
      className="home-hero__track motion-safe:scroll-smooth" onScroll={(event) => {
        const element = event.currentTarget;
        const index = Math.round(element.scrollLeft / element.clientWidth);
        setActive(Math.max(0, Math.min(slides.length - 1, index)));
      }}>
      {slides.map((slide, index) => <div key={slide.title} role="group" aria-roledescription="slayt"
        aria-label={`${index + 1} / ${slides.length}`} aria-hidden={index !== active} className="home-hero__slide">
        <Image src={slide.src} alt={slide.alt} fill sizes="(min-width: 1344px) 1024px, (min-width: 1024px) calc(80vw - 3.2rem), (min-width: 640px) calc(100vw - 4rem), calc(100vw - 2.5rem)"
          preload={index === 0} unoptimized={!slide.src.startsWith("/images/")} className="object-cover object-[62%_center]" />
      </div>)}
    </div>
    <div className="home-hero__controls">
      <span className="min-w-0 flex-1 text-xs font-semibold text-paper sm:text-sm" aria-live="polite">{slides[active].title}</span>
      <div className="flex items-center" aria-label="Görsel seçimi">
        {slides.map(({ title }, index) => <button key={title} type="button" className="hero-indicator" aria-label={`${title} görseline git`}
          aria-controls={trackId} aria-current={index === active ? "true" : undefined} onClick={() => goTo(index)}>
          <span aria-hidden="true" />
        </button>)}
      </div>
      <div className="hidden items-center gap-1.5 sm:flex">
        <button className="hero-arrow" type="button" aria-label="Önceki görsel" aria-controls={trackId} onClick={() => goTo(active - 1)}>
          <span className="h-2.5 w-2.5 translate-x-0.5 rotate-45 border-b-2 border-l-2" aria-hidden="true" />
        </button>
        <button className="hero-arrow" type="button" aria-label="Sonraki görsel" aria-controls={trackId} onClick={() => goTo(active + 1)}>
          <span className="h-2.5 w-2.5 -translate-x-0.5 rotate-45 border-r-2 border-t-2" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>;
}
