import { withBase } from './utils/assetPath';

export const FILMS = [
  {
    id: 'signal',
    src: withBase('/films/signal.mp4'),
    poster: withBase('/films/signal-poster.jpg'),
    origin: [0.707, 0.926],
    pos: [0.72, 0.72, 1],
    bridge: 'v28',
    bridgeJoin: 100
  },
  {
    id: 'colossus',
    src: withBase('/films/colossus.mp4'),
    poster: withBase('/films/colossus-poster.jpg'),
    origin: [0.732, 0.54],
    pos: [0.72, 0.6, 1],
    bridge: 'v51',
    bridgeJoin: 85
  },
  {
    id: 'reveal',
    src: withBase('/films/reveal.mp4'),
    poster: withBase('/films/reveal-poster.jpg'),
    origin: [0.84, 0.63],
    pos: [0.72, 0.62, 1],
    bridge: 'v61',
    bridgeJoin: 90
  }
];
