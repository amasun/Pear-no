
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uA, uB;          // the film, the reel
    uniform vec2  uRes, uResA, uResB;
    uniform float uPanPx;   // the hero framing: how far the film is slid
    uniform float uPanY;    // and up or down
    uniform float uZoom;    // and how hard it is pushed in
    uniform float uT;                  // transition progress, 0..1
    uniform float uTime;
    uniform int   uMode;
    uniform float uDot, uBlk, uScale, uAsc, uHeat;
    uniform int   uMode2;   // the treatment that follows the ring
    uniform float uT2;      // its own strength, 0..1, windowed on the CPU
    uniform sampler2D uC;   // the plate the reel finally burns into
    uniform sampler2D uE;   // and the film that closes it out
    /* The papyrus is 4:3 into a portrait frame, so cover() shows barely a
       third of its width and it lands far bigger than the pillar it cuts
       from. Its own zoom and centre, so the framing can be matched to the
       plate by eye. Phone only; 1 and 0 leave it exactly as it was. */
    uniform float uZoomE;
    uniform float uPanEY;   // and its vertical centre
    /* The plate's own framing, phone only: xy in screen px, z a scale about
       the centre. 0,0,1 is the width fit it has always had. */
    uniform vec3 uPlateFit;
    uniform float uPanE;
    uniform vec2  uResE;
    uniform float uCoda;    // how far the closing film has taken the frame
    uniform float uScrim;   // the renaissance scrim's presence, baked in
    uniform float uFlat;    // and how far flat colour has taken the film
    uniform sampler2D uG;   // what the closing burn opens onto
    uniform vec2  uResG;
    // the grafting film's own horizontal centre, on top of the page's pan.
    // It reaches this one sampler, so nothing before it can be shifted.
    uniform float uPanG;
    uniform vec3  uPaperC;  // the sheet's own colour
    uniform vec4  uRay1;    // speed, drift, jiggle, scale
    uniform vec4  uRay2;    // depth, breathe, rake, contrast swing
    uniform vec4  uPap;     // the sheet itself: pulp, fibre, tooth, flecks
    uniform sampler2D uP;   // the plate: the pear drawn in plan
    uniform vec2  uResP;
    uniform vec4  uPlan3;   // x zoom inside the cutout, yz pan inside it
    uniform vec4  uPlan;    // how far it has drawn back, and to where
    uniform vec4  uPlan2;   // and how far it has opened from the middle
    uniform vec3  uDrag;    // how far the world behind lags, over what
                            // depth, and how hard the sheet drags off
    uniform float uEnd;     // and how far the closing burn has eaten it
    uniform vec4  uEndF;    // its fields: torn lobes, fray, ordered, random
    uniform vec4  uEndC;    // char width, how far back it reaches, its
                            // strength, and the ember's width
    uniform vec2  uResC;
    uniform float uBurn;    // 0..1 across the last stretch of the stage
    uniform float uBurnX;   // the seam's axis — the pear's own split
    uniform float uPan;     // the plate is taller than the frame; this pans it
    uniform float uBurnY;   // where on that axis the halves part
    uniform vec2  uBurnAB;  // anisotropy: how fast the front crosses x, y
    uniform vec4  uBurnFld; // noise, grain, dither, hash
    uniform vec4  uBurnChr; // char amount, char width, glow width, glow heat
    uniform float uSplit;   // how far the two halves are drawn apart
    uniform float uReelZ;   // the outgoing frame pushes in as the tear opens
    uniform float uSeam;    // the beige mass that hides the mirrored join
    uniform float uSeamSoft;// how wide the parting ramps through zero
    uniform vec2  uDrift;   // where the push-in's point slides to
    uniform float uMBlur;   // smear along the escape
    uniform float uSpin;    // the roll the frame takes on the way in
    uniform float uEdgeBl;  // and the softening at the edges
    uniform vec2  uSeamWH;  // its reach across and up
    uniform vec3  uSeamCol; // and what colour it is
    uniform vec2  uBurnE;   // the opening's reach: edge at 0, edge at 1
    uniform float uPlateZ;  // the plate's own zoom — you arrive into it
    uniform int   uShape;   // how distance is measured, i.e. the tear's shape
    uniform vec2  uOrigin;             // the pear, in the film's own frame
    uniform float uGlow;               // how much light the ring's crest carries

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
    // the classic recursive Bayer trick: a 2x2 threshold nested into a 4x4
    float bayer2(vec2 a){ a = floor(a); return fract(a.x/2.0 + a.y*a.y*0.75); }
    float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
    float vnoise(vec2 p){
      vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
                 mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p){ float v=0.0, a=0.5;
      for(int i=0;i<4;i++){ v += a*vnoise(p); p *= 2.03; a *= 0.5; }
      return v / 0.9375; }
    /* The texture octaves, priced for the screen. The paper's pulp, the
       sheet's torn edges and the closing burn's lobes read at two octaves
       on a phone exactly as they do at four — the finer pair lives below
       one device pixel there — and the difference is half the noise cost
       of the page's heaviest chapters. Fields that shape MOTION (the ring,
       the tear) keep all four everywhere. */
    #ifdef PHONE
    float fbmQ(vec2 p){ float v=0.0, a=0.5;
      for(int i=0;i<2;i++){ v += a*vnoise(p); p *= 2.03; a *= 0.5; }
      return v / 0.75; }
    #else
    float fbmQ(vec2 p){ return fbm(p); }
    #endif

    /* A 5×5 bitmap font, drawn straight out of arithmetic — no atlas.
       Each glyph is five 5-bit rows (bit 0 = leftmost), so every constant
       stays tiny and exact even at mediump; a single 25-bit mask would
       not survive a float. Ordered lightest to heaviest:
       ' '  .  :  -  +  =  *  %  #  @                                   */
    void glyphRows(float i, out float r0, out float r1, out float r2, out float r3, out float r4){
      r0=0.0; r1=0.0; r2=0.0; r3=0.0; r4=0.0;
      if      (i < 0.5) { }
      else if (i < 1.5) {                     r3= 4.0;           }
      else if (i < 2.5) {           r1= 4.0;  r3= 4.0;           }
      else if (i < 3.5) {                     r2=14.0;           }
      else if (i < 4.5) {           r1= 4.0;  r2=14.0; r3= 4.0;  }
      else if (i < 5.5) {           r1=14.0;           r3=14.0;  }
      else if (i < 6.5) { r0= 4.0;  r1=21.0;  r2=14.0; r3=21.0; r4= 4.0; }
      else if (i < 7.5) { r0=19.0;  r1=11.0;  r2= 4.0; r3=26.0; r4=25.0; }
      else if (i < 8.5) { r0=10.0;  r1=31.0;  r2=10.0; r3=31.0; r4=10.0; }
      else              { r0=31.0;  r1=29.0;  r2=27.0; r3=23.0; r4=31.0; }
    }
    // p is the position inside one cell, -0.5..0.5; returns 1 where there is ink
    float glyph(float i, vec2 p){
      p = floor(p*vec2(5.0, -5.0) + 2.5);
      if (p.x < 0.0 || p.x > 4.0 || p.y < 0.0 || p.y > 4.0) return 0.0;
      float r0,r1,r2,r3,r4; glyphRows(i, r0,r1,r2,r3,r4);
      float r = p.y < 0.5 ? r0 : p.y < 1.5 ? r1 : p.y < 2.5 ? r2 : p.y < 3.5 ? r3 : r4;
      return mod(floor(r / exp2(p.x)), 2.0);
    }

    /* cover-fit, so a 16:9 source fills any viewport the same way. The pan
       is passed in rather than read off uPanPx, so one shot can be framed
       on its own — the grafting film wants a different centre from the
       hero, and nothing else may move when it is retuned. */
    vec2 coverFit(vec2 uv, vec2 tex, float panPx, float zoom){
      float ca = uRes.x/uRes.y, ia = tex.x/tex.y;
      if (ca > ia) {
        uv.y = (uv.y-0.5)*(ia/ca)/zoom+0.5;
        uv.x = (uv.x-0.5)/zoom+0.5;
        uv.x += panPx / uRes.x;
        uv.y += (uPanY / uRes.y) * (ia/ca);
      } else {
        /* The frame is taller than the film, so the fit is by height and
           the crop is off the sides — which is what a phone wants. The pan
           then chooses which part of that width to keep: the key action
           sits right of centre, so the picture is pushed left to bring it
           in. Zero on the desktop, so the fit there is untouched. */
        float k = (ca/ia)/zoom;
        uv.x = (uv.x-0.5)*k+0.5;
        uv.y = (uv.y-0.5)/zoom+0.5;
        /* Held inside the frame. The crop only has (1-k)/2 of slack either
           side; asking for more than that samples past the edge, which is
           where the black came from. */
        float slack = max(0.0, (1.0 - k) * 0.5);
        uv.x += clamp((panPx / uRes.x) * (ca/ia), -slack, slack);
        uv.y += uPanY / uRes.y;
      }
      return uv;
    }
    // every existing call site keeps the page-wide pan
    vec2 coverPan(vec2 uv, vec2 tex, float panPx){ return coverFit(uv, tex, panPx, uZoom); }
    vec2 cover(vec2 uv, vec2 tex){ return coverFit(uv, tex, uPanPx, uZoom); }
    // the other way round: a point in the film's frame → where it lands
    // on screen, so the ring can be pinned to the pear at any viewport.
    // The full inverse of cover(): the pan slides the picture across the
    // frame and the zoom pushes into it, so the point has to slide back
    // and spread out by the same amounts — without them the ring left
    // from where the pear would be on an untouched frame.
    vec2 uncover(vec2 t, vec2 tex){
      float ca = uRes.x/uRes.y, ia = tex.x/tex.y;
      if (ca > ia) {
        t.y = (t.y-0.5)*(ca/ia)*uZoom + 0.5;
        t.x = (t.x-0.5-uPanPx/uRes.x)*uZoom + 0.5;
      } else {
        t.x = (t.x-0.5-(uPanPx/uRes.x)*(ca/ia))*(ia/ca)*uZoom + 0.5;
        t.y = (t.y-0.5)*uZoom + 0.5;
      }
      return t;
    }
    vec3 A(vec2 uv){ return texture2D(uA, cover(uv, uResA)).rgb; }
    /* The reel shares the hero's framing outright — the pan itself is keyed
       to the reel's frames on the CPU (the grafting arrives on a different
       centre), so the two pictures always agree where the figure stands. */
    vec3 B(vec2 uv){ return texture2D(uB, cover(uv, uResB)).rgb; }

    void main(){
      vec2 uv = vUv;
      float t = uT;
      vec3 col = vec3(0.0);

      /* Dead road is not drawn. The shader carries the whole journey, but
         once the plate owns the frame (the burn saturated) the ring under
         it cannot reach a single pixel, and once the closing film owns it
         (the coda saturated) neither can the burn — their work is
         identical to doing nothing, and on a phone it was half the cost
         of the chapters that follow. The output is bit-for-bit the same;
         only the wasted arithmetic goes. */
      if (uCoda < 0.999 && uBurn < 0.999) {

      if (uMode == 0) {
        // --- breathe: a soft circle opens from the centre. Inside it the
        // reel expands out of a point; outside, the film is drawn inward.
        // One layer inhales as the other exhales.
        vec2  ar = vec2(uRes.x/uRes.y, 1.0);
        float dist = length((uv - 0.5)*ar) / length(ar*0.5);
        float lens = 1.0 - smoothstep(t*1.05 - 0.30, t*1.05, dist);
        vec2  cv = uv - 0.5;
        vec2  inUV  = uv + cv*(lens - 1.0);
        vec2  outUV = uv - cv*(lens*0.5 + t*0.2);
        col = mix(A(outUV), B(inUV), lens);

      } else if (uMode == 1) {
        // --- slabs: each layer shears in stepped bands while a
        // boundary sweeps across handing one layer to the other
        float vert = abs(t*0.3);
        float dx1 = t*0.8;
        dx1 -= step(0.2 - vert, uv.x)*0.3*t;
        dx1 -= step(0.4 - vert, uv.x)*0.3*t;
        dx1 += step(0.6 - vert, uv.x)*0.3*t;
        dx1 += step(0.8 - vert, uv.x)*0.3*t;

        float t1 = t - 1.0;
        float vert1 = abs(t1*0.3);
        float dx2 = t1*0.8;
        dx2 -= step(0.2 + vert1, uv.x)*0.3*t1;
        dx2 -= step(0.4 + vert1, uv.x)*0.3*t1;
        dx2 += step(0.6 + vert1, uv.x)*0.3*t1;
        dx2 += step(0.8 + vert1, uv.x)*0.3*t1;

        float bnd = step(0.0, 1.0 - (uv.x + t));
        col = A(uv + vec2(dx1, 0.0))*bnd + B(uv + vec2(dx2, 0.0))*(1.0 - bnd);

      } else if (uMode == 2) {
        // --- the reel prints itself over the film: a halftone screen
        // whose dots grow from nothing until they merge, arriving on a
        // cloud-shaped front rather than a straight edge
        vec2 cell = floor(uv*uRes/uDot);
        vec2 c    = (cell + 0.5)*uDot/uRes;
        float d   = length((uv - c)*uRes) / (uDot*0.72);
        float cov = clamp(t*1.6 - 0.3 + (fbm(uv*3.0 + uTime*0.02) - 0.5)*0.55, 0.0, 1.0);
        float r   = cov*1.55;
        float m   = 1.0 - smoothstep(r - 0.18, r + 0.06, d);
        col = mix(A(uv), B(uv), m);

      } else if (uMode == 3) {
        // --- both layers warp through one noise field and the wipe
        // rides the same field, so the join is never a straight line
        float n = fbm(uv*uScale);
        vec2 d  = vec2(n - 0.5, fbm(uv*uScale + 19.0) - 0.5);
        float m = smoothstep(n - 0.10, n + 0.10, t*1.25 - 0.12);
        col = mix(A(uv + d*0.22*t), B(uv - d*0.22*(1.0 - t)), m);

      } else if (uMode == 4) {
        /* --- static: a diagonal wave crosses the frame from the bottom
           right corner. Ahead of it the film is untouched; behind it the
           painting stands. The crest itself is where the signal fails —
           tear, mosaic, chroma split and an ASCII rubbing of the art.  */

        // distance from the bottom-right corner, aspect-corrected so the
        // front runs at a true 45° on screen; a slow noise keeps it from
        // reading as a ruled line
        float ar = uRes.x/uRes.y;
        float d  = ((1.0 - uv.x)*ar + uv.y) / (ar + 1.0);
        d += (fbm(uv*2.4 + vec2(uTime*0.03, 0.0)) - 0.5)*0.17;

        // the crest travels from off one corner to off the other, so the
        // frame is whole at t=0 and whole again at t=1
        float W     = 0.34;
        float ph    = d - (t*(1.0 + 2.0*W) - W);
        float pass  = smoothstep(W, -W, ph);            // 0 ahead, 1 behind
        float band  = clamp(1.0 - abs(ph)/W, 0.0, 1.0);
        band = band*band*(3.0 - 2.0*band)*uHeat;

        // within the crest, only patches actually break
        float fld = fbm(uv*3.4 + vec2(uTime*0.06, uTime*0.31));
        float brk = smoothstep(0.63 - band*0.26, 0.80 - band*0.18, fld) * band;

        // 1 · rows tear sideways on a fast clock, in quantised jumps
        float row = floor(uv.y*uRes.y/7.0);
        float rj  = (hash(vec2(row, floor(uTime*15.0))) - 0.5);
        rj = floor(rj*7.0)/7.0;
        vec2 tuv = uv + vec2(rj*0.22*brk, 0.0);

        // 2 · two block octaves, swapping on their own clock
        float fine = step(0.24, hash(floor(uv*15.0) + floor(uTime*5.0)));
        float cs   = mix(uBlk, uBlk*0.28, fine);
        vec2  blk = floor(tuv*uRes/cs);
        vec2  suv = (blk + 0.5)*cs/uRes;
        vec2  puv = mix(tuv, suv, brk);

        // 3 · each block hands over at its own point inside the crest,
        // so the wave has a ragged edge rather than a clean one
        float h = hash(blk);
        float m = smoothstep(h*0.55, h*0.55 + 0.45, pass);
        vec3 c = mix(A(puv), B(puv), m);

        // 4 · the channels come apart where it tears hardest
        float o = (11.0*brk)/uRes.x;
        c.r = mix(A(puv + vec2(o, 0.0)), B(puv + vec2(o, 0.0)), m).r;
        c.b = mix(A(puv - vec2(o, 0.0)), B(puv - vec2(o, 0.0)), m).b;

        // 5 · patches of the crest re-render as type: each cell reads the
        // art beneath it and prints the glyph of the right weight, so the
        // picture survives as an ASCII rubbing of itself
        vec2  gp  = floor(uv*uRes/uAsc);
        vec2  gc  = (gp + 0.5)*uAsc/uRes;
        float gm  = smoothstep(hash(gp)*0.55, hash(gp)*0.55 + 0.45, pass);
        vec3  gcol = mix(A(gc), B(gc), gm);
        float lum = dot(gcol, vec3(0.299, 0.587, 0.114));
        // a little per-cell jitter so the ramp never bands cleanly
        lum = clamp(lum + (hash(gp + floor(uTime*10.0)) - 0.5)*0.10, 0.0, 1.0);
        float ink = glyph(floor(lum*9.99), fract(uv*uRes/uAsc) - 0.5);
        vec3 ascii = mix(gcol*0.14 + 0.02, gcol*1.5 + 0.06, ink);

        // pure static, sprinkled through the worst of it
        float st = hash(floor(uv*uRes) + floor(uTime*26.0));
        ascii = mix(ascii, vec3(st), 0.10*brk);

        // only the hottest part of the break becomes type
        col = mix(c, ascii, smoothstep(0.55, 0.95, brk));
      }

      if (uMode == 5) {
        /* --- ring: the same failure, but it leaves from the pear in her
           raised hand and opens outward. The film already draws concentric
           signal rings from that point; this rides them.               */

        vec2  ar2 = vec2(uRes.x/uRes.y, 1.0);
        vec2  org = uncover(uOrigin, uResA);
        vec2  p   = (uv - org)*ar2;

        // normalise by the furthest corner, so the ring always clears the frame
        float reach = max(
          max(length((vec2(0.0,0.0) - org)*ar2), length((vec2(1.0,0.0) - org)*ar2)),
          max(length((vec2(0.0,1.0) - org)*ar2), length((vec2(1.0,1.0) - org)*ar2)));
        float r   = length(p) / max(reach, 1e-4);

        /* The treatment displaces where the ring samples from, so it reads
           as one pass rather than a filter laid over a finished frame.
           Computed ahead of the fast paths below, because the treatments
           displace the whole frame whether or not the ring is near. */
        vec2 duv = vec2(0.0);
        if (uT2 > 0.001) {
          if (uMode2 == 1) {                     // slabs shearing right
            float lane = floor(uv.y * 11.0);
            duv.x += (0.035 + hash(vec2(lane, 3.7)) * 0.13) * uT2;
          } else if (uMode2 == 3) {              // the frame warps and settles
            duv = vec2(fbm(uv * 3.2) - 0.5, fbm(uv * 3.2 + 19.0) - 0.5) * 0.18 * uT2;
          } else if (uMode2 == 4) {              // per-block tear
            vec2 bk = floor(uv * uRes / uBlk);
            duv.x += (hash(bk + floor(uTime * 12.0)) - 0.5) * 0.11 * uT2;
          } else if (uMode2 == 5) {              // the same, much finer
            vec2 bk = floor(uv * uRes / 3.0);
            duv.x += (hash(bk + floor(uTime * 26.0)) - 0.5) * 0.05 * uT2;
          } else if (uMode2 == 8) {              // columns slip vertically
            float lane = floor(uv.x * uRes.x / 15.0);
            duv.y += (hash(vec2(lane, floor(uTime * 9.0))) - 0.5) * 0.14 * uT2;
          }
        }
        /* Mosaic snaps the sampling to a grid that starts coarse and
           resolves as the treatment passes. */
        if ((uMode2 == 6 || uMode2 == 9) && uT2 > 0.001) {
          float cell = mix(2.0, 30.0, uT2);
          vec2 g = floor((uv + duv) * uRes / cell);
          duv = mix(duv, (g + 0.5) * cell / uRes - uv, uT2);
        }

        /* THE FAST PATHS. The lobes' reach is bounded: wob·0.30 can never
           leave ±0.24, so any pixel with r beyond t·1.6 + 0.26 is provably
           ahead of every possible front (pass, band, brk all exactly zero
           → the film, transformed), and any pixel with r inside t·1.6 −
           0.86 is provably behind it (pass exactly one, band zero → the
           reel, transformed). For those pixels — most of the frame at
           rest and through the ride — the harmonics, the field, the tear,
           the glyphs and the flare all evaluate to identity, so they are
           not evaluated. The annulus between the bounds, where the ring
           actually lives (including its resting breath at the pear),
           takes the full path bit-for-bit as before. */
        if (r > t*1.6 + 0.26 || r < t*1.6 - 0.86) {
          float m = step(r, t*1.6 - 0.86); // 0 ahead of the ring, 1 behind
          vec2 puv = uv + duv;
          if (uSplit > 0.0) {
            float side = smoothstep(-uSeamSoft, uSeamSoft, uv.x - uBurnX) * 2.0 - 1.0;
            puv.x -= side * uSplit;
          }
          vec2 zo = vec2(uBurnX, uBurnY) + uDrift;
          if (uReelZ > 1.0) {
            puv = (puv - zo) / uReelZ + zo;
          }
          if (abs(uSpin) > 0.0001) {
            float ca = cos(uSpin), sa = sin(uSpin);
            vec2  ars = vec2(uRes.x / uRes.y, 1.0);
            vec2  q  = (puv - zo) * ars;
            q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
            puv = q / ars + zo;
          }
          vec3 c;
          if (uMBlur > 0.0001) {
            float sgn = smoothstep(-uSeamSoft, uSeamSoft, uv.x - uBurnX) * 2.0 - 1.0;
            vec2  mb  = vec2(sgn * uMBlur, 0.0);
            c = vec3(0.0);
            for (int k = 0; k < 5; k++) {
              vec2 o2 = mb * ((float(k) - 2.0) * 0.25);
              c += mix(A(puv + o2), B(puv + o2), m);
            }
            c *= 0.2;
          } else {
            c = mix(A(puv), B(puv), m);
          }
          if (uEdgeBl > 0.0001) {
            vec2 rd = (uv - zo) * uEdgeBl;
            c = (c + mix(A(puv + rd), B(puv + rd), m)
                   + mix(A(puv - rd), B(puv - rd), m)) / 3.0;
          }
          col = c;
        } else {

        float ang = atan(p.y, p.x);

        // not a circle: two angular harmonics lobe the front and breathe,
        // so it opens as something chaotic rather than a ripple
        float wob = (fbm(vec2(ang*1.9 + 3.0, uTime*0.20)) - 0.5)
                  + (fbm(vec2(ang*5.3, uTime*0.38)) - 0.5)*0.55;

        float W    = 0.30;
        float R    = t*(1.0 + 2.0*W) - W + wob*0.30;
        float ph   = r - R;
        float pass = smoothstep(W, -W, ph);
        float band = clamp(1.0 - abs(ph)/W, 0.0, 1.0);
        band = band*band*(3.0 - 2.0*band)*uHeat;

        // the break-up carries the painting's own ring cadence
        float rings = 0.5 + 0.5*sin(r*46.0 - uTime*1.1);
        float fld = fbm(uv*3.4 + vec2(uTime*0.06, uTime*0.31))*0.72 + rings*0.28;
        float brk = smoothstep(0.62 - band*0.26, 0.80 - band*0.18, fld) * band;

        // 1 · the tear runs outward from the pear, with a row tear under it
        vec2  dir = (p / max(length(p), 1e-4)) / ar2;
        float rr  = hash(vec2(floor(r*90.0), floor(uTime*15.0))) - 0.5;
        rr = floor(rr*7.0)/7.0;
        float rowj = hash(vec2(floor(uv.y*uRes.y/7.0), floor(uTime*13.0))) - 0.5;
        vec2  tuv = uv + dir*(rr*0.17*brk) + vec2(rowj*0.09*brk, 0.0);

        // 2 · two block octaves, fine favoured
        float fine = step(0.24, hash(floor(uv*15.0) + floor(uTime*5.0)));
        float cs   = mix(uBlk, uBlk*0.28, fine);
        vec2  blk  = floor(tuv*uRes/cs);
        vec2  suv  = (blk + 0.5)*cs/uRes;
        vec2  puv  = mix(tuv, suv, brk);

        // 3 · each block hands over at its own point inside the ring
        float h = hash(blk);
        float m = smoothstep(h*0.55, h*0.55 + 0.45, pass);
        puv += duv;
        /* As the tear opens, the frame is drawn apart along the same seam:
           sampling moves toward the axis, so the content moves away from
           it — the two halves part with the gap. */
        if (uSplit > 0.0) {
          /* The beige only ever covered the join; the join was still a step.
             the sign used to flip from -1 to +1 across a single pixel, so the
             two halves sampled from places that had nothing to do with each
             other and met at a hard edge. Ramping it through zero instead
             means there is no discontinuity anywhere: at the centre the
             frame is not displaced at all, and the draw builds up over the
             band. The stretch that costs is a few percent, under the beige
             and the dither, and invisible. */
          float side = smoothstep(-uSeamSoft, uSeamSoft, uv.x - uBurnX) * 2.0 - 1.0;
          puv.x -= side * uSplit;
        }
        /* And the whole frame pushes in on the opening — about the tear's
           own point, not the frame centre, so it reads as falling forward
           into the gap rather than a flat scale. The point itself drifts as
           the push accelerates: a dolly straight down its own axis is the
           one move the eye reads as a zoom, and a few percent of sideways
           travel is what turns it back into a camera. */
        vec2 zo = vec2(uBurnX, uBurnY) + uDrift;
        if (uReelZ > 1.0) {
          puv = (puv - zo) / uReelZ + zo;
        }
        // and a slow roll about the same point, so it is a camera not a lens
        if (abs(uSpin) > 0.0001) {
          float ca = cos(uSpin), sa = sin(uSpin);
          vec2  ar = vec2(uRes.x / uRes.y, 1.0);
          vec2  q  = (puv - zo) * ar;
          q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
          puv = q / ar + zo;
        }
        /* Directional smear along the escape. The halves leave at speed but
           every pixel of them is perfectly sharp, which is the plainest
           tell that this is a wipe and not a thing moving. Five taps down
           the split axis, signed the same way the parting is, so each half
           smears the way it is actually going. */
        vec3 c;
        if (uMBlur > 0.0001) {
          float sgn = smoothstep(-uSeamSoft, uSeamSoft, uv.x - uBurnX) * 2.0 - 1.0;
          vec2  mb  = vec2(sgn * uMBlur, 0.0);
          c = vec3(0.0);
          for (int k = 0; k < 5; k++) {
            vec2 o2 = mb * ((float(k) - 2.0) * 0.25);
            c += mix(A(puv + o2), B(puv + o2), m);
          }
          c *= 0.2;
        } else {
          c = mix(A(puv), B(puv), m);
        }
        /* And it goes soft toward the edges as it arrives, the way something
           does when it gets close to the lens. Radial, from the tear's own
           point, and only in the last of the burn. */
        if (uEdgeBl > 0.0001) {
          vec2 rd = (uv - zo) * uEdgeBl;
          c = (c + mix(A(puv + rd), B(puv + rd), m)
                 + mix(A(puv - rd), B(puv - rd), m)) / 3.0;
        }

        // 4 · the channels come apart along the radius
        float o = 13.0*brk/uRes.x;
        c.r = mix(A(puv + dir*o), B(puv + dir*o), m).r;
        c.b = mix(A(puv - dir*o), B(puv - dir*o), m).b;

        // 5 · the crest re-renders as type
        vec2  gp   = floor(uv*uRes/uAsc);
        vec2  gc   = (gp + 0.5)*uAsc/uRes;
        float gm   = smoothstep(hash(gp)*0.55, hash(gp)*0.55 + 0.45, pass);
        vec3  gcol = mix(A(gc), B(gc), gm);
        float lum  = dot(gcol, vec3(0.299, 0.587, 0.114));
        lum = clamp(lum + (hash(gp + floor(uTime*10.0)) - 0.5)*0.10, 0.0, 1.0);
        float ink  = glyph(floor(lum*9.99), fract(uv*uRes/uAsc) - 0.5);
        // ground the type high and print the ink bright: the crest reads
        // as an overexposed plate rather than a hole burnt in the frame
        vec3 ascii = mix(gcol*0.58 + 0.30, gcol*1.10 + 0.48, ink);

        // the static in here is light too, not grey
        float st = hash(floor(uv*uRes) + floor(uTime*26.0));
        ascii = mix(ascii, vec3(1.0, 0.98, 0.93)*st, 0.16*brk);

        col = mix(c, ascii, smoothstep(0.50, 0.95, brk));

        // and the whole crest carries a flare, screen-blended toward the
        // gilt of the pear it left — light travelling out, not a tear
        vec3 flare = vec3(1.0, 0.94, 0.80) * (band*band) * uGlow;
        col = 1.0 - (1.0 - col)*(1.0 - flare);
        } // the fast paths rejoin: the treatments below serve both

        /* Ordered dither: posterise through the Bayer matrix, so the frame
           breaks into a print screen rather than flat bands. */
        if ((uMode2 == 7 || uMode2 == 9) && uT2 > 0.001) {
          float lv = mix(24.0, 3.0, uT2);
          vec3 d = floor(col * lv + bayer4(gl_FragCoord.xy)) / lv;
          col = mix(col, d, uT2);
        }

        // the halftone treatment is a colour pass, not a displacement
        if (uMode2 == 2 && uT2 > 0.001) {
          vec2 cell = floor(uv*uRes/uDot);
          vec2 cc   = (cell + 0.5)*uDot/uRes;
          float dd  = length((uv - cc)*uRes) / (uDot*0.72);
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          float dot1 = 1.0 - smoothstep(lum*1.5 - 0.18, lum*1.5 + 0.06, dd);
          col = mix(col, mix(col*0.25, col*1.25, dot1), uT2);
        }
      }

      /* ------------------------------------------------------------------
         THE SEAM — the halves part along a straight line, and a straight
         line down the middle of a painting reads as a mirror. A soft beige
         mass sits over the join: bitten by fbm so it is not an airbrush,
         anisotropic so it follows the gap rather than being a circle, and
         under the burn rather than over it, so the blue still opens through
         it exactly as before. */
      if (uSeam > 0.001) {
        float sx = (uv.x - uBurnX) * (uRes.x / uRes.y) / max(uSeamWH.x, 1e-3);
        float sy = (uv.y - uBurnY) / max(uSeamWH.y, 1e-3);
        float m  = exp(-(sx * sx)) * exp(-(sy * sy));
        // two octaves of bite, one drifting, so the edge is never a contour
        m *= 0.55 + 0.85 * fbm(uv * 4.2 + vec2(0.0, uTime * 0.04));
        m *= 0.70 + 0.60 * fbm(uv * 11.0 - vec2(uTime * 0.03, 0.0));
        col = mix(col, uSeamCol, clamp(m, 0.0, 1.0) * uSeam);
      }

      } // the film, the ring and the seam end here when covered

      /* ==================================================================
         THE BURN — the reel's last frame is eaten away and the plate is
         underneath it. The cut is a noise-bent wipe, not a line: two
         decorrelated fields tear it into lobes, ordered dither and a hash
         stipple its boundary, and the side about to go carbonises before
         it does. The scorch multiplies into the image rather than
         replacing it, so the picture keeps reading through the char.
         ================================================================== */
      if (uBurn > 0.0001 && uCoda < 0.999) {
        float asp = uRes.x / uRes.y;

        /* The plate is set to the frame's width and is taller than it, so
           it scrolls through its own height rather than being cropped. */
        float plateH = (uResC.y * uRes.x) / (uResC.x * uRes.y);   // in viewport heights
        /* You arrive into the plate rather than cutting to it: it opens
           held close, then eases back to its own scale, and keeps creeping
           in through the pan so the world never quite settles. */
        // the plate reads mirrored, so the scaffold runs the other way
        vec2 fv  = vec2(1.0 - vUv.x, vUv.y);
        vec2 z   = (fv - 0.5) / uPlateZ + 0.5;
        vec2 zf = (z - 0.5) / uPlateFit.z + 0.5;
        vec2 sUv = vec2(zf.x + uPlateFit.x / uRes.x,
                        zf.y / plateH + uPan + uPlateFit.y / uRes.y);
        vec3 nxt = texture2D(uC, sUv).rgb;

        /* Fully open, the cut is past every margin and every pixel is the
           plate: the torn fields, the char and the ember resolve to
           exactly this line. */
        if (uBurn >= 0.999) { col = nxt; } else {

        // the mask field snaps to a pixel grid; the images stay full-res
        vec2 pix = floor(gl_FragCoord.xy / 2.0);
        vec2 quv = (pix * 2.0 + 1.0) / uRes;

        vec2  nuv  = vec2(quv.x * asp, quv.y) + vec2(0.0, uTime * 0.02);
        float big  = fbm(nuv * 0.9 - uTime * 0.0087) * 2.0 - 1.0;   // torn lobes
        float fine = (vnoise(vec2(quv.x * asp, quv.y) * 90.0) - 0.5)
                   * mix(0.3, 0.6, 0.5 + 0.5 * sin(uTime - quv.x * 10.0));

        float ord = bayer4(pix) - 0.5;
        float rnd = hash(pix + 37.0) - 0.5;

        /* The cut is the cut in the picture. It opens where the halves
           part and grows out of that point — narrow in x and tall in y, so
           it reads as a vertical seam widening rather than a horizontal
           wipe. Anisotropic distance: the larger coefficient is the axis
           the front crosses more slowly. */
        /* The shape of the opening is just the metric the distance is
           measured in: L2 gives an oval, L∞ a rectangle, L1 a diamond, and
           a fourth power the superellipse between oval and box. */
        vec2  d  = vec2((quv.x - uBurnX) * uBurnAB.x, (quv.y - uBurnY) * uBurnAB.y);
        vec2  ad = abs(d);
        float th;
        if      (uShape == 1) th = max(ad.x, ad.y);                 // square
        else if (uShape == 2) th = ad.x + ad.y;                     // diamond
        else if (uShape == 3) th = pow(pow(ad.x, 4.0) + pow(ad.y, 4.0), 0.25);  // squircle
        else                  th = length(d);                       // oval
        th = th + big * uBurnFld.x + fine * uBurnFld.y
                + ord * uBurnFld.z + rnd * uBurnFld.w;

        // padded either side so 0 and 1 are fully clear of the frame
        float edge  = mix(uBurnE.x, uBurnE.y, uBurn) - th;
        float aa    = AAW(edge);
        float blend = smoothstep(-aa, aa, edge);

        // the char: depth into the band carbonises, grain mottles it, and
        // dither against coverage keeps the boundary stippled, not soft
        float charT   = clamp(-edge / uBurnChr.y, 0.0, 1.0);
        float mottle  = clamp(0.5 + fine * 2.2 + big * 0.35, 0.0, 1.0);
        float cov     = smoothstep(0.0, 1.0, charT) * mix(0.55, 1.15, mottle);
        float stipple = step(0.5 + ord * 1.6 + rnd * 0.9, cov * 1.25);
        float charAmt = mix(cov, stipple, 0.72) * step(edge, 0.0) * uBurnChr.x;

        vec3 tint   = mix(vec3(0.72, 0.55, 0.40), vec3(0.14, 0.10, 0.09),
                          charT * mix(0.65, 1.0, mottle));
        vec3 scorch = col * tint + col * (mottle - 0.5) * 0.30 * charT;
        col = mix(col, scorch, clamp(charAmt, 0.0, 1.0));

        col = mix(col, nxt, blend);

        // a thin band either side of the cut blows out to ember
        float glow = smoothstep(0.0, uBurnChr.z, abs(edge));
        float mult = mix(uBurnChr.w * 0.45, uBurnChr.w,
                         0.5 + 0.5 * big * sin(uTime * 1.4 + vUv.x * 10.0));
        vec3  hot  = col * mult + vec3(1.0, 0.62, 0.26) * (1.0 - glow) * 0.55;
        col = mix(col, hot, 1.0 - glow);
        }
      }

      /* The coda sits outside everything else: by the time it is showing,
         the burn and the plate have finished their work and it simply takes
         the frame. The flat paper then takes the film the same way, so the
         next section begins on a colour that was already on screen. */
      /* THE CLOSE's front, solved before the sheet: while the burn is
         crossing, every pixel it has fully revealed (past the cut, past
         the ember's reach) ends the frame as one sample of the film — so
         for those pixels the whole paper, plan and rays chain below is
         work thrown away. The field is solved here, once, and both the
         skip and the burn itself read it. Uniform-gated, so the branch
         never diverges where it matters for derivatives. */
      float eEdge = -1.0, eAa = 0.0, eBig = 0.0, eFine = 0.0,
            eOrd = 0.0, eRnd = 0.0;
      bool eLive = uEnd > 0.0001 && uEnd < 0.999;
      if (eLive) {
        float asp = uRes.x / uRes.y;
        vec2  pix = floor(gl_FragCoord.xy / 2.0);
        vec2  quv = (pix * 2.0 + 1.0) / uRes;
        vec2  nuv = vec2(quv.x * asp, quv.y);
        eBig  = fbmQ(nuv * 0.9 + vec2(0.0, uTime * 0.02)) - 0.5;
        eFine = (hash(floor(quv * uRes / 3.0)) - 0.5)
              * mix(0.30, 0.60, 0.5 + 0.5 * sin(uTime - quv.x * 10.0));
        eOrd  = bayer4(gl_FragCoord.xy) - 0.5;
        eRnd  = hash(pix + 37.0) - 0.5;
        float th = mix(quv.y, quv.x, smoothstep(0.6, -0.4, abs(quv.x - 0.45)) * 0.5);
        th = (th * 2.0 - 1.0) / 1.2 + eBig * uEndF.x + eFine * uEndF.y;
        th = th * 0.5 + 0.5 + eOrd * uEndF.z + eRnd * uEndF.w;
        eEdge = mix(-0.35, 1.35, uEnd) - th;
        eAa = AAW(eEdge);
      }
      bool eDone = eLive && eEdge >= max(eAa, uEndC.w);

      if (uCoda > 0.0001 && uEnd < 0.999 && !eDone) {
        /* The film under the sheet is dead pixels once the paper's tone
           has fully taken the frame — sampled only while it still shows. */
        if (uFlat < 0.999) {
          vec2 cu = coverFit(vUv, uResE, uPanE, uZoomE);
          cu.y += uPanEY / uRes.y;
          col = mix(col, texture2D(uE, cu).rgb, uCoda);
        }
        /* A flat fill, deliberately. The sheet had cloudiness, fibre, tooth
           and a vignette over it, and because all of that arrived with uFlat
           there was a moment where the texture could be seen switching on
           over what had been a clean film frame. Nothing here now changes
           except the colour, so there is no moment to catch. */
        /* Not a colour filling the screen — a sheet. Four things build it and
           all of them are in the pixels rather than in a fill: pulp, laid
           fibre running one way, the tooth of the surface, and the odd dark
           inclusion left in the stock. Thick pulp is warmer and thin pulp
           cooler, which is what stops it reading as tinted grey.

           All of it mixed by uFlat, so it arrives as the colour arrives and
           there is no second moment when a treatment appears. And when the
           burn comes it has something to eat: a front travelling over
           structure reads as paper going, where over a flat field it only
           ever reads as a wipe. */
        /* Everything from here to the rays arrives multiplied by uFlat —
           for the first stretch of the coda uFlat is exactly zero, and
           the pulp, the fibre and the plan window were being computed to
           contribute nothing. One gate, same epsilon as the rays'. */
        if (uFlat > 0.001) {
        vec2  pw = vec2(vUv.x * (uRes.x / uRes.y), vUv.y);
        float pulp  = fbmQ(pw * 1.7) - 0.5;
        float fibA  = fbmQ(vec2(pw.x * 24.0, pw.y * 2.1)) - 0.5;   // along
        float fibB  = fbmQ(vec2(pw.x * 2.8,  pw.y * 38.0)) - 0.5;  // across
        float tooth = hash(floor(gl_FragCoord.xy)) - 0.5;
        float fleck = smoothstep(0.981, 1.0, hash(floor(gl_FragCoord.xy / 3.0) + 11.0));

        vec3 paper = uPaperC;
        paper *= 1.0 + pulp * uPap.x
                     + fibA * uPap.y + fibB * uPap.y * 0.55
                     + tooth * uPap.z;
        paper.b *= 1.0 - pulp * uPap.x * 1.7;      // thick stock goes warm
        paper.r *= 1.0 + pulp * uPap.x * 0.30;
        paper = mix(paper, paper * 0.70, fleck * uPap.w);
        col = mix(col, paper, uFlat);

        /* It hangs in the margin the copy leaves, turning slowly and lit
           warm, so the empty right of the sheet is a place something is
           rather than a place nothing is. Marched only for the fragments
           that could possibly be inside it — everywhere else costs one
           length() and a branch. */
        /* THE PLATE. It arrives holding the whole frame — you are looking
           at the drawing, not at a picture of one — and then draws back to
           the margin the copy leaves, which is the moment the sheet it is
           lying on becomes visible underneath. One rect, interpolated: the
           full frame at the start, the panel at the end, and the sampling
           follows it, so there is no second copy of anything. */
        /* Gated on the arrival, not on the retreat. uPlan.x is how far the
           plate has drawn back toward the margin and is 0 for the whole of
           its arrival — so this branch was skipped for exactly the stretch
           the plate was supposed to be filling the screen, and all the
           reader saw was blank sheet. */
        if (uPlan2.x > 0.001) {
          float z = uPlan.x;                       // 0 full frame, 1 in the margin
          vec2  cN = mix(vec2(0.5, 0.5), vec2(uPlan.y, uPlan.z), z);
          float sN = mix(1.0, uPlan.w, z);
          /* The window is the viewport while the plate holds the frame, and
             only squares up as it retreats to the margin. Held square the
             whole way, its full-frame rect was as tall as the screen is wide
             — so on any wide screen you were reading the middle band of a
             cover-fit into that, which cropped the drawing twice over and is
             why the first frame sat closer in than the plate itself does. */
          vec2  hN = vec2(sN * 0.5, sN * 0.5 * mix(1.0, uRes.x / uRes.y, z));
          vec2  pu = (vUv - cN) / (hN * 2.0) + 0.5;
          /* It opens from the middle rather than cutting in. The same
             chaotic ring the film uses at the top of the page: an fbm-lobed
             front growing out of the centre, so the plate arrives the way
             everything else on this page arrives — through a torn edge that
             belongs to the same hand. */
          /* It soaks in from the middle. A clean ring cut the plate out of
             the sheet with a compass; a front that is a radius bitten by two
             scales of noise arrives in patches that spread and join, which is
             how ink takes to paper — and it is the same gesture the copy on
             this page arrives with. */
          float open = 1.0;
          if (uPlan2.x < 0.999) {
            vec2  rr  = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
            float rad = length(rr) / 1.30;
            float n   = fbm(vUv * 3.4 + 7.0) * 0.60
                      + fbm(vUv * 9.5 - 3.0) * 0.34;
            // biased so the middle is already open on the first frame of the
            // arrival: unbiased, half the road was spent before anything showed
            float f   = uPlan2.x * 1.62 - rad - (n - 0.47) * 0.62 + 0.12;
            open = smoothstep(-0.055, 0.065, f);
          }
          if (open > 0.001 && pu.x > -0.12 && pu.x < 1.12 && pu.y > -0.12 && pu.y < 1.12) {
            // cover-fit inside the rect, so the plate is never distorted
            float ra = (hN.x * uRes.x) / (hN.y * uRes.y);
            float ia = uResP.x / uResP.y;
            vec2  su = pu;
            if (ra > ia) su.y = (su.y - 0.5) * (ia / ra) + 0.5;
            else         su.x = (su.x - 0.5) * (ra / ia) + 0.5;
            /* The picture is zoomed inside the cutout, not with it. Scaling
               the window moved the torn edge along with the drawing, which is
               not a zoom at all — it is a bigger hole. This reads a smaller
               piece of the frame into the same hole, so the mask below, which
               is measured off pu, never notices. */
            su = (su - 0.5 - vec2(uPlan3.y, uPlan3.z)) / max(uPlan3.x, 0.05) + 0.5;
            vec3 pl = texture2D(uP, clamp(su, 0.0, 1.0)).rgb;
            /* The edge is brushed, not cut. A square window on a sheet of
               paper reads as a video element dropped on top of it; a border
               that is eaten away by the same kind of noise the burn uses
               reads as something washed onto the page. Two scales of it —
               a broad tear and a finer fray — and the whole edge falls off
               over a wide band rather than at a line. */
            vec2  ee = min(pu, 1.0 - pu);
            float e0 = min(ee.x, ee.y * (uRes.y / uRes.x) * (hN.y / hN.x));
            vec2  bn = vec2(pu.x * 3.0, pu.y * 4.0);
            float bite = (fbmQ(bn * 2.2 + 4.0) - 0.5) * 0.085
                       + (fbmQ(bn * 7.5 - 2.0) - 0.5) * 0.035;
            float mask = smoothstep(0.0, 0.075, e0 + bite);
            // and it thins toward the edge rather than stopping dead
            mask *= mask;
            col = mix(col, pl, uFlat * mask * open);
          }
        }
        }
        /* The sheet is lit, and something is moving between it and the sun.
           Everything here is a number the panel owns: how fast the whole
           thing runs, how far the pattern travels, how much it jitters, how
           big the patches are, how deep they cut, how much the thresholds
           breathe, the rake across the sheet and the swing in its contrast.
           All sines — no texture, so nothing can be seen switching on. */
        if (uFlat > 0.001) {
          float T = uTime * uRay1.x;
          vec2  jig = vec2(sin(T * 1.63) * 0.013 + sin(T * 0.91 + 1.1) * 0.021,
                           cos(T * 1.27 + 0.4) * 0.015 + sin(T * 0.58) * 0.019) * uRay1.z;
          vec2  q = vUv * vec2(uRes.x / uRes.y, 1.0) * uRay1.w
                  + vec2(T * 0.026, T * 0.015) * uRay1.y + jig;
          float dap = sin(q.x * 3.1 + sin(q.y * 2.3 + T * 0.31) * 1.8)
                    + sin(q.y * 2.7 + sin(q.x * 1.9 - T * 0.24) * 1.4);
          float lo = 0.25 + 0.13 * sin(T * 0.53) * uRay2.y;
          float hi = 1.85 + 0.20 * sin(T * 0.37 + 2.0) * uRay2.y;
          dap = smoothstep(lo, hi, dap);
          float rake = (vUv.x * 0.62 + vUv.y * 0.38) - 0.5;
          vec3  lit = col * (1.0 + rake * uRay2.z - dap * uRay2.x);
          /* A sixth of the sheet's value was swinging in and out on a slow
             sine, which on a flat colour reads as the screen dimming rather
             than as light moving. Kept to a few percent. */
          float cyc = 1.0 + uRay2.w * (0.022 * sin(T * 0.42) + 0.012 * sin(T * 0.19 + 2.1));
          lit = (lit - 0.62) * cyc + 0.62;
          col = mix(col, lit, uFlat);
        }      }

      /* ------------------------------------------------------------------
         THE CLOSE — the beige is burnt away and there is plain black behind
         it, which is the next section's ground. The wipe is the one from the
         burn page rather than the tear's radial front: a diagonal bent by
         its own curve, torn by two decorrelated fields, stippled by ordered
         and hashed dither, scorched on the side about to go and blown out to
         ember along the cut. */
      if (uEnd > 0.0001) {
        /* The front fully through, the reveal is the whole frame: the lag
           has decayed, the ember is out, and the wipe resolves to one
           sample of the film — which is all the questions and the rise
           ever needed from this block. */
        if (uEnd >= 0.999) {
          col = texture2D(uG, coverPan(vUv, uResG, uPanPx + uPanG)).rgb;
        } else if (eDone) {
          /* Fully revealed: the whole path below resolves to one lagged
             sample of the film — char is zero past the cut, the darken is
             gated to the other side, and the ember's glow term has died.
             The same pixels, without the ceremony. */
          float lag = exp(-abs(eEdge) / max(uDrag.y, 0.001));
          vec2  tuv = coverPan(vUv, uResG, uPanPx + uPanG);
          tuv.y -= lag * uDrag.x;
          tuv.x += lag * uDrag.x * 0.18;
          col = texture2D(uG, tuv).rgb;
        } else {
        // the field was solved above the sheet, where the skip reads it
        float big = eBig, fine = eFine, ord = eOrd, rnd = eRnd;
        float edge  = eEdge;
        float aa    = eAa;
        float blend = smoothstep(-aa, aa, edge);

        /* The scorch is a band that travels with the front, not everything
           behind it. The depth term saturates a little way back, so left as
           it was the whole frame charred the instant the burn began and the
           beige turned to noise in one step. The second term lets it go
           again further back, where the wipe has already taken the frame to
           black anyway. The pass also eases in over the first of the travel,
           so there is no edge to the effect starting. */
        float ease    = smoothstep(0.0, 0.07, uEnd);
        float charT   = clamp(-edge / uEndC.x, 0.0, 1.0)
                      * clamp(1.0 + edge / (uEndC.x * uEndC.y), 0.0, 1.0);
        float mottle  = clamp(0.5 + fine * 2.2 + big * 0.35, 0.0, 1.0);
        // named covr, not cover: a local of that name shadows the cover-fit
        // function from its declaration on, and the reveal below calls it
        float covr    = smoothstep(0.0, 1.0, charT) * mix(0.55, 1.15, mottle);
        float stipple = step(0.5 + ord * 1.6 + rnd * 0.9, covr * 1.25);
        /* The stipple has to be gated on there being any coverage to stipple.
           step(a, b) is 1 whenever b >= a, and with ord and rnd both able to
           reach -0.5 the threshold goes negative on a scatter of pixels — so
           stipple fired at 1 even where charT, and therefore covr, was 0.
           Everything ahead of the front is edge < 0, so those pixels charred
           across the whole sheet the instant the burn began: the speckle that
           appeared the moment you scrolled. Gated here, the scorch exists only
           inside its own band. */
        float charAmt = mix(covr, stipple, 0.72)
                      * step(edge, 0.0) * step(0.0005, charT) * uEndC.z * ease;
        vec3  tint    = mix(vec3(0.72, 0.55, 0.40), vec3(0.14, 0.10, 0.09),
                            charT * mix(0.65, 1.0, mottle));
        col = mix(col, col * tint + col * (mottle - 0.5) * 0.30 * charT,
                  clamp(charAmt, 0.0, 1.0));

        /* The world behind arrives moving, and moving the way the burn is.
           Right at the cut it is still offset to the right — it has not
           caught up with the edge that uncovered it — and it settles as the
           front leaves it behind. So the reveal reads as the new picture
           being drawn in leftward rather than as a static image under a
           hole. The lag is 1 at the cut and gone a little way past it. */
        /* Measured from the cut in both directions. It used to be
           exp(-max(edge,0)/d), and everything ahead of the front has
           edge < 0 — so max() pinned it at 1 and the darkening below was
           applied to the entire sheet the instant the burn began. That is
           the dim that appeared the moment the plate settled. */
        float lag = exp(-abs(edge) / max(uDrag.y, 0.001));
        vec2  tuv = coverPan(vUv, uResG, uPanPx + uPanG);
        tuv.y -= lag * uDrag.x;
        tuv.x += lag * uDrag.x * 0.18;
        vec3  nxtG = texture2D(uG, tuv).rgb;
        // and the sheet darkens as it is dragged off, so both sides of the
        // cut agree on which way the world is going
        col = mix(col, col * (1.0 - lag * uDrag.z * 0.45), step(edge, 0.0));
        col = mix(col, nxtG, blend);

        float glow = smoothstep(0.0, uEndC.w, abs(edge));
        float mult = mix(2.2, 5.0, 0.5 + 0.5 * big * sin(uTime * 1.4 + vUv.x * 10.0));
        col = mix(col, col * mult + vec3(1.0, 0.62, 0.26) * (1.0 - glow) * 0.55,
                  (1.0 - glow) * ease);
        }
      }

      /* The renaissance scrim, baked. It lived as a full-viewport DOM
         layer of #595551 at hard-light — which, with every channel of
         the blend colour at or under one half, is exactly a per-channel
         multiply by 2·Cs, faded by its opacity. Same math, same sRGB
         domain, no compositing group over a canvas that repaints every
         frame for the last two thirds of the road. */
      col *= mix(vec3(1.0), vec3(0.698039, 0.666667, 0.635294), uScrim);
      gl_FragColor = vec4(col, 1.0);
    }