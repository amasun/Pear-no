import React from 'react';
import './LoadingState.css';

export default function LoadingState({ ready = false, error = false, phase = '', onRetry }) {
  if (ready && !error && !phase) return null;
  const isPhaseLoading = Boolean(phase) && !error;

  return (
    <div className={`loading-state${error ? ' is-error' : ''}${isPhaseLoading ? ' is-phase' : ''}`} role={error ? 'alert' : 'status'} aria-live="polite">
      <div className="loading-state__rule" aria-hidden="true">
        <i />
      </div>
      <div className="loading-state__copy">
        <span className="loading-state__label">{error ? 'VISUAL SYSTEM UNAVAILABLE' : phase || 'LOADING VISUAL SYSTEM'}</span>
        <span className="loading-state__detail">
          {error ? 'The opening image could not be prepared.' : phase ? 'Preparing the next visual sequence.' : 'Preparing the opening sequence.'}
        </span>
      </div>
      {error && (
        <button type="button" className="loading-state__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
