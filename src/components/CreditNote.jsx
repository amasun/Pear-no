import React from 'react';
import './CreditNote.css';

export default function CreditNote() {
  return (
    <aside className="credit-note" aria-label="Project credit">
      <span>Recreated by Artgineer</span>
      <span className="credit-note__links" aria-label="External links">
        <a href="https://github.com/amasun?tab=repositories" target="_blank" rel="noreferrer" aria-label="Artgineer on GitHub">GitHub</a>
        <i aria-hidden="true">/</i>
        <a href="https://www.xiaohongshu.com/user/profile/5c094b50f7e8b948da476607" target="_blank" rel="noreferrer" aria-label="Artgineer on Xiaohongshu">Xiaohongshu</a>
      </span>
    </aside>
  );
}
