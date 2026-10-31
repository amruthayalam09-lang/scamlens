import React from 'react';

/**
 * Renders the analyzed text with exact suspicious phrases highlighted.
 */
export default function HighlightViewer({ text, matches = [] }) {
  if (!text) return null;

  if (!matches || matches.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📝 Analyzed Message Text</h3>
        </div>
        <div className="highlight-viewer">
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📝 Detected Warning Phrases in Text</h3>
        <span className="highlight-hint">
          Hover over highlighted words to see scam category
        </span>
      </div>

      <div className="highlight-viewer">
        {segments.map((seg) => {
          if (seg.type === 'highlight') {
            return (
              <mark
                key={seg.key}
                className={`mark-suspicious ${seg.match.severity === 'high' ? 'high' : 'medium'}`}
                title={`[${seg.match.categoryLabel}] ${seg.match.explanation}`}
              >
                {seg.content}
              </mark>
            );
          }
          return <span key={seg.key}>{seg.content}</span>;
        })}
      </div>
    </div>
  );
}
