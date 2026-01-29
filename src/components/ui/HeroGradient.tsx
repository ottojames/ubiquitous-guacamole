import React from "react";
import * as UI from "@/styles/ui";

type HeroGradientProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function HeroGradient({ title, subtitle, children }: HeroGradientProps) {
  return (
    <div className={`hero-band-lg`}>
      <div className={`${UI.container} pt-16 md:pt-20 pb-6`}>
        <h1 className={`${UI.heroH1} mb-2`}>{title}</h1>
        {subtitle && <p className={`${UI.heroSub} mt-1`}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}


