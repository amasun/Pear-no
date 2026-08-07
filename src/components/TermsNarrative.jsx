import React from 'react';

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };

export default function TermsNarrative({ scrollProgress = 0 }) {
  const road = scrollProgress * 5350;
  const paper = clamp((road - 2100) / 900);
  const plan = clamp((road - 2100) / 420);
  const planText = clamp((plan - 0.72) / 0.28);
  const tree = clamp((road - 2775) / 525);
  const intro = clamp(tree / 0.45);
  const ink = clamp((paper - 420 / 900) / (1 - 420 / 900));
  const treeCurve = tree < 0.45 ? tree / 0.45 * 0.12 : 0.12 + (tree - 0.45) / 0.55 * 0.88;
  const laterFade = ink > 0.5 ? smooth((treeCurve - 0.26) / 0.24) : 0;
  const firstOpacity = smooth(planText / 0.22);
  const secondOpacity = smooth(intro / 0.02) * (1 - laterFade);
  const visible = Math.max(firstOpacity, secondOpacity) > 0.001;
  const panelScale = typeof window !== 'undefined' && window.innerWidth > 820 ? window.innerWidth / 1516 : 1;
  const panelStyle = { transform: `scale(${panelScale})` };
  const lineStyle = (opacity, lineIndex = 0) => ({
    transform: `translateY(${120 * (1 - smooth((opacity - lineIndex * 0.12) / 0.62))}%)`
  });
  const wipe = (1.52 - 2.04 * ink) * 100;
  const firstMask = ink > 0.001
    ? `linear-gradient(to top, transparent ${(100 - wipe - 1.5).toFixed(1)}%, #000 ${(100 - wipe + 3).toFixed(1)}%)`
    : undefined;
  const secondMask = ink > 0.001 && ink < 0.999
    ? `linear-gradient(to top, #000 ${(100 - wipe - 1.5).toFixed(1)}%, transparent ${(100 - wipe + 3).toFixed(1)}%)`
    : undefined;
  const secondMove = smooth(intro / 0.78);
  const secondSettle = smooth((secondMove - 0.62) / 0.38);
  const secondScale = 1 + (1.62 - 1) * (1 - secondSettle);
  const secondBottom = smooth((secondMove - 0.55) / 0.4);
  const soak = smooth(planText);

  return (
    <>
      <svg className="inkdef" aria-hidden="true">
        <defs><filter id="inkf" x="-18%" y="-30%" width="136%" height="160%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="4" seed="9" result="cl" />
          <feColorMatrix in="cl" type="matrix" result="clA" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" />
          <feComponentTransfer in="clA" result="m"><feFuncA type="linear" slope={9 - 5 * soak} intercept={-7.4 + 8.4 * clamp(planText * 1.12)} /></feComponentTransfer>
          <feDisplacementMap in="SourceGraphic" in2="cl" scale={(1 - soak) * 34} xChannelSelector="R" yChannelSelector="G" result="warp" />
          <feComposite in="warp" in2="m" operator="in" />
        </filter></defs>
      </svg>
      <div className="fin" aria-hidden="true" style={{ opacity: visible ? 1 : 0 }}>
      <div className="fin-g" data-f="0" style={{ opacity: firstOpacity, WebkitMaskImage: firstMask, maskImage: firstMask }}>
        <div className="fin-top" style={panelStyle}><div className="fin-soak" style={{ '--soak': `${(1 - soak) * 3.4}px`, '--bite': 1 + (1 - soak) * 6 }}><h2 className="fin-h" style={{ width: 540 }}>
          <span className="ln"><i style={lineStyle(firstOpacity, 0)}>No fees. A share</i></span>
          <span className="ln"><i style={lineStyle(firstOpacity, 1)}>of the upside.</i></span>
        </h2></div></div>
        <div className="fin-bot" style={panelStyle}><div className="fin-soak" style={{ '--soak': `${(1 - soak) * 3.4}px`, '--bite': 1 + (1 - soak) * 6 }}>
          <p className="fin-l" style={{ width: 545 }}>You pay nothing to start: no retainer, no project fee, no hours on a clock. We carry the cost of strategy, development, content and links.</p>
          <div className="fin-row"><span className="fin-chip"><b>Full disclosure</b></span><p className="fin-s" style={{ width: 315 }}>Our pay is an agreed share of the revenue the work creates, measured against your baseline and visible to both sides. You keep everything we build: the software, the content, the rankings. And we take on a few partners at a time, because when we are paid on the outcome, yes has to be earned.</p></div>
        </div></div>
      </div>
      <div className="fin-g" data-f="1" style={{ opacity: secondOpacity, WebkitMaskImage: secondMask, maskImage: secondMask, filter: laterFade > 0.001 ? `blur(${(laterFade * 13).toFixed(2)}px)` : undefined }}>
        <div className="fin-top" style={{ transform: `scale(${panelScale}) translateY(${((1 - secondMove) * 1190).toFixed(1)}px) scale(${secondScale.toFixed(4)})` }}><div className="fin-soak"><h2 className="fin-h" style={{ width: 614 }}>
          <span className="ln"><i style={lineStyle(secondOpacity, 0)}>We say no more</i></span>
          <span className="ln"><i style={lineStyle(secondOpacity, 1)}>often than yes.</i></span>
        </h2></div></div>
        <div className="fin-bot" style={{ transform: `scale(${panelScale}) translateY(${((1 - secondBottom) * 230).toFixed(1)}px)`, opacity: secondBottom }}><div className="fin-soak">
          <p className="fin-l" style={{ width: 595 }}>Our partners sell real products and services, have revenue to grow, and compete in markets where customers search: e-commerce, Saas, marketplaces, service companies.</p>
          <div className="fin-row"><span className="fin-chip"><b>Full disclosure</b></span><p className="fin-s" style={{ width: 338 }}>If that's you, the terms above are the whole pitch. If you're pre-revenue, want to rent developers by the hour, or need results by Friday, we're the wrong partner, and we'll tell you so in the first call.</p></div>
        </div></div>
      </div>
    </div>
    </>
  );
}
