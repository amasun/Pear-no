export const TOTAL_ROAD = 5350;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Production uses a longer 7300vh physical track on phones, then remaps that
// track back onto the same 5350-unit logical timeline.
const mobileMap = (() => {
  const T = 1200 / TOTAL_ROAD;
  const E = 600 / TOTAL_ROAD;
  const coda = 300 / TOTAL_ROAD;
  const paper = 900 / TOTAL_ROAD;
  const handoff = 300 / TOTAL_ROAD;
  const faq = 600 / TOTAL_ROAD;
  const fly = 500 / TOTAL_ROAD;
  const application = 250 / TOTAL_ROAD;
  const transition = 700 / TOTAL_ROAD;
  const planFilm = 420 / TOTAL_ROAD * 1.26;
  const transitionFilm = 0.62;
  const spans = [
    [0.04 * T, 0.04 * T],
    [(0.76 - 0.04) * T, 0.19149532710280373],
    [(1 - 0.76) * T, (1 - 0.76) * T],
    [E, E], [coda, coda], [planFilm, planFilm - 0.008],
    [0.12538317757009346, 0.11438317757009346],
    [faq, faq - 0.003], [fly, fly - 0.008],
    [application, application], [transitionFilm * transition, transitionFilm * transition]
  ];
  const tail = [[(0.8 - transitionFilm) * transition, 0.005], [0.2 * transition, 0.012]];
  const scale = 0.983 / spans.reduce((sum, span) => sum + span[1], 0);
  const points = [[0, 0]];
  let physical = 0;
  let logical = 0;
  spans.forEach(([logicalSpan, physicalSpan]) => {
    logical += logicalSpan;
    physical += physicalSpan * scale;
    points.push([physical, logical]);
  });
  tail.forEach(([logicalSpan, physicalSpan]) => {
    logical += logicalSpan;
    physical += physicalSpan;
    points.push([physical, logical]);
  });
  points[points.length - 1] = [1, 1];
  return points;
})();

export function mapScrollProgress(rawProgress, isMobile = false) {
  const raw = clamp(rawProgress);
  if (!isMobile) return raw;
  for (let index = 1; index < mobileMap.length; index += 1) {
    if (raw <= mobileMap[index][0]) {
      const [x0, y0] = mobileMap[index - 1];
      const [x1, y1] = mobileMap[index];
      return y0 + (raw - x0) * (y1 - y0) / Math.max(0.000001, x1 - x0);
    }
  }
  return 1;
}

export function rawProgressFromMapped(progress, isMobile = false) {
  const mapped = clamp(progress);
  if (!isMobile) return mapped;
  for (let index = 1; index < mobileMap.length; index += 1) {
    if (mapped <= mobileMap[index][1]) {
      const [x0, y0] = mobileMap[index - 1];
      const [x1, y1] = mobileMap[index];
      return x0 + (mapped - y0) * (x1 - x0) / Math.max(0.000001, y1 - y0);
    }
  }
  return 1;
}

export const roadFromProgress = (progress) => clamp(progress) * TOTAL_ROAD;
