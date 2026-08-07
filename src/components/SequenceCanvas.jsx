import React, { useEffect, useRef } from 'react';
import { FILMS } from '../films';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const FLY_START = 3900;
const FLY_SEQUENCE_END = 4400;
const TRANSITION_START = 4650;
const FLY_CROSSFADE_END = 4760;
const TRANSITION_END = 5290;

const drawCoverFrame = (ctx, image, width, height, positionX = 50, scale = 1) => {
  const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * coverScale;
  const drawHeight = image.naturalHeight * coverScale;
  const offsetX = (width - drawWidth) * (positionX / 100);
  const offsetY = (height - drawHeight) * 0.5;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

export default function SequenceCanvas({
  scrollProgress = 0,
  mousePos = { x: 0, y: 0 },
  activeChapter = 0,
  maskPosX = 0.50,
  zoomScale = 1,
  sensitivity = 30,
  showDebug = false,
  sharedVideoRef,
  onPhaseState
}) {
  const flyCanvasRef = useRef(null);
  const transCanvasRef = useRef(null);
  const linesCanvasRef = useRef(null);
  const fallbackVideoRef = useRef(null);
  const videoRef = sharedVideoRef || fallbackVideoRef;

  // Synchronous refs for props to ensure zero React hook desync across renders
  const scrollProgressRef = useRef(scrollProgress);
  const mousePosRef = useRef(mousePos);
  const activeChapterRef = useRef(activeChapter);
  const maskPosXRef = useRef(maskPosX);
  const zoomScaleRef = useRef(zoomScale);
  const sensitivityRef = useRef(sensitivity);
  const showDebugRef = useRef(showDebug);
  const phaseStateRef = useRef('');

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    activeChapterRef.current = activeChapter;
  }, [activeChapter]);

  useEffect(() => {
    maskPosXRef.current = maskPosX;
  }, [maskPosX]);

  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    showDebugRef.current = showDebug;
  }, [showDebug]);

  // 4-pointed sparkle star SVG path:
  // d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z"
  // Radius = 9px (Full width = 18px)
  const drawSparkleStar = (ctx, cx, cy, size = 9, opacity = 1.0) => {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.fill();
    ctx.restore();
  };

  // Master unified render loop
  useEffect(() => {
    const flyCanvas = flyCanvasRef.current;
    const transCanvas = transCanvasRef.current;
    const linesCanvas = linesCanvasRef.current;

    const flyCtx = flyCanvas ? flyCanvas.getContext('2d') : null;
    const transCtx = transCanvas ? transCanvas.getContext('2d') : null;
    const linesCtx = linesCanvas ? linesCanvas.getContext('2d') : null;

    // Offscreen canvas for blue sky chromakey mask
    const offscreen = document.createElement('canvas');
    offscreen.width = 320;
    offscreen.height = 180;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    const poster = new Image();
    poster.crossOrigin = 'anonymous';

    // Keep the previous frame on screen while a fast scroll requests a new one.
    let lastFlyFrame = null;
    let lastTransFrame = null;

    let animId;
    const frameCache = new Map();
    const getFrame = (src) => {
      if (!frameCache.has(src)) {
        const image = new Image();
        image.decoding = 'async';
        image.src = src;
        frameCache.set(src, image);
      }
      return frameCache.get(src);
    };

    const flyFallback = getFrame(`/films/flysky/${window.innerWidth <= 820 ? '768/' : ''}f_001.webp`);
    const transFallback = getFrame(`/films/trans/${window.innerWidth <= 820 ? '768/' : ''}f_001.webp`);
    [30, 60, 90, 121].forEach((index) => {
      const frameName = String(index).padStart(3, '0');
      getFrame(`/films/flysky/${window.innerWidth <= 820 ? '768/' : ''}f_${frameName}.webp`);
      getFrame(`/films/trans/${window.innerWidth <= 820 ? '768/' : ''}f_${frameName}.webp`);
    });

    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sp = scrollProgressRef.current;
      const road = sp * 5350;
      const modelProgress = Math.min(1, sp / (1200 / 5350));
      const maskOpacity = 1 - Math.min(1, modelProgress / 0.0032);

      const reportPhase = (phase) => {
        if (phaseStateRef.current === phase) return;
        phaseStateRef.current = phase;
        onPhaseState?.(phase);
      };

      // 1. Render Flysky sequence
      if (flyCanvas && flyCtx) {
        if (flyCanvas.width !== w * dpr || flyCanvas.height !== h * dpr) {
          flyCanvas.width = w * dpr;
          flyCanvas.height = h * dpr;
        }
        if (road > FLY_START && road < FLY_CROSSFADE_END) {
          const isMobile = w <= 820;
          const flyProgress = clamp01((road - FLY_START) / (FLY_SEQUENCE_END - FLY_START));
          const pathPrefix = `/films/flysky/${isMobile ? '768/' : ''}`;
          const frameIndex = Math.min(121, Math.max(1, Math.round(flyProgress * 120) + 1));
          const numStr = String(frameIndex).padStart(3, '0');
          const img = getFrame(`${pathPrefix}f_${numStr}.webp`);
          const drawable = img?.complete && img.naturalWidth ? img : lastFlyFrame || (flyFallback.complete && flyFallback.naturalWidth ? flyFallback : null);
          if (drawable) {
            lastFlyFrame = drawable;
            const positionX = isMobile
              ? 50 + (20 - 50) * flyProgress
              : 50 + (0 - 50) * smoothstep((flyProgress - 0.26) / 0.34);
            flyCtx.save();
            flyCtx.scale(dpr, dpr);
            flyCtx.clearRect(0, 0, w, h);
            drawCoverFrame(flyCtx, drawable, w, h, positionX);
            flyCtx.restore();
          }
        }
      }

      // 2. Render Trans sequence
      if (transCanvas && transCtx) {
        if (transCanvas.width !== w * dpr || transCanvas.height !== h * dpr) {
          transCanvas.width = w * dpr;
          transCanvas.height = h * dpr;
        }
        if (road > TRANSITION_START && road < 5350) {
          const isMobile = w <= 820;
          const pathPrefix = `/films/trans/${isMobile ? '768/' : ''}`;
          const transitionProgress = clamp01((road - TRANSITION_START) / 700);
          const sequenceProgress = clamp01(transitionProgress / 0.62);
          const frameIndex = Math.min(121, Math.max(1, Math.round(sequenceProgress * 120) + 1));
          const numStr = String(frameIndex).padStart(3, '0');
          const img = getFrame(`${pathPrefix}f_${numStr}.webp`);
          const drawable = img?.complete && img.naturalWidth ? img : lastTransFrame || (transFallback.complete && transFallback.naturalWidth ? transFallback : null);
          if (drawable) {
            lastTransFrame = drawable;
            const startX = isMobile ? 20 : 0;
            const positionX = startX + (50 - startX) * smoothstep((sequenceProgress - 0.12) / 0.6);
            transCtx.save();
            transCtx.scale(dpr, dpr);
            transCtx.clearRect(0, 0, w, h);
            drawCoverFrame(transCtx, drawable, w, h, positionX);
            transCtx.restore();
          }
        }
      }

      // 3. Render Lines Canvas with 18px Sparkle Stars & Right Line Truncation
      if (linesCanvas && linesCtx) {
        linesCanvas.style.opacity = maskOpacity.toFixed(3);
        if (linesCanvas.width !== w * dpr || linesCanvas.height !== h * dpr) {
          linesCanvas.width = w * dpr;
          linesCanvas.height = h * dpr;
        }

        linesCtx.save();
        linesCtx.scale(dpr, dpr);
        linesCtx.clearRect(0, 0, w, h);

        const chapterIdx = activeChapterRef.current || 0;
        const currentConfig = FILMS[chapterIdx] || FILMS[0];

        const video = videoRef.current;
        if (!poster.src) poster.src = currentConfig.poster;

        // Read exact DOM anchor positions with robust fallback values matching CSS rules
        const elV1 = document.querySelector('.ov .gv:not(.gv--r)');
        const elV2 = document.querySelector('.ov .gv--r');
        const elH1 = document.querySelector('.ov .gh[data-out="u"]');
        const elH2 = document.querySelector('.ov .gh[data-out="d"]');

        const rV1 = elV1 ? elV1.getBoundingClientRect() : null;
        const rV2 = elV2 ? elV2.getBoundingClientRect() : null;
        const rH1 = elH1 ? elH1.getBoundingClientRect() : null;
        const rH2 = elH2 ? elH2.getBoundingClientRect() : null;

        const v1 = (rV1 && rV1.left > 0) ? rV1.left : (w * 0.05357 + 20);
        const v2 = (rV2 && rV2.left > 0) ? rV2.left : (w - (w * 0.05357 + 20));
        const h1 = (rH1 && rH1.top > 0) ? rH1.top : 64;
        const h2 = (rH2 && rH2.top > 0) ? rH2.top : (h * 0.653 + 50);

        // A) Draw subtle 1px translucent hairline grid lines
        linesCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
        linesCtx.lineWidth = 1;

        linesCtx.beginPath();
        // Left vertical line: full height from 0 to h
        linesCtx.moveTo(v1, 0);
        linesCtx.lineTo(v1, h);

        // Right vertical line: truncated right at top horizontal line h1 (does not project above h1)
        linesCtx.moveTo(v2, h1);
        linesCtx.lineTo(v2, h);

        // Top horizontal line: from 0 to w
        linesCtx.moveTo(0, h1);
        linesCtx.lineTo(w, h1);

        // Bottom horizontal line: from 0 to w
        linesCtx.moveTo(0, h2);
        linesCtx.lineTo(w, h2);
        linesCtx.stroke();

        // B) Draw ONLY 2 18px Four-Pointed Sparkle Star SVGs at Bottom Line Intersections
        // (Size = 9px radius = 18px full diameter)
        drawSparkleStar(linesCtx, v1, h2, 9, 1.0); // Bottom-Left (ld)
        drawSparkleStar(linesCtx, v2, h2, 9, 1.0); // Bottom-Right (rd)

        // C) Perform Blue-Sky Chromakey Alpha Masking on BOTH Lines & Stars
        const mediaSource = (video && video.readyState >= 2) ? video : (poster.complete ? poster : null);
        if (mediaSource) {
          try {
            const vw = mediaSource.videoWidth || mediaSource.naturalWidth || 1920;
            const vh = mediaSource.videoHeight || mediaSource.naturalHeight || 1080;

            offCtx.fillStyle = '#ffffff';
            offCtx.fillRect(0, 0, 320, 180);

            offCtx.drawImage(mediaSource, 0, 0, 320, 180);
            const imgData = offCtx.getImageData(0, 0, 320, 180);
            const data = imgData.data;

            const sens = sensitivityRef.current !== undefined ? sensitivityRef.current : 30;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const blueDiff = (b - Math.max(r, g) - sens) / 34;

              if (r > 0 || g > 0 || b > 0) {
                if (blueDiff <= 0) {
                  if (showDebugRef.current) {
                    data[i] = 244; data[i + 1] = 63; data[i + 2] = 94; data[i + 3] = 220; // Red debug highlight
                  } else {
                    data[i + 3] = 0; // Cut out element behind figure
                  }
                } else {
                  if (showDebugRef.current) {
                    data[i] = 56; data[i + 1] = 189; data[i + 2] = 248; data[i + 3] = 40; // Cyan debug highlight
                  } else {
                    data[i + 3] = 255;
                  }
                }
              } else {
                data[i + 3] = 255;
              }
            }

            offCtx.putImageData(imgData, 0, 0);

            // Match HeroCanvas's cover-fit and per-film object-position.
            const scale = Math.max(w / vw, h / vh);
            const sw = vw * scale;
            const sh = vh * scale;
            const positionTier = w < 768 ? 0 : w < 1180 ? 1 : 2;
            const filmPosition = currentConfig.pos?.[positionTier] ?? 0.50;
            const posX = clamp01(filmPosition + (maskPosXRef.current ?? 0.50) - 0.50);
            const baseZoom = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1.06;
            const effectiveZoom = (zoomScaleRef.current ?? 1) * baseZoom;
            const zoomedSw = sw * effectiveZoom;
            const zoomedSh = sh * effectiveZoom;
            const tx = (w - zoomedSw) * posX;
            const ty = (h - zoomedSh) * 0.50;

            if (showDebugRef.current) {
              linesCtx.save();
              linesCtx.globalAlpha = 0.65;
              linesCtx.drawImage(offscreen, tx, ty, zoomedSw, zoomedSh);
              linesCtx.restore();
            } else {
              linesCtx.globalCompositeOperation = 'destination-in';
              linesCtx.drawImage(offscreen, tx, ty, zoomedSw, zoomedSh);
              linesCtx.globalCompositeOperation = 'source-over';
            }
          } catch (e) {
            // Fallback if canvas context is restricted
          }
        }

        linesCtx.restore();
      }

      if (road > FLY_START && road < TRANSITION_START) {
        reportPhase(lastFlyFrame ? '' : 'FLY SEQUENCE');
      } else if (road >= TRANSITION_START && road < TRANSITION_END) {
        reportPhase(lastTransFrame ? '' : 'TRANSITION');
      } else {
        reportPhase('');
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const road = scrollProgress * 5350;
  const flyOpacity = road > FLY_START && road < FLY_CROSSFADE_END
    ? 1 - smoothstep((road - TRANSITION_START) / (FLY_CROSSFADE_END - TRANSITION_START))
    : 0;
  const transOpacity = road > TRANSITION_START && road < TRANSITION_END
    ? smoothstep((road - TRANSITION_START) / (FLY_CROSSFADE_END - TRANSITION_START))
    : 0;

  return (
    <>
      <canvas
        ref={flyCanvasRef}
        className="fly"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: flyOpacity
        }}
      />
      <canvas
        ref={transCanvasRef}
        className="trans"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: transOpacity
        }}
      />
      <canvas
        ref={linesCanvasRef}
        className="lines"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 1
        }}
      />
    </>
  );
}
