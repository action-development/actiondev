import { Hero } from "@/components/hero/Hero";
import { Capabilities } from "@/components/sections/Capabilities";
import { Tools } from "@/components/sections/Tools";
import { Work } from "@/components/sections/Work";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Capabilities />
        <Tools />
        <Work />
      </main>
      <SiteFooter />
    </>
  );
}
