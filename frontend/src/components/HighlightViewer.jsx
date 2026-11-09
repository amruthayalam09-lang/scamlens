import React from 'react';
import { TerminalIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

/**
 * Renders the analyzed text in a clean white card with exact suspicious phrases highlighted.
 */
export default function HighlightViewer({ text, matches = [] }) {
  if (!text) return null;

  if (!matches || matches.length === 0) {
    return (
      <div className="result-white-card">
        <div className="result-card-header">
          <div className="card-header-title-wrap">
            <h4 className="result-card-heading">Analyzed Message Text</h4>
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
    <div className="result-white-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <h4 className="result-card-heading">Visual Phrase Breakdown</h4>
          <p className="result-card-subheading">
            Suspicious triggers and psychological pressure phrases are highlighted below
          </p>
        </div>
        <span className="count-pill-badge">
          {nonOverlapping.length} phrase{nonOverlapping.length === 1 ? '' : 's'} flagged
        </span>
      </div>

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
    </div>
  );
}
