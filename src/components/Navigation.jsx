import React from 'react';
import './NavigationControls.css';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const outQuart = (value) => 1 - (1 - clamp01(value)) ** 4;
const symmetricEase = (value, power) => {
  const t = clamp01(value);
  const a = t ** power;
  return a / (a + (1 - t) ** power);
};

const MODEL_END = 1200 / 5350;
const WORK_STORY_START = 1200 / 5350;
const WORK_STORY_END = 1800 / 5350;
const CHAPTER_AT = [0.012, 0.232, 0.4, 0.628];
// Exact windows from pear.no's production runtime, expressed within Ch. 1.
const BEAT_WINDOWS = [[0, 0.045], [0.26, 0.4], [0.44, 0.55], [0.56, 0.65]];

const SPARK_PATH = 'M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z';

function RuleLine({ vertical = false, right = false, out, style, delay }) {
  return (
    <span
      className={vertical ? (right ? 'gv gv--r' : 'gv') : 'gh'}
      data-out={out}
      aria-hidden="true"
      style={style}
    >
      <i style={{ animationDelay: delay }} />
    </span>
  );
}

function RuleCross({ lock = false, out, style, delay }) {
  return (
    <i className={lock ? 'gx gx--lock' : 'gx'} data-out={out} aria-hidden="true" style={style}>
      <span style={delay ? { animationDelay: delay } : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={SPARK_PATH} /></svg>
      </span>
    </i>
  );
}

function getRuleState(modelProgress, road) {
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const height = typeof window === 'undefined' ? 900 : window.innerHeight;
  const mobile = width <= 720;
  const lock = smoothstep((modelProgress - 0.684) / 0.105);
  const burn = clamp01((modelProgress - 0.775) / 0.14);
  const release = symmetricEase((burn - 0.26) / 0.82, 2.25);
  const focus = lock * (1 - release);
  const crossExit = smoothstep((burn - 0.08) / 0.18);
  const coda = clamp01((road - 1800) / 300);
  const rightExit = mobile ? 0 : smoothstep((coda - 0.42) / 0.3);
  const maskOpacity = 1 - clamp01(modelProgress / 0.0032);
  const domOpacity = 1 - maskOpacity;

  const v1 = width * (mobile ? 0.0475 : 0.053);
  const v2 = width * (mobile ? 0.9525 : 0.856);
  const h1 = mobile ? 60 : width * 0.053;
  const h2 = height * 0.653 + 50;
  const mobileRightReturn = mobile ? 1 - smoothstep((burn - 0.1) / 0.25) : 1;
  const leftX = (width * 0.4155 + 20 - v1) * focus;
  const rightX = (width * 0.5445 + 20 - v2) * focus + (width * 0.61596 - v2) * release * mobileRightReturn;
  const topY = (height * 0.273 - 75 - h1) * focus;
  const bottomY = (height * 0.587 - 75 - h2) * focus + (height + 24 - h2) * release;
  const rightTop = h1 * (1 - Math.max(focus, release)) + rightExit * height;

  const lightScene = (road >= 1900 && road < 2890);
  const ruleStyle = lock > 0.001 && (road < 1200 || !lightScene)
    ? (() => {
        const mix = (from, to) => Math.round(from + (to - from) * release);
        const alpha = (0.165 + 0.5 * lock) + (0.225 - (0.165 + 0.5 * lock)) * release;
        return {
          '--rule': `rgb(${mix(29, 255)} ${mix(28, 255)} ${mix(25, 255)} / ${alpha.toFixed(3)})`,
          '--cross': `rgb(${mix(29, 255)} ${mix(28, 255)} ${mix(25, 255)} / ${(0.34 + 0.6 * lock + (0.525 - (0.34 + 0.6 * lock)) * release).toFixed(3)})`,
          '--mark': release > 0.5 ? '#fff' : 'var(--ink)'
        };
      })()
    : {};

  return {
    domOpacity,
    ruleStyle,
    line: {
      l: { left: 'var(--v1)', opacity: domOpacity, transform: `translate(${leftX.toFixed(1)}px, 0)` },
      r: { left: 'var(--v2)', top: `${rightTop.toFixed(1)}px`, opacity: domOpacity, transform: `translate(${rightX.toFixed(1)}px, 0)` },
      u: { top: 'var(--h1)', opacity: domOpacity, transform: `translate(0, ${topY.toFixed(1)}px)` },
      d: { top: 'var(--h2)', opacity: domOpacity * (1 - release), transform: `translate(0, ${bottomY.toFixed(1)}px)` }
    },
    cross: {
      lu: { left: 'var(--v1)', top: 'var(--h1)', opacity: domOpacity * lock * (1 - crossExit), transform: `translate(${leftX.toFixed(1)}px, ${topY.toFixed(1)}px)` },
      ru: { left: 'var(--v2)', top: 'var(--h1)', opacity: domOpacity * lock * (1 - crossExit), transform: `translate(${rightX.toFixed(1)}px, ${topY.toFixed(1)}px)` },
      ld: { left: 'var(--v1)', top: 'var(--h2)', opacity: domOpacity * (1 - crossExit), transform: `translate(${leftX.toFixed(1)}px, ${bottomY.toFixed(1)}px)` },
      rd: { left: 'var(--v2)', top: 'var(--h2)', opacity: domOpacity * (1 - crossExit), transform: `translate(${rightX.toFixed(1)}px, ${bottomY.toFixed(1)}px)` }
    }
  };
}

const workPanels = [
  {
    chip: 'Search engine optimization',
    title: ['Everything it takes to be', 'found, under one roof.'],
    body: 'Search and software are one discipline at Pear. The product is built to rank from its first commit, and the SEO is done by the people who wrote the code.'
  },
  {
    chip: 'Search engine optimization',
    title: ['Search and software are one', 'discipline at Pear.'],
    body: 'The product is built to rank from its first commit, and the SEO is done by the people who wrote the code.'
  },
  {
    chip: 'Custom software',
    title: ['We design and build the thing being', 'ranked: storefronts, marketplaces,', 'booking systems, the machinery a', 'modern company sells through.'],
    body: 'Most software is built first and optimized later, which is backwards. Architecture, speed and structure decide rankings before the first word of copy is written, so ours ships fast, renders clean, and gives search engines a site they can read without excuses.'
  }
];

function getBeatState(modelProgress, index) {
  const [start, end] = BEAT_WINDOWS[index];
  const phase = clamp01((modelProgress - start) / (end - start));
  const nearby = modelProgress > start - 0.02 && modelProgress < end + 0.02;

  if (index === 0) {
    const opacity = smoothstep((1 - phase) / 0.28);
    const exit = (1 - opacity) ** 2;
    return {
      nearby,
      opacity,
      transform: `translate3d(${(-exit * 86).toFixed(1)}px, ${(-exit * 14).toFixed(1)}px, 0) scale(${(1 - exit * 0.04).toFixed(4)})`,
      filter: exit > 0.0004 ? `blur(${(exit * 5).toFixed(2)}px)` : 'none',
      lineProgress: 1,
      copyProgress: 1,
      tagProgress: opacity
    };
  }

  const opacity = Math.min(
    smoothstep(phase / 0.16),
    smoothstep((1 - phase) / 0.2)
  );
  const lineProgress = clamp01((phase - 0.03) / 0.3);
  const copyProgress = clamp01((phase - 0.14) / 0.26);
  const tagProgress = outQuart((lineProgress - 0.35) / 0.2) * opacity;
  return { nearby, opacity, transform: 'none', filter: 'none', lineProgress, copyProgress, tagProgress };
}

function lineRevealTransform(progress, lineIndex = 0) {
  const reveal = outQuart((progress - lineIndex * 0.115) / 0.6);
  return `translateY(${((1 - reveal) * 175).toFixed(2)}%)`;
}

function AnimatedCopy({ text, progress }) {
  const charCount = text.replace(/\s/g, '').length;
  let charIndex = 0;
  return text.split(/(\s+)/).map((part, wordIndex) => {
    if (/^\s+$/.test(part)) return part;
    return (
      <span className="wd" key={`${part}-${wordIndex}`}>
        {[...part].map((char) => {
          const index = charIndex++;
          const opacity = clamp01((progress * (charCount + 4) - index) * 2.4);
          return <span className="ch" key={`${char}-${index}`} style={{ opacity }}>{char}</span>;
        })}
      </span>
    );
  });
}

function WorkStory({ progress }) {
  const phase = clamp01((progress - WORK_STORY_START) / (WORK_STORY_END - WORK_STORY_START));
  const visible = progress >= WORK_STORY_START && progress <= WORK_STORY_END;
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const height = typeof window === 'undefined' ? 900 : window.innerHeight;
  const scale = width / 1328;
  const plateViewportHeights = 2.65 * width / height;
  const pan = plateViewportHeights > 0 ? (1 - 1 / plateViewportHeights) * (1 - phase) : 0;
  const trackY = height - height * plateViewportHeights * (1 - pan);
  const headY = clamp01((height * 0.92 - trackY) / scale / 3515) * 3515;
  const panelStops = [0, 1180, 2050];

  return (
    <div className="pf" aria-hidden={!visible} style={{ opacity: visible ? 1 : 0 }}>
      <div
        className="pf-in"
        style={{
          transform: `translateY(${trackY.toFixed(2)}px) scale(${scale.toFixed(5)})`
        }}
      >
        <svg className="pf-lines" viewBox="0 0 1328 3515" fill="none">
          <g className="pf-ticks">
            {Array.from({ length: 33 }, (_, index) => {
              const y = ((index + 1) * 3515) / 34;
              const long = (index + 1) % 5 === 0;
              const distance = Math.abs(y - headY);
              const opacity = clamp01(0.25 + (1 - distance / 520) * 0.7);
              return <line key={y} x1="818" x2={818 + (long ? 28 : 12)} y1={y} y2={y} style={{ opacity }} />;
            })}
          </g>
          <line x1="818" x2="818" y1="0" y2="3515" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
        </svg>
        <i className="pf-head" style={{ opacity: 1, transform: `translateY(${headY.toFixed(1)}px)` }}>
          <b>{Math.round(phase * 100)}%</b>
        </i>
      </div>

      <div className="pf-fix">
        {workPanels.map((panel, index) => {
          const reached = headY >= panelStops[index];
          const reveal = smoothstep((headY - panelStops[index] + (index === 0 ? 340 : 0)) / 420);
          const panelY = (panelStops[index] - headY) * 0.375 + (1 - reveal) * 10;
          return (
            <div
              className="pf-g pf-g--fix"
              data-g={index}
              key={panel.title.join(' ')}
              style={{
                width: index === 2 ? 384 : 360,
                '--gap': index === 2 ? '17px' : '14px',
                opacity: reached || index === 0 ? reveal : 0,
                transform: `translateY(${panelY.toFixed(1)}px)`
              }}
            >
              <span className="pf-chip" style={{ width: index === 2 ? 104 : 168, opacity: reveal }}>
                <b>{panel.chip}</b>
              </span>
              <h2 className="pf-h" style={{ width: index === 2 ? 384 : 280 }}>
                {panel.title.map((line) => (
                  <span className="ln" key={line}>
                    <i style={{ transform: `translateX(${((1 - reveal) * 115).toFixed(2)}%)` }}>{line}</i>
                  </span>
                ))}
              </h2>
              <p className="pf-b" style={{ width: index === 2 ? 360 : undefined, marginTop: index === 2 ? 27 : 25, opacity: smoothstep((reveal - 0.3) / 0.7) }}>
                {panel.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Navigation({
  activeChapter = 0,
  scrollProgress = 0,
  onOpenApply,
  calibratorOpen = false,
  onToggleCalibrator
}) {
  const inWorkStory = scrollProgress >= WORK_STORY_START && scrollProgress <= WORK_STORY_END;
  const modelProgress = clamp01(scrollProgress / MODEL_END);
  const road = scrollProgress * 5350;
  const rules = getRuleState(modelProgress, road);
  const beatStates = BEAT_WINDOWS.map((_, index) => getBeatState(modelProgress, index));
  const activeNarrativeBeat = beatStates.reduce(
    (best, state, index) => state.opacity > beatStates[best].opacity ? index : best,
    0
  );
  const onLight = (road >= 672 && road < 930) || (road >= 1900 && road < 2890);

  const chapters = [
    { id: 'model', label: 'Ch. 1', name: 'The Model' },
    { id: 'work', label: 'Ch. 2', name: 'The Work' },
    { id: 'terms', label: 'Ch. 3', name: 'The Terms' },
    { id: 'questions', label: 'Ch. 4', name: 'Questions' },
  ];

  const tags = [
    'AT YOUR SERVICE',
    'CUSTOM SOFTWARE',
    'SEARCH AND LINKS',
    'REVENUE SHARE'
  ];

  return (
    <div className={`ov go${onLight ? ' on-light' : ''}`} style={{ pointerEvents: 'none', opacity: 1, ...rules.ruleStyle }}>
      <RuleLine vertical out="l" style={rules.line.l} delay=".20s" />
      <RuleLine vertical right out="r" style={rules.line.r} delay=".30s" />
      <RuleLine out="u" style={rules.line.u} delay=".25s" />
      <RuleLine out="d" style={rules.line.d} delay=".40s" />
      <span className="fill" data-out="d" aria-hidden="true" />

      <RuleCross out="ld" style={rules.cross.ld} delay="1.05s" />
      <RuleCross out="rd" style={rules.cross.rd} delay="1.18s" />
      <RuleCross lock out="lu" style={rules.cross.lu} />
      <RuleCross lock out="ru" style={rules.cross.ru} />

      {/* Pear Logo Mark (Top Left) */}
      <a className="mark" href="#top" aria-label="Pear" style={{ opacity: 1, pointerEvents: 'auto' }}>
        <svg viewBox="0 0 305 415" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            pathLength="1"
            d="M153.19 22.53C168.21 23.03 182.32 28.8 193.13 38.92C202.3 47.51 208.57 58.46 211.23 70.6C220.52 112.92 237.69 155.75 262.27 197.92C273.65 217.44 279.66 239.79 279.66 262.54C279.66 296.89 266.29 329.18 242.01 353.46C217.73 377.74 185.45 391.11 151.13 391.12L149.08 391.11C80.4 390.15 23.57 333.39 22.51 264.58C22.14 240.37 28.5 216.71 40.91 196.17C63.74 158.4 80.6 116 91.02 70.15C93.73 58.21 99.95 47.41 109.01 38.92C120.33 28.33 135.27 22.5 151.08 22.5C151.79 22.5 152.49 22.51 153.19 22.53Z"
            stroke="currentColor"
            strokeWidth="30"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
        </svg>
      </a>

      {/* Menu Button with 4 dots */}
      <button
        className={`menu ${calibratorOpen ? 'on' : ''}`}
        type="button"
        aria-label={calibratorOpen ? 'Close mask calibration panel' : 'Open mask calibration panel'}
        title={calibratorOpen ? 'Close mask calibration panel' : 'Open mask calibration panel'}
        aria-expanded={calibratorOpen}
        onClick={onToggleCalibrator}
        style={{ opacity: 1, pointerEvents: 'auto' }}
      >
        <span />
        <span />
        <span />
        <span />
      </button>
      <output className="scroll-percent" aria-label="Page scroll progress">
        {(Math.min(1, Math.max(0, scrollProgress)) * 100).toFixed(0)}%
      </output>

      {/* Header Apply Trigger */}
      <nav className="hdr label" style={{ opacity: 1, pointerEvents: 'auto' }}>
        <a
          className="apply"
          href="#application"
          onClick={(e) => { e.preventDefault(); onOpenApply(); }}
          style={{ opacity: 1, pointerEvents: 'auto' }}
        >
          Apply <span className="arw">→</span>
        </a>
      </nav>

      {/* Chapter Navigation Rail */}
      <nav className="rail" aria-label="Chapters" style={{ opacity: 1, pointerEvents: 'auto' }}>
        {chapters.map((ch, idx) => (
          <a
            key={ch.id}
            href={`#${ch.id}`}
            className={activeChapter === idx ? 'on' : ''}
            data-at={CHAPTER_AT[idx]}
          >
            <i />
            <em>{ch.name}</em>
          </a>
        ))}
      </nav>

      {/* Column Headline Beats */}
      <div className="col-head" style={{ pointerEvents: inWorkStory ? 'none' : 'auto', opacity: inWorkStory ? 0 : 1 }}>
        <div className="bk" data-beat="0" style={{ visibility: beatStates[0].nearby ? 'visible' : 'hidden', opacity: beatStates[0].opacity, transform: beatStates[0].transform, filter: beatStates[0].filter }}>
          <h1>
            <span className="ln">
              <i style={{ transform: 'translate(0px, 0%)', opacity: 1 }}>
                <span className="wd"><span className="ch" data-c="P">P</span><span className="ch" data-c="e">e</span><span className="ch" data-c="a">a</span><span className="ch" data-c="r">r</span></span>{' '}
                <span className="wd"><span className="ch" data-c="m">m</span><span className="ch" data-c="a">a</span><span className="ch" data-c="k">k</span><span className="ch" data-c="e">e</span><span className="ch" data-c="s">s</span></span>{' '}
                <span className="wd"><span className="ch" data-c="y">y</span><span className="ch" data-c="o">o</span><span className="ch" data-c="u">u</span></span>{' '}
                <span className="wd"><span className="ch" data-c="a">a</span><span className="ch" data-c="p">p</span><span className="ch" data-c="p">p</span><span className="ch" data-c="e">e</span><span className="ch" data-c="a">a</span><span className="ch" data-c="r">r</span><span className="ch" data-c=".">.</span></span>
              </i>
            </span>
          </h1>
          <p className="subhead" style={{ lineHeight: 1.05, marginTop: '16px' }}>
            <span className="ln" style={{ display: 'block', overflow: 'hidden', margin: '-0.14em 0 -0.20em', padding: '0.14em 0 0.20em' }}>
              <i style={{ transform: 'translate(0px, 0%)', opacity: 1, display: 'block' }}>
                <span className="wd"><span className="ch" data-c="N">N</span><span className="ch" data-c="o">o</span><span className="ch" data-c="t">t</span></span>{' '}
                <span className="wd"><span className="ch" data-c="a">a</span><span className="ch" data-c="n">n</span></span>{' '}
                <span className="wd"><span className="ch" data-c="a">a</span><span className="ch" data-c="g">g</span><span className="ch" data-c="e">e</span><span className="ch" data-c="n">n</span><span className="ch" data-c="c">c</span><span className="ch" data-c="y">y</span></span>{' '}
                <span className="wd"><span className="ch" data-c="o">o</span><span className="ch" data-c="n">n</span></span>{' '}
                <span className="wd"><span className="ch" data-c="t">t</span><span className="ch" data-c="h">h</span><span className="ch" data-c="e">e</span></span>{' '}
                <span className="wd"><span className="ch" data-c="c">c</span><span className="ch" data-c="l">l</span><span className="ch" data-c="o">o</span><span className="ch" data-c="c">c</span><span className="ch" data-c="k">k</span><span className="ch" data-c=",">,</span></span>
              </i>
            </span>
            <span className="ln" style={{ display: 'block', overflow: 'hidden', margin: '-0.14em 0 -0.20em', padding: '0.14em 0 0.20em' }}>
              <i style={{ transform: 'translate(0px, 0%)', opacity: 1, display: 'block' }}>
                <span className="wd"><span className="ch" data-c="a">a</span></span>{' '}
                <span className="wd"><span className="ch" data-c="p">p</span><span className="ch" data-c="a">a</span><span className="ch" data-c="r">r</span><span className="ch" data-c="t">t</span><span className="ch" data-c="n">n</span><span className="ch" data-c="e">e</span><span className="ch" data-c="r">r</span></span>{' '}
                <span className="wd"><span className="ch" data-c="i">i</span><span className="ch" data-c="n">n</span></span>{' '}
                <span className="wd"><span className="ch" data-c="t">t</span><span className="ch" data-c="h">h</span><span className="ch" data-c="e">e</span></span>{' '}
                <span className="wd"><span className="ch" data-c="u">u</span><span className="ch" data-c="p">p</span><span className="ch" data-c="s">s</span><span className="ch" data-c="i">i</span><span className="ch" data-c="d">d</span><span className="ch" data-c="e">e</span><span className="ch" data-c=".">.</span></span>
              </i>
            </span>
          </p>
          <a
            className="cta"
            href="#application"
            onClick={(e) => { e.preventDefault(); onOpenApply(); }}
            style={{
              opacity: 1,
              pointerEvents: 'auto',
              background: '#0b0a09',
              color: '#f2f1ed'
            }}
          >
            <span className="face">
              Request Partnership
              <span className="arw">→</span>
            </span>
          </a>
        </div>

        <div className="bk" data-beat="1" style={{ visibility: beatStates[1].nearby ? 'visible' : 'hidden', opacity: beatStates[1].opacity, transform: beatStates[1].transform, filter: beatStates[1].filter }}>
          <div className="beat">
            <span className="ln"><i style={{ transform: lineRevealTransform(beatStates[1].lineProgress), opacity: 1 }}>We build it.</i></span>
          </div>
        </div>
        <div className="bk" data-beat="2" style={{ visibility: beatStates[2].nearby ? 'visible' : 'hidden', opacity: beatStates[2].opacity, transform: beatStates[2].transform, filter: beatStates[2].filter }}>
          <div className="beat">
            <span className="ln"><i style={{ transform: lineRevealTransform(beatStates[2].lineProgress), opacity: 1 }}>We rank it.</i></span>
          </div>
        </div>
        <div className="bk" data-beat="3" style={{ visibility: beatStates[3].nearby ? 'visible' : 'hidden', opacity: beatStates[3].opacity, transform: beatStates[3].transform, filter: beatStates[3].filter }}>
          <div className="beat">
            <span className="ln"><i style={{ transform: lineRevealTransform(beatStates[3].lineProgress, 0), opacity: 1 }}>We share in</i></span>
            <span className="ln"><i style={{ transform: lineRevealTransform(beatStates[3].lineProgress, 1), opacity: 1 }}>what it earns.</i></span>
          </div>
        </div>
      </div>

      {/* Tag Chip (AT YOUR SERVICE) */}
      <span
        className="tag"
        style={{
          opacity: inWorkStory ? 0 : beatStates[activeNarrativeBeat].tagProgress,
          transform: `translateY(${((1 - beatStates[activeNarrativeBeat].tagProgress) * 10).toFixed(1)}px)`,
          pointerEvents: 'auto'
        }}
      >
        {tags[activeNarrativeBeat] || 'AT YOUR SERVICE'}
      </span>

      {/* Column Subhead Beats - Top-Aligned with Tag Chip */}
      <div className="col-stand" style={{ pointerEvents: inWorkStory ? 'none' : 'auto', opacity: inWorkStory ? 0 : 1 }}>
        <div
          className="bk"
          data-beat="0"
          style={{
            visibility: beatStates[0].nearby ? 'visible' : 'hidden',
            opacity: beatStates[0].opacity,
            transform: beatStates[0].transform,
            filter: beatStates[0].filter
          }}
        >
          <p className="stand">
            We build custom software, rank it where customers search, and take our pay as a share of the revenue it earns. No retainers, no hours: if you don’t grow, we don’t get paid.
          </p>
        </div>
        <div
          className="bk"
          data-beat="1"
          style={{
            visibility: beatStates[1].nearby ? 'visible' : 'hidden',
            opacity: beatStates[1].opacity,
            transform: beatStates[1].transform,
            filter: beatStates[1].filter
          }}
        >
          <p className="stand"><AnimatedCopy text="Tailored software, built to be found." progress={beatStates[1].copyProgress} /></p>
        </div>
        <div
          className="bk"
          data-beat="2"
          style={{
            visibility: beatStates[2].nearby ? 'visible' : 'hidden',
            opacity: beatStates[2].opacity,
            transform: beatStates[2].transform,
            filter: beatStates[2].filter
          }}
        >
          <p className="stand"><AnimatedCopy text="Search and links that put you in front of the crowd." progress={beatStates[2].copyProgress} /></p>
        </div>
        <div
          className="bk"
          data-beat="3"
          style={{
            visibility: beatStates[3].nearby ? 'visible' : 'hidden',
            opacity: beatStates[3].opacity,
            transform: beatStates[3].transform,
            filter: beatStates[3].filter
          }}
        >
          <p className="stand"><AnimatedCopy text="No hours billed — we co-own the outcome." progress={beatStates[3].copyProgress} /></p>
        </div>
      </div>

      <WorkStory progress={scrollProgress} />
    </div>
  );
}
