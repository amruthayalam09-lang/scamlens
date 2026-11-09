import React from 'react';
import { TerminalIcon, AlertTriangleIcon } from './Icons';

/**
 * Renders the analyzed text in a cybersecurity terminal view with exact suspicious phrases highlighted.
 */
export default function HighlightViewer({ text, matches = [] }) {
  if (!text) return null;

  if (!matches || matches.length === 0) {
    return (
      <div className="dashboard-section-card">
        <div className="section-card-header">
          <div className="section-header-title">
            <TerminalIcon size={18} className="section-icon" />
            <h3 className="section-title">Analyzed Message Text Payload</h3>
          </div>
          <span className="section-header-badge clean">Zero Indicators Flagged</span>
        </div>
        <div className="terminal-highlight-viewer clean">
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

  // Remaining trailing text
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(currentIndex),
      key: `txt-${currentIndex}`
    });
  }

  return (
    <div className="dashboard-section-card">
      <div className="section-card-header">
        <div className="section-header-title">
          <TerminalIcon size={18} className="section-icon" />
          <h3 className="section-title">Detected Attack Vectors in Text</h3>
        </div>
        <span className="section-header-hint">
          Hover over highlighted phrases to view category explanations
        </span>
      </div>

      <div className="terminal-highlight-viewer">
        {segments.map((seg) => {
          if (seg.type === 'highlight') {
            const isHigh = seg.match.severity === 'high';
            return (
              <mark
                key={seg.key}
                className={`cyber-mark ${isHigh ? 'severity-high' : 'severity-medium'}`}
                title={`[${seg.match.categoryLabel}] ${seg.match.explanation}`}
              >
                <span className="mark-content">{seg.content}</span>
                <span className="mark-badge">{seg.match.categoryLabel}</span>
              </mark>
            );
          }
          return <span key={seg.key}>{seg.content}</span>;
        })}
      </div>
    </div>
  );
}
