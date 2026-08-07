import React, { useEffect, useRef, useState } from 'react';
import { rawProgressFromMapped, TOTAL_ROAD } from '../timeline';

const locatorMarks = [
  { road: 0, label: 'MODEL', row: 0 },
  { road: 1200, label: 'WORK / PAN', row: 1 },
  { road: 1800, label: 'CODA', row: 0 },
  { road: 2100, label: 'PAPER / PLAN', row: 1 },
  { road: 2520, label: 'INK', row: 0 },
  { road: 2775, label: 'TREE', row: 1 },
  { road: 3000, label: 'HANDOFF', row: 0 },
  { road: 3300, label: 'FAQ', row: 1 },
  { road: 3900, label: 'FLY', row: 0 },
  { road: 4400, label: 'APPLICATION', row: 1 },
  { road: 4650, label: 'TRANSITION', row: 0 },
  { road: 5084, label: 'FILM HOLD', row: 1 },
  { road: 5168, label: 'RIPPLE', row: 0 },
  { road: 5294, label: 'FOOTER', row: 1 },
  { road: TOTAL_ROAD, label: 'END', row: 2 }
].map((mark) => ({ ...mark, at: mark.road / TOTAL_ROAD }));

const phaseAt = (road) => {
  for (let index = locatorMarks.length - 1; index >= 0; index -= 1) {
    if (road >= locatorMarks[index].road) return locatorMarks[index].label;
  }
  return locatorMarks[0].label;
};

const rule = 'rgba(255,255,255,.16)';
const muted = 'rgba(255,255,255,.54)';
const cyan = '#55c7f7';

function Grip() {
  return (
    <span aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 2px)', gap: '3px', padding: '4px' }}>
      {Array.from({ length: 6 }, (_, index) => (
        <i key={index} style={{ width: '2px', height: '2px', background: 'rgba(255,255,255,.52)' }} />
      ))}
    </span>
  );
}

function Parameter({ label, value, min, max, step, current, onChange }) {
  const percent = ((current - min) / (max - min)) * 100;
  return (
    <label style={{ display: 'block', padding: '13px 15px 12px', borderBottom: `1px solid ${rule}`, cursor: 'pointer' }}>
      <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '11px' }}>
        <span style={{ color: muted, fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase' }}>{label}</span>
        <output style={{ color: '#fff', fontSize: '11px', letterSpacing: '.06em' }}>{value}</output>
      </span>
      <span style={{ position: 'relative', display: 'block', height: '14px' }}>
        <span style={{ position: 'absolute', top: '6px', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,.25)' }} />
        <span style={{ position: 'absolute', top: '5px', left: 0, width: `${percent}%`, height: '3px', background: cyan }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={onChange}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '14px', margin: 0, opacity: 0, cursor: 'ew-resize' }}
        />
        <span style={{ position: 'absolute', left: `${percent}%`, top: '2px', width: '9px', height: '9px', marginLeft: '-4px', background: cyan, border: '2px solid #090a0b', transform: 'rotate(45deg)' }} />
      </span>
    </label>
  );
}

