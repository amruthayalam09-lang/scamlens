import React from 'react';
import { CheckCircleIcon, ZapIcon, AlertTriangleIcon, InfoIcon } from './Icons';

/**
 * Card 2: Suspicious Phrases Card
 * Renders the analyzed message with visually highlighted phrases,
 * followed by a detailed Phrase Meaning Breakdown explaining what each phrase means in simple English.
 */
export default function HighlightViewer({ text, matches = [] }) {
  if (!text) return null;

  if (!matches || matches.length === 0) {
    return (
      <div className="result-white-card xai-phrase-card">
        <div className="result-card-header">
          <div className="card-header-title-wrap">
            <span className="xai-tag-pill purple">
              <ZapIcon size={13} />
              <span>Card 2: Suspicious Phrases</span>
            </span>
            <h4 className="result-card-heading">Visual Phrase Breakdown</h4>
          </div>
          <span className="clean-status-tag">
            <CheckCircleIcon size={14} />
            <span>Zero Suspicious Phrases Flagged</span>
          </span>
        </div>
        <div className="highlighted-text-container clean-text">
          {text}
        </div>
      </div>
    );
  }

  // Sort matches by startIndex to slice text cleanly
  const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

  // Filter overlapping matches
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const m of sortedMatches) {
    if (m.startIndex >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.endIndex;
    }
  }

  const segments = [];
  let currentIndex = 0;

  nonOverlapping.forEach((match) => {
    // Text before the match
    if (match.startIndex > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, match.startIndex),
        key: `txt-${currentIndex}`
      });
    }

    // Highlighted phrase
    segments.push({
      type: 'highlight',
      content: text.slice(match.startIndex, match.endIndex),
      match: match,
      key: `hl-${match.startIndex}`
    });

    currentIndex = match.endIndex;
  });

  // Remaining text after last match
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(currentIndex),
      key: `txt-${currentIndex}`
    });
  }

  return (
    <div className="result-white-card xai-phrase-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <span className="xai-tag-pill purple">
            <ZapIcon size={13} />
            <span>Card 2: Suspicious Phrases</span>
          </span>
          <h4 className="result-card-heading">Highlighted Text & Phrase Breakdown</h4>
          <p className="result-card-subheading">
            Specific phrases exhibiting psychological manipulation or fraudulent intent
          </p>
        </div>
        <span className="count-pill-badge">
          {nonOverlapping.length} phrase{nonOverlapping.length === 1 ? '' : 's'} flagged
        </span>
      </div>

      {/* Visual In-Situ Highlight Viewer */}
      <div className="highlighted-text-container">
        {segments.map((seg) => {
          if (seg.type === 'text') {
            return <span key={seg.key}>{seg.content}</span>;
          }

          const severityClass = seg.match.severity === 'high' ? 'high-risk-highlight' : 'medium-risk-highlight';

          return (
            <mark
              key={seg.key}
              className={`saas-mark ${severityClass}`}
              title={`[${seg.match.categoryLabel}] ${seg.match.explanation}`}
            >
              {seg.content}
              <span className="mark-badge-tag">{seg.match.categoryLabel}</span>
            </mark>
          );
        })}
      </div>

      {/* Phrase Meaning Breakdown Glossary */}
      <div className="xai-glossary-section">
        <div className="xai-glossary-header">
          <InfoIcon size={15} className="text-purple" />
          <h5 className="xai-glossary-title">Plain-English Meaning of Detected Phrases</h5>
        </div>

        <div className="xai-glossary-list">
          {nonOverlapping.map((m, idx) => {
            const isHigh = m.severity === 'high';
            return (
              <div key={idx} className="xai-glossary-item">
                <div className="xai-glossary-item-top">
                  <div className="xai-glossary-phrase-wrap">
                    <span className={`xai-glossary-dot ${isHigh ? 'red' : 'amber'}`}></span>
                    <strong className="xai-glossary-phrase">"{m.phrase}"</strong>
                  </div>
                  <span className={`xai-glossary-cat-badge ${isHigh ? 'red' : 'amber'}`}>
                    {m.categoryLabel}
                  </span>
                </div>

                <p className="xai-glossary-meaning">
                  <span className="meaning-prefix">Why this is used:</span> {m.explanation}
                </p>

                {m.recommendation && (
                  <p className="xai-glossary-advice">
                    <span className="advice-prefix">Defense:</span> {m.recommendation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
