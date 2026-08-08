import React, { useEffect, useRef } from 'react';
import vertexSource from '../glsl/hero_vertex.glsl?raw';
import fragmentSource from '../glsl/hero_main_fragment.glsl?raw';
import { FILMS } from '../films';
import { withBase } from '../utils/assetPath';

const BRIDGE_FRAME_COUNT = 121;
const RENAISSANCE_FRAME_COUNT = 362;
const MODEL_FRAME_COUNT = BRIDGE_FRAME_COUNT + RENAISSANCE_FRAME_COUNT;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

// Exact chapter proportions recovered from the current pear.no production bundle.
const ROAD = {
  model: 1200 / 5350,
  pan: 600 / 5350,
  coda: 300 / 5350,
  paper: 900 / 5350,
  handoff: 300 / 5350,
  faq: 600 / 5350
};

function loadImage(src) {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  return image;
}

export default function HeroCanvas({
  scrollProgress = 0,
  currentFilmIndex = 0,
  maskPosX = 0.5,
  zoomScale = 1,
  sharedVideoRef
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ scrollProgress, maskPosX, zoomScale });

  stateRef.current.scrollProgress = scrollProgress;
  stateRef.current.maskPosX = maskPosX;
  stateRef.current.zoomScale = zoomScale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) {
      console.warn('WebGL context unavailable.');
      return undefined;
    }

    const film = FILMS[currentFilmIndex] || FILMS[0];
    const isMobile = window.innerWidth <= 820;
    const tier = isMobile ? '768' : '1440';
    const derivatives = gl.getExtension('OES_standard_derivatives');
    let fragment = `${derivatives ? '#extension GL_OES_standard_derivatives : enable\n#define AAW(e) (fwidth(e) * 10.0)\n' : '#define AAW(e) 0.006\n'}${fragmentSource}`;
    if (isMobile) fragment = `#define PHONE 1\n${fragment}`;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
      }
      return shader;
    };

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Shader program link failed');
      }
    } catch (error) {
      console.error('Hero WebGL setup failed:', error);
      return undefined;
    }

    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniformNames = 'uRes.uResA.uResB.uPanPx.uPanY.uZoom.uT.uTime.uMode.uPanG.uZoomE.uPanE.uPanEY.uPlateFit.uDot.uBlk.uScale.uAsc.uHeat.uOrigin.uGlow.uMode2.uT2.uResC.uBurn.uBurnX.uBurnY.uPan.uBurnAB.uBurnFld.uBurnChr.uSplit.uBurnE.uPlateZ.uReelZ.uSeam.uSeamWH.uSeamCol.uSeamSoft.uDrift.uMBlur.uEdgeBl.uSpin.uCoda.uFlat.uResE.uEnd.uEndF.uEndC.uResG.uPaperC.uRay1.uRay2.uPap.uDrag.uScrim.uResP.uPlan.uPlan2.uPlan3.uShape'.split('.');
    const uniforms = Object.fromEntries(uniformNames.map((name) => [name, gl.getUniformLocation(program, name)]));
    const textures = [];
    for (let unit = 0; unit < 6; unit += 1) {
      const texture = gl.createTexture();
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 9, 255]));
    }
    ['uA', 'uB', 'uC', 'uE', 'uG', 'uP'].forEach((name, unit) => gl.uniform1i(gl.getUniformLocation(program, name), unit));

    const upload = (unit, source, resUniform) => {
      const width = source.videoWidth || source.naturalWidth;
      const height = source.videoHeight || source.naturalHeight;
      if (!width || !height) return;
      const texture = textures[unit];
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (texture._width === width && texture._height === height) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        texture._width = width;
        texture._height = height;
      }
      if (resUniform && uniforms[resUniform]) gl.uniform2f(uniforms[resUniform], width, height);
    };

    const video = sharedVideoRef?.current;
    if (!video) {
      console.warn('Shared hero video unavailable.');
      return undefined;
    }
    video.play().catch(() => {});
    const poster = loadImage(film.poster);
    const plate = loadImage(withBase('/art/scaffold_expand.jpg'));
    plate.onload = () => upload(2, plate, 'uResC');

    const caches = { model: new Map(), coda: new Map(), tree: new Map(), plan: new Map() };
    const sequencePath = (kind, frame) => {
      if (kind === 'model') {
        const inBridge = frame < BRIDGE_FRAME_COUNT;
        const modelFrame = inBridge ? frame : frame - BRIDGE_FRAME_COUNT;
        const number = String(modelFrame + 1).padStart(3, '0');
        const sequence = inBridge ? film.bridge : 'renaissance';
        return withBase(`/films/model/${sequence}/${tier}/f_${number}.webp`);
      }
      const number = String(frame + 1).padStart(3, '0');
      return withBase(`/films/${kind}/${isMobile ? '768/' : ''}f_${number}.webp`);
    };
    const frame = (kind, index, count) => {
      const safeIndex = Math.round(clamp(index, 0, count - 1));
      if (!caches[kind].has(safeIndex)) caches[kind].set(safeIndex, loadImage(sequencePath(kind, safeIndex)));
      for (let offset = 1; offset <= 3; offset += 1) {
        const next = Math.min(count - 1, safeIndex + offset);
        if (!caches[kind].has(next)) caches[kind].set(next, loadImage(sequencePath(kind, next)));
      }
      const exact = caches[kind].get(safeIndex);
      if (exact?.complete && exact.naturalWidth) return exact;
      for (let offset = 1; offset < count; offset += 1) {
        const nearby = caches[kind].get(Math.max(0, safeIndex - offset)) || caches[kind].get(Math.min(count - 1, safeIndex + offset));
        if (nearby?.complete && nearby.naturalWidth) return nearby;
      }
      return null;
    };
    frame('model', 0, MODEL_FRAME_COUNT);

    gl.uniform1f(uniforms.uDot, 7);
    gl.uniform1f(uniforms.uBlk, 11);
    gl.uniform1f(uniforms.uScale, 3.2);
    gl.uniform1f(uniforms.uAsc, 9);
    gl.uniform1f(uniforms.uHeat, 1);
    gl.uniform2f(uniforms.uOrigin, film.origin[0], film.origin[1]);
    gl.uniform1f(uniforms.uGlow, 0.62);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    let raf = 0;
    const startedAt = performance.now();
    let uploadedModel = null;
    let uploadedCoda = null;
    let uploadedTree = null;
    let uploadedPlan = null;

    const render = (now) => {
      raf = requestAnimationFrame(render);
      resize();
      const p = clamp(stateRef.current.scrollProgress);
      const road = p * 5350;
      const modelProgress = clamp(p / ROAD.model);
      const panProgress = clamp((p - ROAD.model) / ROAD.pan);
      const codaProgress = clamp((p - ROAD.model - ROAD.pan) / ROAD.coda);
      const paperProgress = clamp((p - ROAD.model - ROAD.pan - ROAD.coda) / ROAD.paper);
      const handoffProgress = clamp((p - ROAD.model - ROAD.pan - ROAD.coda - ROAD.paper) / ROAD.handoff);
      const faqProgress = clamp((p - ROAD.model - ROAD.pan - ROAD.coda - ROAD.paper - ROAD.handoff) / ROAD.faq);

      const intro = smooth(clamp(modelProgress / 0.04));
      const reelProgress = clamp((modelProgress - 0.04) / (0.76 - 0.04));
      const burn = clamp((modelProgress - 0.775) / 0.14);
      const treatment = Math.max(Math.sin(Math.PI * clamp((intro - 0.4) / 0.6)), burn > 0 && burn < 1 ? Math.sin(Math.PI * burn) : 0);

      const heroSource = video.readyState >= 2 ? video : poster.complete ? poster : null;
      if (heroSource) upload(0, heroSource, 'uResA');
      if (intro >= 0.999 && !video.paused) video.pause();
      else if (intro < 0.999 && video.paused) video.play().catch(() => {});

      const modelFrameIndex = Math.round(reelProgress * (MODEL_FRAME_COUNT - 1));
      const modelImage = frame('model', modelFrameIndex, MODEL_FRAME_COUNT);
      if (modelImage && modelImage !== uploadedModel) {
        uploadedModel = modelImage;
        upload(1, modelImage, 'uResB');
      }
      const codaImage = frame('coda', codaProgress * 88, 89);
      if (codaProgress > 0 && codaImage && codaImage !== uploadedCoda) {
        uploadedCoda = codaImage;
        upload(3, codaImage, 'uResE');
      }
      // The plan is visible during the first paper beat, while its filmstrip
      // playback runs 26% slower than the display window.
      const planProgress = clamp((road - 2100) / 420);
      const planFrameProgress = clamp((road - 2100) / (420 * 1.26));
      const planImage = frame('plan', planFrameProgress * 120, 121);
      if (road >= 2100 && planImage && planImage !== uploadedPlan) {
        uploadedPlan = planImage;
        upload(5, planImage, 'uResP');
      }

      // Tree playback is deliberately delayed until the second terms beat.
      const treeProgress = clamp((road - 2775) / 525);
      const treeCurve = treeProgress < 0.45
        ? treeProgress / 0.45 * 0.12
        : 0.12 + (treeProgress - 0.45) / 0.55 * 0.88;
      const faqRetreat = Math.round(smooth(clamp(faqProgress / 0.85)) * 36);
      const treeImage = frame('tree', Math.max(0, Math.round(treeCurve * 120) - faqRetreat), 121);
      if (road >= 2100 && treeImage && treeImage !== uploadedTree) {
        uploadedTree = treeImage;
        upload(4, treeImage, 'uResG');
      }

      const sourceWidth = heroSource?.videoWidth || heroSource?.naturalWidth || 1920;
      const sourceHeight = heroSource?.videoHeight || heroSource?.naturalHeight || 1080;
      const canvasAspect = canvas.width / canvas.height;
      const imageAspect = sourceWidth / sourceHeight;
      const baseZoom = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1.06;
      const effectiveZoom = stateRef.current.zoomScale * baseZoom;
      const positionTier = window.innerWidth < 768 ? 0 : window.innerWidth < 1180 ? 1 : 2;
      const positionX = clamp(film.pos[positionTier] + stateRef.current.maskPosX - 0.5);
      let panPx = 0;
      if (canvasAspect < imageAspect) {
        const cropSlack = 1 - canvasAspect / imageAspect / Math.max(0.1, effectiveZoom);
        panPx = cropSlack * (positionX - 0.5) * canvas.width * (imageAspect / canvasAspect);
      }

      gl.useProgram(program);
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, (now - startedAt) / 1000);
      gl.uniform1f(uniforms.uT, intro);
      gl.uniform1i(uniforms.uMode, 5);
      gl.uniform1i(uniforms.uMode2, 5);
      gl.uniform1f(uniforms.uT2, treatment);
      const bridgeSettled = smooth(clamp((modelFrameIndex + 1 - film.bridgeJoin) / 8));
      const reelPanPx = (-20 / 1179) * canvas.width;
      gl.uniform1f(uniforms.uPanPx, panPx + (reelPanPx - panPx) * bridgeSettled);
      gl.uniform1f(uniforms.uPanY, 0);
      gl.uniform1f(uniforms.uZoom, effectiveZoom + (1 - effectiveZoom) * bridgeSettled);
      gl.uniform1f(uniforms.uPanG, 0);
      gl.uniform1f(uniforms.uZoomE, 1);
      gl.uniform1f(uniforms.uPanE, 0);
      gl.uniform1f(uniforms.uPanEY, 0);
      gl.uniform3f(uniforms.uPlateFit, 0, 0, 1);

      gl.uniform1f(uniforms.uBurn, burn);
      gl.uniform1f(uniforms.uBurnX, 0.48 + 20 / window.innerWidth);
      gl.uniform1f(uniforms.uBurnY, 0.57 + 75 / window.innerHeight);
      gl.uniform2f(uniforms.uBurnAB, 2.35, 1.1);
      gl.uniform4f(uniforms.uBurnFld, 0.295, 0.125, 0.052, 0.15);
      gl.uniform4f(uniforms.uBurnChr, 0, 0.31, 0.0104, 5);
      gl.uniform1f(uniforms.uSplit, 0.05 * smooth(clamp(burn / 0.58)));
      gl.uniform2f(uniforms.uBurnE, -0.16, 1.3);
      const push = smooth(clamp((modelProgress - 0.86) / 0.14));
      gl.uniform1f(uniforms.uReelZ, 1 + 2 * push);
      gl.uniform2f(uniforms.uDrift, 0.03 * push, -0.018 * push);
      gl.uniform1f(uniforms.uMBlur, 0.012 * push);
      gl.uniform1f(uniforms.uSpin, 0.13 * push);
      gl.uniform1f(uniforms.uEdgeBl, 0.01 * smooth(clamp((burn - 0.55) / 0.45)));
      gl.uniform1f(uniforms.uSeam, 0.85 * smooth(clamp(burn / 0.55)) * (1 - smooth(clamp((burn - 0.55) / 0.4))));
      gl.uniform2f(uniforms.uSeamWH, 0.2, 0.62);
      gl.uniform3f(uniforms.uSeamCol, 0.898, 0.882, 0.839);
      gl.uniform1f(uniforms.uSeamSoft, 0.055);
      gl.uniform1f(uniforms.uPlateZ, 1);
      gl.uniform1i(uniforms.uShape, 1);
      const plateViewportHeights = plate.naturalHeight && plate.naturalWidth
        ? plate.naturalHeight * canvas.clientWidth / (plate.naturalWidth * canvas.clientHeight)
        : 0;
      gl.uniform1f(
        uniforms.uPan,
        plateViewportHeights > 0 ? (1 - 1 / plateViewportHeights) * (1 - panProgress) : 0
      );

      gl.uniform1f(uniforms.uCoda, smooth(clamp(codaProgress / 0.1)));
      gl.uniform1f(uniforms.uFlat, smooth(clamp((codaProgress - 0.42) / 0.58)));
      gl.uniform3f(uniforms.uPaperC, 226 / 255, 208 / 255, 177 / 255);
      gl.uniform4f(uniforms.uRay1, 2.6, 1.65, 2.25, 2.6);
      gl.uniform4f(uniforms.uRay2, 0.085, 2.5, 0.35, 1.85);
      gl.uniform4f(uniforms.uPap, 0.115, 0.055, 0.038, 0.55);
      gl.uniform3f(uniforms.uDrag, 0.055, 0.16, 0.3);
      gl.uniform4f(uniforms.uPlan2, planImage ? smooth(clamp(planProgress / 0.425)) : 0, 0, 0, 0);
      gl.uniform4f(uniforms.uPlan3, 1, 0, 0, 0);
      gl.uniform4f(uniforms.uPlan, smooth(clamp((planProgress - 0.4) / 0.3)), 0.255, 0.5, 0.46);
      const endProgress = clamp((paperProgress - 420 / 900) / (1 - 420 / 900));
      gl.uniform1f(uniforms.uEnd, treeImage ? (endProgress >= 0.94 ? 1 : endProgress) : 0);
      gl.uniform4f(uniforms.uEndF, 0.06, 0.17, 0.01, 0.1);
      gl.uniform4f(uniforms.uEndC, 0.055, 1.5, 0.62, 0.01);
      gl.uniform1f(uniforms.uScrim, 0.18 * smooth(clamp((modelProgress - 0.26) / 0.08)));

      // The WebGL/tree scene remains the FAQ background through road 3900.
      // It hands off only when the flysky sequence actually starts.
      canvas.style.opacity = road > 3900 ? '0' : '1';
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      video.pause();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      textures.forEach((texture) => gl.deleteTexture(texture));
    };
  }, [currentFilmIndex]);

  return <canvas ref={canvasRef} className="gl" aria-hidden="true" />;
}
