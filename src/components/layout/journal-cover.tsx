"use client";

import Image from "next/image";
import type { PointerEvent } from "react";

type CoverPage = "login" | "upload" | "progress";

const pages = {
  login: { title: "Your weight", accent: "journal.", artwork: "2", caption: "Log a scale photo and follow your progress over time." },
  upload: { title: "Log your", accent: "weight.", artwork: "camera", caption: "Start with a photo of your scale. Review the reading before you save it." },
  progress: { title: "Your", accent: "progress.", artwork: "chart", caption: "Your weigh-ins, goals and milestones in one place." },
};

export function JournalCover({ page }: { page: CoverPage }) {
  const { title, accent, artwork, caption } = pages[page];

  function moveSky(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cover = event.currentTarget;
    const bounds = cover.getBoundingClientRect();
    cover.style.setProperty("--sky-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 14}px`);
    cover.style.setProperty("--sky-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 10}px`);
  }

  return (
    <section className={`journal-cover journal-cover--${page}`} onPointerMove={moveSky}
      onPointerLeave={({ currentTarget }) => {
        currentTarget.style.removeProperty("--sky-x");
        currentTarget.style.removeProperty("--sky-y");
      }}>
      {page === "login" && (
        <div className="cover-brand"><span aria-hidden="true">✦</span> scale-bae</div>
      )}
      <div className="cover-copy">
        <h1>{title} <em>{accent}</em></h1>
        <p>{caption}</p>
      </div>
      <div className="cover-sky" aria-hidden="true">
        <div className="sky-orbit orbit-far" />
        <div className="sky-orbit orbit-near" />
        <div className="sky-moon" />
        <div className="sky-ridge ridge-back" />
        <div className="sky-ridge ridge-front" />
        <span className="sky-flare flare-one">✦</span>
        <span className="sky-flare flare-two">✦</span>
        <span className="sky-flare flare-three">✧</span>
        <span className="sky-hearts" />
        <Image className="sky-mascot" src={`/unicorns/${artwork}.png`} alt="" width={320} height={320} sizes={page === "login" ? "(max-width: 720px) 170px, 300px" : "175px"} priority />
      </div>
    </section>
  );
}
