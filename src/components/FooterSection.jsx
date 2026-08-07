import React from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const outQuart = (value) => 1 - (1 - clamp(value)) ** 4;

export default function FooterSection({ scrollProgress = 0 }) {
  const road = scrollProgress * 5350;
  const transition = clamp((road - 4650) / 700);
  const footerProgress = clamp((transition - 0.62 * 0.3) / (1 - 0.62 * 0.3));
  const isVisible = footerProgress > 0;
  const shaderProgress = clamp((transition - 0.74) / 0.18);
  const ruleProgress = (index) => smooth((footerProgress - index * 0.04) / 0.26);
  const detailOpacity = (index) => smooth((footerProgress - 0.14 - index * 0.045) / 0.26);
  const boxProgress = smooth((footerProgress - 0.1) / 0.42);
  const tagLineProgress = (index) => outQuart((footerProgress - 0.2 - index * 0.075) / 0.34);
  const width = typeof window === 'undefined' ? 1920 : window.innerWidth;
  const height = typeof window === 'undefined' ? 1080 : window.innerHeight;
  const footerScale = Math.min(width / 1920, height / 1080) * (width <= 720 ? 3 : 1);

  return (
    <>
      <video
        className="foot"
        src="/films/footer-loop.mp4"
        loop
        playsInline
        muted
        preload="auto"
        style={{ opacity: shaderProgress >= 1 ? 1 : 0, transition: 'none' }}
      />
      <div className={`ft ${isVisible ? 'ft-on' : ''}`} style={{ opacity: isVisible ? 1 : 0, transition: 'none' }}>
        <div className="ft-in" style={{ transform: `scale(${footerScale.toFixed(5)})` }}>
          <i className="ft-r h" style={{ top: '125px', transform: `scaleX(${ruleProgress(0)})` }} />
          <i className="ft-r h" style={{ top: '982px', transform: `scaleX(${ruleProgress(1)})` }} />
          <i className="ft-r v" style={{ left: '675px', transform: `scaleY(${ruleProgress(2)})` }} />
          <i className="ft-r v" style={{ left: '1262px', transform: `scaleY(${ruleProgress(3)})` }} />

          <svg className="ft-box" viewBox="0 0 587 857" fill="none">
            <rect x="0.5" y="0.5" width="586" height="856" style={{ strokeDasharray: '2884', strokeDashoffset: 2884 * (1 - boxProgress) }} />
          </svg>

          <i className="ft-st" style={{ left: '675px', top: '125px', opacity: detailOpacity(0) }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z" />
            </svg>
          </i>
          <i className="ft-st" style={{ left: '1262px', top: '982px', opacity: detailOpacity(1) }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z" />
            </svg>
          </i>

          <div className="ft-mark" style={{ opacity: detailOpacity(2) }}>
            <svg viewBox="0 0 524.211 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M496.175 94.1679C513.597 91.6249 528.131 103.956 523.257 122.14C516.926 145.755 476.449 142.036 479.235 112.85C480.058 104.173 487.515 95.4202 496.175 94.1679Z" fill="#EBEBEB" />
                <path d="M35.0131 19.7672C35.0004 20.0614 33.3707 20.8803 35.3314 20.7267C53.4873 -3.95308 89.1624 -5.01499 111.698 14.3425C145.502 43.3723 142.115 108.059 103.066 131.012C81.3831 143.768 50.0878 141.119 35.3187 119.228C33.3707 119.075 35.0004 119.919 35.0004 120.188V180H0V4.0944H35.0131C34.8348 9.3016 35.255 14.56 35.0131 19.7672ZM62.8962 32.4333C24.6237 36.553 23.8726 103.991 64.7042 107.01C111.915 110.503 112.004 27.1494 62.8962 32.4333Z" fill="#EBEBEB" />
                <path d="M177.005 80.3756C178.859 92.877 188.675 105.009 201.133 108.121C217.896 112.305 234.342 106.182 241.491 89.9175C244.717 91.7289 269.849 102.151 269.658 104.179C269.519 105.608 262.598 115.66 261.163 117.37C243.739 138.086 212.537 143.903 187.329 136.033C134.246 119.449 128.062 39.5927 173.017 10.3291C195.736 -4.46853 233.453 -3.75416 253.861 14.9853C271.525 31.1989 274.827 57.5285 272.897 80.3756H177.005ZM178.275 55.5002H240.818C241.428 55.0155 241.555 54.9644 241.53 54.1863C241.479 52.7448 239.46 47.6804 238.71 46.1369C225.719 19.7307 183.189 26.951 178.275 55.5002Z" fill="#EBEBEB" />
                <path d="M453.603 135.341H418.645V4.69977H453.603C453.502 9.04598 453.743 13.4304 453.629 17.7894C453.616 18.312 452.141 24.6082 454.226 22.5434C454.328 22.4542 454.671 20.8228 455.218 20.0453C460.112 13.15 470.345 4.0625 479.333 4.0625H490.774L491.727 5.01841V35.6076L490.774 36.5635H475.519C465.197 36.5635 453.591 52.1639 453.591 61.7358V135.341H453.603Z" fill="#EBEBEB" />
                <path d="M403.76 134.164C402.782 137.224 390.593 136.776 387.815 136.483C363.711 133.871 355.025 102.33 345.203 84.2014C320.258 85.7219 309.87 111.473 315.172 133.676H285.492L284.181 132.078C278.86 99.5624 298.307 65.8774 330.765 57.7875C325.13 39.444 314.741 23.5567 292.79 31.5101C295.431 24.122 295.137 10.5739 297.857 4.00458C299.931 -1.00528 318.576 1.23649 323.173 2.60104C334.795 6.07091 342.914 16.6365 348.784 26.6367C361.129 47.7483 369.757 72.5442 381.652 94.0067C386.465 102.701 390.671 110.264 402.351 106.678L403.76 107.906V134.183V134.164Z" fill="#EBEBEB" />
              </g>
            </svg>
          </div>

          <p className="ft-tag" style={{ opacity: detailOpacity(3) }}>
            <span className="ln"><i style={{ transform: `translateY(${(1 - tagLineProgress(0)) * 120}%)` }}>Not an agency on the clock, a</i></span>
            <span className="ln"><i style={{ transform: `translateY(${(1 - tagLineProgress(1)) * 120}%)` }}>partner in the upside.</i></span>
          </p>

          <p className="ft-meta l" style={{ opacity: detailOpacity(4) }}>PEAR AS · ORG NR 919 062 517 · OSLO</p>
          <p className="ft-meta r" style={{ opacity: detailOpacity(5) }}>
            <a href="mailto:info@pear.no">INFO@PEAR.NO</a>
          </p>
        </div>
      </div>
    </>
  );
}
