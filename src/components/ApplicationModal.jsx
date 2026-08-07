import React, { useState } from 'react';

export default function ApplicationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', grow: '' });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="cf live" style={{ opacity: 1, perspective: '1700px' }}>
      <svg className="cf-orb" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 1 }}>
        <ellipse cx="50%" cy="50%" rx="45%" ry="35%" />
        <ellipse cx="50%" cy="50%" rx="35%" ry="25%" />
        <ellipse cx="50%" cy="50%" rx="25%" ry="15%" />
      </svg>

      <div className="cf-gl" style={{ opacity: 1 }}>
        <i style={{ '--dur': '1.90s', '--dl': '0.00s' }} />
        <i style={{ '--dur': '2.32s', '--dl': '-0.53s' }} />
        <i style={{ '--dur': '2.74s', '--dl': '-1.06s' }} />
        <i style={{ '--dur': '3.16s', '--dl': '-1.59s' }} />
        <i style={{ '--dur': '3.58s', '--dl': '-2.12s' }} />
        <i style={{ '--dur': '4.00s', '--dl': '-2.65s' }} />
      </div>

      <div className="cf-lead" style={{ opacity: 1, transform: 'translateY(0px)' }}>
        <b>The application</b>
        <p>
          Tell us what you sell and where you want to grow. Every application is read, and when the model fits we answer within a week.
        </p>
      </div>

      <div
        className="cf-in"
        style={{
          transform: 'translate(-257.5px, -159.8px) scale(1.05) rotateX(8deg) rotateY(15deg)',
          transition: 'transform 0.5s ease-out'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '30px',
            right: '30px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ position: 'absolute', top: '220px', left: '350px', color: '#fff', fontSize: '24px', fontFamily: 'var(--title)' }}>
            Application received. We will respond within a week.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              className="cf-f pill"
              style={{
                left: '352px',
                top: '148px',
                width: '236px',
                height: '62px',
                opacity: 1,
                '--blur': '9.5px',
                '--fill': '0.1',
                '--rim': '0.41'
              }}
            >
              <span className="rim" />
              <span className="rim2" />
              <span className="ic">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0" />
                </svg>
              </span>
              <input
                data-k="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div
              className="cf-f pill"
              style={{
                left: '612px',
                top: '148px',
                width: '236px',
                height: '62px',
                opacity: 1,
                '--blur': '9.5px',
                '--fill': '0.1',
                '--rim': '0.41'
              }}
            >
              <span className="rim" />
              <span className="rim2" />
              <span className="ic">
                <svg viewBox="0 0 24 24">
                  <path d="M2.5 6.5h19v11h-19zM2.5 7l9.5 6.5L21.5 7" />
                </svg>
              </span>
              <input
                data-k="email"
                type="email"
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div
              className="cf-f"
              style={{
                left: '352px',
                top: '226px',
                width: '496px',
                height: '226px',
                opacity: 1,
                '--blur': '9.5px',
                '--fill': '0.1',
                '--rim': '0.41'
              }}
            >
              <span className="rim" />
              <span className="rim2" />
              <span className="ic">
                <svg viewBox="0 0 24 24">
                  <path d="M3 5.5h18v11H9l-5 4v-4H3z" />
                </svg>
              </span>
              <textarea
                data-k="grow"
                rows={4}
                placeholder="What do you want to grow?"
                value={formData.grow}
                onChange={(e) => setFormData({ ...formData, grow: e.target.value })}
                required
              />
            </div>

            <button
              className="cf-cta"
              type="submit"
              style={{
                left: '352px',
                top: '486px',
                width: '262px',
                height: '48px',
                opacity: 1,
                cursor: 'pointer'
              }}
            >
              Send the application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
