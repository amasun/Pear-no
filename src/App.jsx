import React, { useState, useEffect, useRef } from 'react';
import HeroCanvas from './components/HeroCanvas';
import SequenceCanvas from './components/SequenceCanvas';
import Navigation from './components/Navigation';
import SignSection from './components/SignSection';
import FaqSection from './components/FaqSection';
import ApplicationModal from './components/ApplicationModal';
import FooterSection from './components/FooterSection';
import MaskCalibrator from './components/MaskCalibrator';
import TermsNarrative from './components/TermsNarrative';
import ApplicationScene from './components/ApplicationScene';
import { mapScrollProgress, rawProgressFromMapped, TOTAL_ROAD } from './timeline';
import FooterTransitionCanvas from './components/FooterTransitionCanvas';
import { FILMS } from './films';
import CreditNote from './components/CreditNote';
import LoadingState from './components/LoadingState';

export default function App() {
  const heroVideoRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  // Default -1 on page load so no rail chapter is active initially (all rail ticks are short lines)
  const [activeChapter, setActiveChapter] = useState(-1);
  const [faqRotation, setFaqRotation] = useState(0);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [resourcePhase, setResourcePhase] = useState('');

  // Random initial hero film selection matching original site behavior
  const [initialFilmIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const param = (new URLSearchParams(window.location.search).get('hero') || '').toLowerCase();
    const foundIdx = FILMS.findIndex(f => f.id === param);
    if (foundIdx >= 0) return foundIdx;
    return Math.floor(Math.random() * FILMS.length);
  });

  // Calibration state: default object-pos x = 50% (0.50)
  const [maskPosX, setMaskPosX] = useState(() => {
    const saved = localStorage.getItem('pear_mask_pos_x');
    return saved ? parseFloat(saved) : 0.50;
  });

  const [zoomScale, setZoomScale] = useState(() => {
    const saved = localStorage.getItem('pear_zoom_scale');
    return saved ? parseFloat(saved) : 1.0;
  });

  // Sky sensitivity default set to maximum (30)
  const [sensitivity, setSensitivity] = useState(() => {
    const saved = localStorage.getItem('pear_mask_sensitivity');
    return saved ? parseInt(saved, 10) : 30;
  });

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    localStorage.setItem('pear_mask_pos_x', maskPosX.toString());
  }, [maskPosX]);

  useEffect(() => {
    localStorage.setItem('pear_zoom_scale', zoomScale.toString());
  }, [zoomScale]);

  useEffect(() => {
    localStorage.setItem('pear_mask_sensitivity', sensitivity.toString());
  }, [sensitivity]);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const rawProgress = Math.min(Math.max(currentScroll / (maxScroll || 1), 0), 1);
      const progress = mapScrollProgress(rawProgress, window.innerWidth <= 720);
      
      setScrollProgress(progress);
      setScrollY(currentScroll);

      // Production rail anchors: 0.012, 0.232, 0.400 and 0.628.
      if (progress < 0.012) {
        setActiveChapter(-1);
      } else if (progress < 0.232) {
        setActiveChapter(0);
      } else if (progress < 0.4) {
        setActiveChapter(1);
      } else if (progress < 0.628) {
        setActiveChapter(2);
      } else {
        setActiveChapter(3);
      }

      setFaqRotation(progress * 720);
    };

    const handlePointerMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const timer = setTimeout(() => {
      if (!posterReady && !videoReady) setBootError(true);
    }, 10000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      clearTimeout(timer);
    };
  }, [posterReady, videoReady]);

  const initialPoster = FILMS[initialFilmIndex].poster;
  const bootLoaded = posterReady || videoReady;
  const initialPosition = FILMS[initialFilmIndex].pos[window.innerWidth < 768 ? 0 : window.innerWidth < 1180 ? 1 : 2];
  const scrollToApplication = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const rawProgress = rawProgressFromMapped(4600 / TOTAL_ROAD, window.innerWidth <= 720);
    setIsApplyOpen(false);
    window.scrollTo({ top: maxScroll * rawProgress, behavior: 'auto' });
  };

  return (
    <main id="top" aria-busy={!bootLoaded && !bootError}>
      <LoadingState
        ready={bootLoaded}
        error={bootError}
        phase={resourcePhase}
        onRetry={() => window.location.reload()}
      />
      {/* Floating Mask Calibration Widget */}
      <MaskCalibrator
        maskPosX={maskPosX}
        setMaskPosX={setMaskPosX}
        zoomScale={zoomScale}
        setZoomScale={setZoomScale}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        showDebug={showDebug}
        setShowDebug={setShowDebug}
        scrollProgress={scrollProgress}
        scrollY={scrollY}
      />

      <div className="stage">
        <div className="pin">
          {/* Boot Image Fallback */}
          <img
            className={`boot ${bootLoaded ? 'off' : ''}`}
            fetchPriority="high"
            alt=""
            aria-hidden="true"
            onLoad={() => setPosterReady(true)}
            onError={() => setPosterReady(false)}
            src={initialPoster}
            style={{
              filter: 'blur(5.1px) saturate(0.925) brightness(0.984)',
              transform: 'scale(1.0726)',
              objectPosition: `${Math.min(1, Math.max(0, initialPosition + maskPosX - 0.5)) * 100}% 50%`
            }}
          />

          {/* One video clock shared by WebGL and the chroma-key mask. */}
          <video
            ref={heroVideoRef}
            src={FILMS[initialFilmIndex].src}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            crossOrigin="anonymous"
            aria-hidden="true"
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
          />

          {/* WebGL Stage Canvas */}
          <HeroCanvas
            scrollProgress={scrollProgress}
            currentFilmIndex={initialFilmIndex}
            maskPosX={maskPosX}
            zoomScale={zoomScale}
            sharedVideoRef={heroVideoRef}
          />

          {/* 2D Sequence Canvases (flysky, trans, lines overlay with chromakey mask) */}
          <SequenceCanvas
            scrollProgress={scrollProgress}
            mousePos={mousePos}
            activeChapter={initialFilmIndex}
            maskPosX={maskPosX}
            zoomScale={zoomScale}
            sensitivity={sensitivity}
            showDebug={showDebug}
            sharedVideoRef={heroVideoRef}
            onPhaseState={setResourcePhase}
          />

          <TermsNarrative scrollProgress={scrollProgress} />

          <ApplicationScene scrollProgress={scrollProgress} />

          <FooterTransitionCanvas scrollProgress={scrollProgress} onPhaseState={setResourcePhase} />

          {/* SVG Handwriting Signature */}
          <SignSection
            scrollProgress={scrollProgress}
          />

          {/* Full UI Overlay */}
          <Navigation
            activeChapter={activeChapter}
            scrollProgress={scrollProgress}
            onOpenApply={scrollToApplication}
          />

          {/* 3D FAQ Cylindrical Carousel */}
          <FaqSection rotation={faqRotation} scrollProgress={scrollProgress} />
        </div>
      </div>

      {/* Footer Section */}
      <FooterSection scrollProgress={scrollProgress} />

      {/* Application Modal */}
      <ApplicationModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
      <CreditNote />
    </main>
  );
}