export default function MaskCalibrator({
  maskPosX = 0.5,
  setMaskPosX,
  zoomScale = 1,
  setZoomScale,
  sensitivity = 30,
  setSensitivity,
  showDebug = false,
  setShowDebug,
  scrollProgress = 0,
  scrollY = 0,
  isVisible: controlledIsVisible,
  onVisibilityChange
}) {
  const [uncontrolledIsVisible, setUncontrolledIsVisible] = useState(false);
  const isControlled = typeof controlledIsVisible === 'boolean';
  const isVisible = isControlled ? controlledIsVisible : uncontrolledIsVisible;
  const updateVisibility = (nextValue) => {
    const next = typeof nextValue === 'function' ? nextValue(isVisible) : nextValue;
    if (!isControlled) setUncontrolledIsVisible(next);
    onVisibilityChange?.(next);
  };
  const [position, setPosition] = useState({ top: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSeeking, setIsSeeking] = useState(false);
  const seekingRef = useRef(false);

  useEffect(() => {
    const handleDblClick = (event) => {
      if (['INPUT', 'BUTTON', 'A'].includes(event.target.tagName)) return;
      updateVisibility((visible) => !visible);
    };
    window.addEventListener('dblclick', handleDblClick);
    return () => window.removeEventListener('dblclick', handleDblClick);
  }, [isVisible]);

  const handleMouseDown = (event) => {
    setIsDragging(true);
    const rect = event.currentTarget.parentElement.getBoundingClientRect();
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!isDragging) return;
      const left = Math.max(10, Math.min(window.innerWidth - 380, event.clientX - dragOffset.x));
      const top = Math.max(10, Math.min(window.innerHeight - 390, event.clientY - dragOffset.y));
      setPosition({ top, left });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const seekToProgress = (mappedProgress) => {
    const progress = Math.min(1, Math.max(0, mappedProgress));
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const rawProgress = rawProgressFromMapped(progress, window.innerWidth <= 720);
    window.scrollTo({ top: maxScroll * rawProgress, behavior: 'auto' });
  };

  const seekFromPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekToProgress((event.clientX - rect.left) / Math.max(1, rect.width));
  };

  const handleSeekPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    seekingRef.current = true;
    setIsSeeking(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  };

  const handleSeekPointerMove = (event) => {
    if (!seekingRef.current) return;
    seekFromPointer(event);
  };

  const handleSeekPointerUp = (event) => {
    seekingRef.current = false;
    setIsSeeking(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleSeekKeyDown = (event) => {
    const step = (event.shiftKey ? 100 : 25) / TOTAL_ROAD;
    const pageStep = 250 / TOTAL_ROAD;
    let next = scrollProgress;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= step;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += step;
    else if (event.key === 'PageDown') next += pageStep;
    else if (event.key === 'PageUp') next -= pageStep;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 1;
    else return;
    event.preventDefault();
    seekToProgress(next);
  };

  if (!isVisible) return null;

  const progressPercent = Math.min(100, Math.max(0, scrollProgress * 100));
  const roadPosition = Math.round(scrollProgress * TOTAL_ROAD);
  const currentPhase = phaseAt(roadPosition);
  const panelStyle = {
    color: '#fff',
    background: 'rgba(9,10,11,.94)',
    border: `1px solid ${rule}`,
    borderRadius: '6px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: '0 14px 36px rgba(0,0,0,.38)',
    fontFamily: 'var(--code, monospace)'
  };

  return (
    <>
      <section
        className="mask-calibrator"
        data-testid="mask-calibrator"
        style={{
          ...panelStyle,
          position: 'fixed',
          top: position.top,
          left: position.left ?? 'auto',
          right: position.left === undefined ? position.right : 'auto',
          zIndex: 9999,
          width: '360px',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        <header
          onMouseDown={handleMouseDown}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', minHeight: '44px', padding: '0 8px 0 15px', borderBottom: `1px solid ${rule}`, cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div>
            <div style={{ color: muted, fontSize: '8px', letterSpacing: '.2em' }}>CAL / 01</div>
            <div style={{ marginTop: '3px', fontSize: '11px', letterSpacing: '.14em' }}>MASK CALIBRATOR</div>
          </div>
          <Grip />
          <button
            type="button"
            onClick={() => updateVisibility(false)}
            title="Close calibration panel"
            aria-label="Close calibration panel"
            style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', marginLeft: '4px', color: muted, background: 'transparent', border: 0, cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >
            x
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', borderBottom: `1px solid ${rule}` }}>
          {[
            ['ROAD', `${roadPosition} / ${TOTAL_ROAD}`],
            ['SCROLL', `${progressPercent.toFixed(2)}%`],
            ['Y', `${Math.round(scrollY).toLocaleString()} PX`]
          ].map(([label, value], index) => (
            <div key={label} style={{ padding: '10px 12px', borderRight: index < 2 ? `1px solid ${rule}` : 0 }}>
              <div style={{ color: muted, fontSize: '8px', letterSpacing: '.16em' }}>{label}</div>
              <div style={{ marginTop: '5px', color: index === 0 ? cyan : '#fff', fontSize: '10px', letterSpacing: '.06em' }}>{value}</div>
            </div>
          ))}
        </div>

        <Parameter label="Zoom / Overscan" value={`${zoomScale.toFixed(2)} X`} min={1} max={1.3} step={0.01} current={zoomScale} onChange={(event) => setZoomScale(parseFloat(event.target.value))} />
        <Parameter label="Object Position X" value={`${(maskPosX * 100).toFixed(1)}%`} min={0.3} max={0.8} step={0.005} current={maskPosX} onChange={(event) => setMaskPosX(parseFloat(event.target.value))} />
        <Parameter label="Sky Sensitivity" value={String(sensitivity).padStart(2, '0')} min={0} max={30} step={1} current={sensitivity} onChange={(event) => setSensitivity(parseInt(event.target.value, 10))} />

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '45px', padding: '0 15px', borderBottom: `1px solid ${rule}`, cursor: 'pointer' }}>
          <span>
            <span style={{ color: muted, fontSize: '9px', letterSpacing: '.18em' }}>MASK FIELD</span>
            <span style={{ marginLeft: '10px', color: showDebug ? '#ff6a68' : 'rgba(255,255,255,.32)', fontSize: '8px', letterSpacing: '.12em' }}>{showDebug ? 'VISIBLE' : 'HIDDEN'}</span>
          </span>
          <span style={{ position: 'relative', width: '34px', height: '16px', border: `1px solid ${showDebug ? '#ff6a68' : 'rgba(255,255,255,.3)'}`, background: showDebug ? 'rgba(255,106,104,.14)' : 'transparent' }}>
            <input type="checkbox" checked={showDebug} onChange={(event) => setShowDebug(event.target.checked)} style={{ position: 'absolute', inset: 0, margin: 0, opacity: 0, cursor: 'pointer' }} />
            <i style={{ position: 'absolute', top: '3px', left: showDebug ? '21px' : '3px', width: '8px', height: '8px', background: showDebug ? '#ff6a68' : 'rgba(255,255,255,.48)', transition: 'left .18s ease' }} />
          </span>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '39px' }}>
          <button
            type="button"
            onClick={() => { setMaskPosX(0.5); setZoomScale(1); setSensitivity(30); setShowDebug(false); }}
            style={{ color: '#fff', background: 'transparent', border: 0, borderRight: `1px solid ${rule}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: '9px', letterSpacing: '.16em' }}
          >
            RESET / 50
          </button>
          <button
            type="button"
            onClick={() => { setMaskPosX(0.68); setSensitivity(30); }}
            style={{ color: cyan, background: 'rgba(85,199,247,.07)', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '9px', letterSpacing: '.16em' }}
          >
            PRESET / 68
          </button>
        </div>
      </section>

      <div
        className="scroll-locator"
        data-testid="scroll-locator"
        style={{
          ...panelStyle,
          position: 'fixed',
          left: '20px',
          right: '20px',
          bottom: '18px',
          zIndex: 9998,
          height: '88px',
          padding: '10px 12px 8px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', fontSize: '10px', letterSpacing: '.08em' }}>
          <strong style={{ color: cyan, fontSize: '12px' }}>{progressPercent.toFixed(2)}%</strong>
          <span>Y {Math.round(scrollY).toLocaleString()} PX</span>
          <span>ROAD {roadPosition} / {TOTAL_ROAD}</span>
          <span style={{ color: cyan }}>PHASE {currentPhase}</span>
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Road position"
          aria-valuemin={0}
          aria-valuemax={TOTAL_ROAD}
          aria-valuenow={roadPosition}
          onPointerDown={handleSeekPointerDown}
          onPointerMove={handleSeekPointerMove}
          onPointerUp={handleSeekPointerUp}
          onPointerCancel={handleSeekPointerUp}
          onKeyDown={handleSeekKeyDown}
          style={{ position: 'relative', height: '48px', marginTop: '7px', pointerEvents: 'auto', touchAction: 'none', cursor: isSeeking ? 'grabbing' : 'grab', outline: 'none' }}
        >
          <div style={{ position: 'absolute', left: 0, right: 0, top: '8px', height: '1px', background: 'rgba(255,255,255,.28)' }} />
          <div style={{ position: 'absolute', left: 0, top: '7px', width: `${progressPercent}%`, height: '3px', background: cyan }} />
          {locatorMarks.map((mark) => (
            <span key={mark.label} style={{ position: 'absolute', left: `${mark.at * 100}%`, top: 0, width: '1px', height: '15px', background: mark.at <= scrollProgress ? cyan : 'rgba(255,255,255,.55)' }}>
              <i style={{ position: 'absolute', top: 17 + mark.row * 10, left: mark.at === 1 ? '-18px' : mark.at === 0 ? 0 : '-8px', color: 'rgba(255,255,255,.72)', fontSize: '8px', fontStyle: 'normal', whiteSpace: 'nowrap' }}>{mark.label}</i>
            </span>
          ))}
          <span aria-hidden="true" style={{ position: 'absolute', left: `${progressPercent}%`, top: '-8px', width: '32px', height: '32px', marginLeft: '-16px', display: 'grid', placeItems: 'center', cursor: isSeeking ? 'grabbing' : 'grab' }}>
            <i style={{ width: '9px', height: '9px', border: '2px solid #090a0b', background: cyan, transform: 'rotate(45deg)' }} />
          </span>
        </div>
      </div>
    </>
  );
}
