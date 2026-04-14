"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/animations/SmoothScroll";

export function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <div className="relative min-h-screen bg-background">
        <Header />
        <main id="main" className="pt-20">{children}</main>
        <Footer />
        {/* Film grain overlay — lightweight static noise */}
        <div
          className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMFBQUFBQWoaCLuAAAASUlEQVQ4y2NggANGJQYoYHZiBANmBxCLwQnCYnYCsRicICxGJwgLBBidICwQgKpidAaxkACDk5OTE4QFVcvgBGIxO4O1MQAA7p8HJBI/vZAAAAAASUVORK5CYII=")`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>
    </SmoothScroll>
  );
}
