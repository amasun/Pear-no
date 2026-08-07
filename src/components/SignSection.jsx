import React from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

const signaturePaths = [
  { d: 'm 0,0 c 0.8998,-1.65154,2.121,-3.29839,3.3735,-5.1263,-0.2787,0.96871,-1.1734,1.00844,-0.2198,5.15939,0.4113,1.79038,-0.5215,6.68874,-4.6089,3.67108,3.1181,2.66904,5.8064,0.17923,8.4005,-3.43958', transform: 'translate(1.455 -5.254)', length: 30.346, a: 0, b: 0.1027 },
  { d: 'm 0,0 c 0,0,-4.8682,5.76765,-2.7782,7.34219,1.5603,1.17547,4.6964,-3.50573,4.6964,-3.50573', transform: 'translate(11.699 -8.694)', length: 14.7218, a: 0.1027, b: 0.1526 },
  { d: 'm 0,0 c 0.3633,-0.0304,0.4348,-0.30446,0.3157,-0.57296,-0.1562,-0.35196,-0.6165,-0.38945,-0.7951,-0.0117,-0.1647,0.34829,0.089,0.6173,0.4794,0.58463 z', transform: 'translate(13.564 -10.621)', length: 2.774, a: 0.1526, b: 0.1619 },
  { d: 'm 0,0 c 0.1355,-1.79073,-5.8898,-2.14856,-7.9513,2.05798,-3.8317,7.81871,4.153,5.14364,5.5971,2.69243', transform: 'translate(23.476 -7.671)', length: 21.9077, a: 0.1619, b: 0.2361 },
  { d: 'm 0,0 c -1.1619,-0.25254,-8.6588,20.79796,-12.722,19.17658,-1.5259,-0.60889,-0.7548,-2.64348,0.2135,-4.07912,1.7572,-2.60534,12.9435,-8.17985,14.3794,-11.26214', transform: 'translate(24.318 -8.84)', length: 46.8325, a: 0.2361, b: 0.3945 },
  { d: 'm 0,0 c 0,0,2.639,-5.27928,3.8696,-4.26641,2.2794,1.87613,-3.6711,8.89662,-3.6711,8.89662,0.8673,0.0578,5.7877,-10.21518,8.8635,-8.23516,2.4603,1.58379,-4.2138,6.92561,-1.6867,8.40053,2.1168,1.23542,5.2255,-4.76251,5.2255,-4.76251', transform: 'translate(26.188 -5.089)', length: 46.3456, a: 0.3945, b: 0.5514 },
  { d: 'm 0,0 c 0,0,-4.8682,5.76765,-2.7782,7.34219,1.5603,1.17547,4.6964,-3.50573,4.6964,-3.50573', transform: 'translate(42.087 -8.694)', length: 14.7218, a: 0.5514, b: 0.6012 },
  { d: 'm 0,0 c 0.3633,-0.0304,0.4348,-0.30446,0.3157,-0.57296,-0.1562,-0.35196,-0.6165,-0.38945,-0.7951,-0.0117,-0.1647,0.34829,0.089,0.6173,0.4794,0.58463 z', transform: 'translate(43.953 -10.621)', length: 2.774, a: 0.6012, b: 0.6106 },
  { d: 'm 0,0 c 0,0,2.639,-5.27928,3.8696,-4.26641,2.2794,1.87613,-3.6711,8.89662,-3.6711,8.89662,0.8673,0.0578,5.7877,-10.21518,8.8635,-8.23516,2.4603,1.58379,-4.2138,6.92561,-1.6867,8.40053,2.1168,1.23542,5.2255,-4.76251,5.2255,-4.76251', transform: 'translate(44.321 -5.089)', length: 46.3456, a: 0.6106, b: 0.7674 },
  { d: 'm 0,0 c 0.1355,-1.79073,-5.8898,-2.14856,-7.9513,2.05798,-3.8317,7.81871,4.153,5.14364,5.5971,2.69243', transform: 'translate(66.465 -7.671)', length: 21.9077, a: 0.7674, b: 0.8415 },
  { d: 'm 0,0 c -1.1619,-0.25254,-8.6588,20.79796,-12.722,19.17658,-1.5259,-0.60889,-0.7548,-2.64348,0.2135,-4.07912,1.7572,-2.60534,12.9435,-8.17985,14.3794,-11.26214', transform: 'translate(67.307 -8.84)', length: 46.8325, a: 0.8415, b: 1 }
];

export default function SignSection({ scrollProgress = 0 }) {
  const road = scrollProgress * 5350;
  const treeProgress = clamp((road - 2775) / 525);
  const signProgress = clamp((treeProgress - 0.62) / 0.38);
  const signatureDraw = smooth((signProgress - 0.2) / 0.62);
  const faqFade = 1 - smooth((road - 3300) / 600);

  return (
    <div
      className="sign"
      aria-hidden="true"
      style={{
        transform: 'translate(0px, 0px) scale(1)',
        opacity: signProgress > 0 ? faqFade : 0
      }}
    >
      <p>
        <span className="sg-a" style={{ opacity: smooth(signProgress / 0.22) }}>
          Asked before{' '}
        </span>
        <span className="sg-b" style={{ opacity: signatureDraw > 0 ? 1 : 0 }}>
          <svg className="sg-svg" viewBox="-0.900 -12.374 70.978 23.698" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {signaturePaths.map((path, index) => {
              const pathProgress = clamp((signatureDraw - path.a) / (path.b - path.a));
              return (
                <path
                  key={`${path.transform}-${index}`}
                  d={path.d}
                  transform={path.transform}
                  style={{
                    strokeDasharray: path.length,
                    strokeDashoffset: path.length * (1 - pathProgress),
                    opacity: pathProgress > 0 ? 1 : 0
                  }}
                />
              );
            })}
          </svg>
        </span>
      </p>
    </div>
  );
}
