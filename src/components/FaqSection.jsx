import React, { useLayoutEffect, useRef, useState } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const STAR = 'M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z';

const faqs = [
  { question: 'What does it cost to work with Pear?', answer: 'Nothing upfront and nothing hourly. We fund the strategy, the software, the content and the link building ourselves. Our payment is an agreed percentage of the new revenue that work generates. If your revenue doesn’t grow, you owe us nothing.' },
  { question: 'What share of the revenue do you take?', answer: 'It’s agreed per partnership before we start, and depends on how much building the opportunity needs. It applies only to growth above your existing baseline, never to the revenue you already had.' },
  { question: 'Why revenue share instead of fees?', answer: 'Because hourly billing pays agencies for effort, not results. An agency on a retainer earns the same whether you grow or not. We removed the retainer, so the only way for us to get paid is to grow your revenue.' },
  { question: 'How do you measure the revenue you create?', answer: 'Before we begin, we agree on a baseline from your existing numbers and on how new organic revenue is attributed: analytics, order data or bookings, depending on your business. Both sides see the same dashboard.' },
  { question: 'How long before it pays off?', answer: 'Search compounds slowly, then quickly. Software and technical fixes land in weeks; rankings and revenue typically move within months. The model means the waiting costs you nothing: we’re the ones financing the ramp.' }
];

const anchors = [[0.26, 0.534], [0.709, 0.354], [0.259, 0.907], [0.718, 0.815], [0.27, 0.236]];

export default function FaqSection({ scrollProgress = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const lineRef = useRef(null);
  const endRef = useRef(null);
  const leadRef = useRef(null);
  const cardRefs = useRef([]);
  const road = scrollProgress * 5350;
  const progress = clamp((road - 3300) / 600);
  const visible = progress > 0 && road < 3900;
  const intro = clamp(progress / 0.85);
  const turn = clamp((intro - 0.22) / 0.78);
  const rotation = -turn * 288;
  const step = 72;
  const width = typeof window === 'undefined' ? 1920 : window.innerWidth;
  const height = typeof window === 'undefined' ? 1080 : window.innerHeight;
  const radius = width <= 720 ? width * 0.36 : Math.min(360, width * 0.26);
  const mobileScale = width <= 720 ? Math.min(1, width / 560) : 1;
  const cardStates = faqs.map((_, index) => {
    const reveal = smooth((intro - 0.04 - index * 0.05) / 0.22);
    const angle = ((index * step + rotation) % 360 + 360) % 360;
    const rad = angle * Math.PI / 180;
    const facing = (Math.cos(rad) + 1) / 2;
    return { reveal, angle, rad, facing };
  });
  const activeIndex = cardStates.reduce((best, state, index) => state.facing > cardStates[best].facing ? index : best, 0);

  useLayoutEffect(() => {
    const card = cardRefs.current[activeIndex];
    if (!card || !lineRef.current || !endRef.current || !leadRef.current) return;
    const coverScale = Math.max(width / 1920, height / 1080);
    const imageWidth = 1920 * coverScale;
    const imageHeight = 1080 * coverScale;
    const imageLeft = (width - imageWidth) / 2;
    const imageTop = (height - imageHeight) / 2;
    const [anchorX, anchorY] = anchors[activeIndex];
    const startX = imageLeft + anchorX * imageWidth;
    const startY = imageTop + anchorY * imageHeight;
    const rect = card.getBoundingClientRect();
    const endX = startX < width / 2 ? rect.left - 34 : rect.right + 34;
    const endY = rect.top + 26;
    lineRef.current.setAttribute('x1', startX.toFixed(1));
    lineRef.current.setAttribute('y1', startY.toFixed(1));
    lineRef.current.setAttribute('x2', endX.toFixed(1));
    lineRef.current.setAttribute('y2', endY.toFixed(1));
    endRef.current.setAttribute('x', (endX - 4).toFixed(1));
    endRef.current.setAttribute('y', (endY - 4).toFixed(1));
    leadRef.current.style.opacity = smooth((cardStates[activeIndex].facing - 0.9) / 0.055).toFixed(3);
  }, [activeIndex, height, width, scrollProgress]);

  return (
    <div className="faq" style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}>
      <svg ref={leadRef} className="faq-lead" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line ref={lineRef} x1="0" y1="0" x2="0" y2="0" />
        <rect ref={endRef} width="8" height="8" x="-99" y="-99" />
      </svg>
      {faqs.map((item, index) => {
        const state = cardStates[index];
        const isFront = index === activeIndex && state.facing > 0.9 && state.reveal > 0.92;
        const scale = Math.round(state.reveal * mobileScale * (0.58 + 0.42 * state.facing ** 1.4) * 100) / 100;
        const blur = Math.round((1 - state.facing) * 8.4) / 2;
        return (
          <div
            ref={(node) => { cardRefs.current[index] = node; }}
            key={item.question}
            className={`fq ${hoveredIdx === index || isFront ? 'on' : ''}`}
            onMouseEnter={() => setHoveredIdx(index)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              left: '50%',
              top: `${Math.round(height * 0.602)}px`,
              transform: `translate(-50%, -50%) rotateY(${state.angle.toFixed(2)}deg) translateZ(${radius}px) rotateY(${(-state.angle).toFixed(2)}deg) translateY(${(Math.sin(state.rad) * 26 - (1 - state.reveal) * 34).toFixed(1)}px) scale(${scale.toFixed(2)})`,
              filter: blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : 'none',
              zIndex: Math.round(state.facing * 100),
              cursor: 'pointer'
            }}
          >
            <span className="fr" />
            <span className="st a"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg></span>
            <span className="st b"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg></span>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        );
      })}
    </div>
  );
}
