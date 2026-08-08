import React, { useEffect, useRef } from 'react';
import vertexSource from '../glsl/transition_vertex.glsl?raw';
import fragmentSource from '../glsl/transition_fragment.glsl?raw';
import { withBase } from '../utils/assetPath';

const clamp = (value) => Math.min(1, Math.max(0, value));
const gradeTimes = [0, 1, 4, 9, 10];
const gradeValues = [0.955, 0.757, 0.714, 0.533, 0.515];

const footerLuma = (time) => {
  let index = 1;
  while (index < gradeTimes.length - 1 && time > gradeTimes[index]) index += 1;
  const progress = clamp((time - gradeTimes[index - 1]) / (gradeTimes[index] - gradeTimes[index - 1]));
  return gradeValues[index - 1] + (gradeValues[index] - gradeValues[index - 1]) * progress;
};

export default function FooterTransitionCanvas({ scrollProgress = 0, onPhaseState }) {
  const canvasRef = useRef(null);
  const progressRef = useRef(scrollProgress);
  const phaseStateRef = useRef('');
  progressRef.current = scrollProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return undefined;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name) => gl.getUniformLocation(program, name);
    const locations = Object.fromEntries(['progress', 'grade', 'scaleB', 'mode', 'radius', 'width', 'intensity', 'time', 'res', 'img'].map((name) => [name, uniform(name)]));
    const textures = [0, 1].map((unit) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([11, 10, 9, 255]));
      return texture;
    });
    gl.uniform1i(uniform('t1'), 0);
    gl.uniform1i(uniform('t2'), 1);
    gl.uniform1f(locations.grade, 0.955);
    gl.uniform1f(locations.scaleB, 1.018);
    gl.uniform1f(locations.mode, 1);
    gl.uniform1f(locations.radius, 0.9);
    gl.uniform1f(locations.width, 0.35);
    gl.uniform1f(locations.intensity, 74);
    gl.uniform2f(locations.img, 1920, 1080);
    const isMobile = window.innerWidth <= 820;
    const lastFrame = new Image();
    lastFrame.src = withBase(`/films/trans/${isMobile ? '768/' : ''}f_121.webp`);
    const footer = document.querySelector('.foot');
    if (!footer) return undefined;
    let uploadedA = false;
    let uploadedB = false;
    let raf = 0;
    const upload = (unit, source, initialized) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
      if (initialized) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    };
    const render = (time) => {
      raf = requestAnimationFrame(render);
      const transition = clamp((progressRef.current * 5350 - 4650) / 700);
      if (transition > 0.0005) {
        if (footer.paused) footer.play().catch(() => {});
      } else if (!footer.paused) {
        footer.pause();
      }
      const mixProgress = clamp((transition - 0.74) / 0.18);
      // A WebGL canvas with alpha:false is black until both source textures exist.
      // Keep it hidden during that gap so the footer layer remains visible.
      canvas.style.opacity = mixProgress > 0 && mixProgress < 1 && uploadedA && uploadedB ? '1' : '0';
      if (mixProgress <= 0 || mixProgress >= 1) {
        if (phaseStateRef.current !== '') {
          phaseStateRef.current = '';
          onPhaseState?.('');
        }
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height);
      }
      if (lastFrame.complete && lastFrame.naturalWidth) { upload(0, lastFrame, uploadedA); uploadedA = true; }
      if (footer.readyState >= 2) { upload(1, footer, uploadedB); uploadedB = true; }
      if (!uploadedA || !uploadedB) {
        if (phaseStateRef.current !== 'FOOTER TRANSITION') {
          phaseStateRef.current = 'FOOTER TRANSITION';
          onPhaseState?.('FOOTER TRANSITION');
        }
        return;
      }
      if (phaseStateRef.current !== '') {
        phaseStateRef.current = '';
        onPhaseState?.('');
      }
      gl.uniform1f(locations.progress, mixProgress);
      gl.uniform1f(locations.grade, 0.955 / footerLuma(clamp(footer.currentTime || 0, 0, 10)));
      gl.uniform1f(locations.time, time / 1000);
      gl.uniform2f(locations.res, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      footer.pause();
      textures.forEach((texture) => gl.deleteTexture(texture));
      gl.deleteBuffer(buffer); gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="ftx" aria-hidden="true" />;
}
