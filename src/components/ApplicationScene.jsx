import React, { useState } from 'react';
import './ApplicationScene.css';

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };

const fields = [
  { key: 'name', placeholder: 'Your name', type: 'text', left: 452, top: 148, width: 236, height: 62, path: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0' },
  { key: 'email', placeholder: 'Work email', type: 'email', left: 712, top: 148, width: 236, height: 62, path: 'M2.5 6.5h19v11h-19zM2.5 7l9.5 6.5L21.5 7' },
  { key: 'grow', placeholder: 'What do you want to grow?', type: 'area', left: 452, top: 226, width: 496, height: 226, path: 'M3 5.5h18v11H9l-5 4v-4H3z' }
];

const orbitEllipses = [
  [0.56, 0.36, 0.18, 0.105, -14],
  [0.545, 0.395, 0.245, 0.15, 9],
  [0.59, 0.345, 0.135, 0.195, -32]
];

export default function ApplicationScene({ scrollProgress = 0 }) {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const road = scrollProgress * 5350;
  const fly = clamp((road - 3900) / 500);
  const transition = clamp((road - 4650) / 700);
  const reveal = smooth((fly - 0.69) / 0.3);
  const exit = smooth(transition / 0.34);
  const live = reveal > 0.001 && exit < 0.999;
  const width = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const height = typeof window === 'undefined' ? 900 : window.innerHeight;
  const mobile = width <= 720;
  const baseScale = mobile
    ? Math.min(width * 0.905 / 496, (height - 240) / 378)
    : Math.min(width / 1180, height / 900) * 0.95;
  const sceneX = mobile ? -210 * baseScale : -8;
  const sceneY = mobile ? 60 - height / 2 + 232 * baseScale : -128;
  const sceneTransform = `translate(${sceneX.toFixed(1)}px, ${(sceneY - exit * height * 1.22).toFixed(1)}px) scale(${(baseScale * (1 + exit * 0.1)).toFixed(4)}) rotateX(6deg) rotateY(9deg) rotateZ(1.6deg)`;
  const lead = smooth((reveal - 0.45) / 0.46) * (1 - exit);
  const backgroundScale = Math.max(width / 1280, height / 720);
  const backgroundWidth = 1280 * backgroundScale;
  const backgroundHeight = 720 * backgroundScale;
  const backgroundTop = (height - backgroundHeight) / 2;
  const orbitProgress = smooth((fly - 0.8) / 0.2);

  return (
    <div id="application" className={`cf${live ? ' live' : ''}`} aria-hidden={!live} style={{ opacity: live ? 1 : 0, perspective: '1700px' }}>
      <svg className="cf-orb" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 1 - exit }}>
        {orbitEllipses.map(([x, y, rx, ry, rotation], index) => {
          const cx = x * backgroundWidth;
          const cy = backgroundTop + y * backgroundHeight;
          return (
            <ellipse
              key={`${x}-${y}`}
              cx={cx}
              cy={cy}
              rx={rx * backgroundWidth}
              ry={ry * backgroundHeight}
              style={{
                opacity: smooth((orbitProgress - index * 0.16) / 0.52),
                '--base-rot': `${rotation}deg`,
                '--odur': index % 2 ? '600s' : '400s',
                '--adur': `${8.2 + index * 1.4}s`,
                '--adl': `${-index * 1.7}s`,
                transformOrigin: `${cx}px ${cy}px`
              }}
            />
          );
        })}
      </svg>
      <div className="cf-gl" style={{ opacity: smooth((fly - 0.8) / 0.2) * (1 - exit) }}>
        {Array.from({ length: 17 }, (_, index) => <i key={index} style={{ '--dur': `${1.9 + index % 7 * 0.42}s`, '--dl': `${-(index * 0.53) % 3.1}s` }} />)}
      </div>
      <div className="cf-lead" style={{ opacity: lead, transform: `translateY(${(1 - lead) * 11}px)` }}>
        <b>The application</b>
        <p>Tell us what you sell and where you want to grow. Every application is read, and when the model fits we answer within a week.</p>
      </div>
      <div className="cf-in" style={{ transform: sceneTransform, filter: exit > 0.02 ? `blur(${(exit * 7).toFixed(2)}px)` : undefined }}>
        {fields.map((field, index) => {
          const item = smooth((reveal - index * 0.18) / 0.34) * (1 - exit);
          const isHovered = hoveredIndex === index;
          const hoverDepth = hoveredIndex < 0 ? 0 : isHovered ? 34 : -14;
          const hoverLift = isHovered ? -5 : 0;
          const hoverScale = isHovered ? 1.045 : hoveredIndex >= 0 ? 0.988 : 1;
          const z = (1 - item) * -180 + (fields.length - index) * 7 + hoverDepth;
          return (
            <div
              key={field.key}
              className={`cf-f${field.type === 'area' ? '' : ' pill'}${isHovered ? ' is-hovered' : ''}`}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => setHoveredIndex(-1)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(-1)}
              style={{ left: field.left, top: field.top, width: field.width, height: field.height, opacity: item, filter: hoveredIndex >= 0 && !isHovered ? 'brightness(0.9)' : undefined, transform: `translate3d(${((1 - item) * (index === 1 ? 90 : -55)).toFixed(1)}px, ${((1 - item) * (index === 2 ? 30 : -5) + hoverLift).toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${((1 - item) * (3 - index * 1.7)).toFixed(2)}deg) scale(${hoverScale.toFixed(3)})`, '--blur': '9.5px', '--fill': 0.1, '--rim': 0.41, '--bev': '2.5px', '--bev2': 0.35, '--spec': 0.4, '--sat': 1.1, '--ins': 0.475, '--insB': '6px', '--insY': '1px' }}
            >
              <span className="rim" /><span className="rim2" /><span className="ic"><svg viewBox="0 0 24 24"><path d={field.path} /></svg></span>
              {field.type === 'area' ? <textarea rows="4" placeholder={field.placeholder} /> : <input type={field.type} placeholder={field.placeholder} />}
            </div>
          );
        })}
        <button className="cf-cta" type="button" style={{ left: 452, top: 486, width: 262, height: 40, opacity: smooth((reveal - 0.54) / 0.34) * (1 - exit) }}>Send the application</button>
      </div>
    </div>
  );
}
