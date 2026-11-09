import React, { useState } from 'react';
import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  LockIcon,
  ZapIcon,
  GlobeIcon,
  SparklesIcon,
  CheckCircleIcon,
  FileTextIcon
} from './Icons';

/**
 * Card 4: Categorized Warning Signs Card
 * Categorizes warning signs into 6 standardized categories:
 * - Urgent payment requests
 * - Requests for OTP
 * - Unrealistic rewards
 * - Threatening language
 * - Suspicious links
 * - Requests for personal information
 *
 * Explicitly separates Factual Pattern Evidence from AI Analytical Interpretation.
 */
export default function WarningSignsCard({ warningSigns = [] }) {
  const [filter, setFilter] = useState('all');

  if (!warningSigns || warningSigns.length === 0) {
    return (
      <div className="result-white-card xai-warning-card">
        <div className="result-card-header">
          <div className="card-header-title-wrap">
            <span className="xai-tag-pill purple">
              <ZapIcon size={13} />
              <span>Card 4: Categorized Warning Signs</span>
            </span>
            <h4 className="result-card-heading">Standard Warning Signs</h4>
            <p className="result-card-subheading">
              Evaluated across 6 critical fraud indicators
            </p>
          </div>
          <span className="clean-status-tag">
            <CheckCircleIcon size={14} />
            <span>0 Warning Signs Identified</span>
          </span>
        </div>
        <div className="reassurance-card inline-reassurance">
          <div className="reassurance-icon">
            <CheckCircleIcon size={22} />
          </div>
          <div className="reassurance-text">
            <h4>No Deceptive Warning Signs Found</h4>
            <p>
              ScamLens did not find urgent payment requests, OTP demands, unrealistic rewards, threatening language, suspicious links, or personal data requests in this payload.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Count by source
  const factualCount = warningSigns.filter(w => w.source?.includes('Factual')).length;
  const aiCount = warningSigns.filter(w => w.source?.includes('AI')).length;

  const filteredSigns = filter === 'all'
    ? warningSigns
    : filter === 'factual'
      ? warningSigns.filter(w => w.source?.includes('Factual'))
      : warningSigns.filter(w => w.source?.includes('AI'));

  const getCategoryMeta = (standardCategory, label) => {
    switch (standardCategory) {
      case 'urgent_payment':
        return {
          title: 'Urgent Payment Request',
          icon: ZapIcon,
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.08)'
        };
      case 'otp_request':
        return {
          title: 'Request for OTP / Credentials',
          icon: LockIcon,
          color: '#DC2626',
          bg: 'rgba(220, 38, 38, 0.08)'
        };
      case 'unrealistic_rewards':
        return {
          title: 'Unrealistic Rewards / Lottery',
          icon: SparklesIcon,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.08)'
        };
      case 'threatening_language':
        return {
          title: 'Threatening / Coercive Language',
          icon: ShieldAlertIcon,
          color: '#EA580C',
          bg: 'rgba(234, 88, 12, 0.08)'
        };
      case 'suspicious_links':
        return {
          title: 'Suspicious Link / Typosquatting',
          icon: GlobeIcon,
          color: '#7655E8',
          bg: 'rgba(118, 85, 232, 0.08)'
        };
      case 'personal_info':
        return {
          title: 'Request for Sensitive Information',
          icon: FileTextIcon,
          color: '#E11D48',
          bg: 'rgba(225, 29, 72, 0.08)'
        };
      default:
        return {
          title: label || 'Identified Warning Sign',
          icon: AlertTriangleIcon,
          color: '#6366F1',
          bg: 'rgba(99, 102, 241, 0.08)'
        };
    }
  };

  return (
    <div className="result-white-card xai-warning-card">
      <div className="result-card-header">
        <div className="card-header-title-wrap">
          <span className="xai-tag-pill purple">
            <ZapIcon size={13} />
            <span>Card 4: Categorized Warning Signs</span>
          </span>
          <h4 className="result-card-heading">Identified Warning Signs ({warningSigns.length})</h4>
          <p className="result-card-subheading">
            Strictly separates raw factual text evidence from contextual AI analytical reasoning
          </p>
        </div>

        {/* Source Filter Buttons */}
        <div className="xai-filter-tabs">
          <button
            type="button"
            className={`xai-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({warningSigns.length})
          </button>
          <button
            type="button"
            className={`xai-filter-tab ${filter === 'factual' ? 'active' : ''}`}
            onClick={() => setFilter('factual')}
          >
            Factual Evidence ({factualCount})
          </button>
          <button
            type="button"
            className={`xai-filter-tab ${filter === 'ai' ? 'active' : ''}`}
            onClick={() => setFilter('ai')}
          >
            AI Interpretation ({aiCount})
          </button>
        </div>
      </div>

      <div className="xai-warning-list">
        {filteredSigns.map((item, idx) => {
          const meta = getCategoryMeta(item.standardCategory, item.categoryLabel);
          const IconComp = meta.icon;
          const isFactual = item.source?.includes('Factual');

          return (
            <div key={item.id || idx} className="xai-warning-item">
              <div className="xai-warning-top-row">
                <div className="xai-category-title-wrap">
                  <span
                    className="xai-category-icon-box"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    <IconComp size={16} />
                  </span>
                  <div>
                    <h5 className="xai-category-title">{meta.title}</h5>
                    <span className="xai-category-sublabel">{item.categoryLabel}</span>
                  </div>
                </div>

                <div className="xai-meta-badges">
                  {/* Evidence vs Interpretation Badge */}
                  <span className={`xai-source-badge ${isFactual ? 'factual' : 'ai'}`}>
                    {isFactual ? (
                      <>
                        <FileTextIcon size={12} />
                        <span>Factual Pattern Evidence</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon size={12} />
                        <span>AI Contextual Reasoning</span>
                      </>
                    )}
                  </span>

                  {/* Severity Badge */}
                  <span className={`xai-severity-badge ${item.severity || 'high'}`}>
                    {(item.severity || 'high').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Exact raw phrase / clue */}
              {item.phrase && (
                <div className="xai-evidence-box">
                  <span className="xai-evidence-label">Detected Text Evidence:</span>
                  <code className="xai-evidence-quote">"{item.phrase}"</code>
                </div>
              )}

              {/* Plain explanation */}
              <div className="xai-warning-explanation">
                <span className="xai-expl-label">Why This Is Dangerous:</span>
                <p className="xai-expl-text">{item.explanation}</p>
              </div>

              {/* Recommendation */}
              {item.recommendation && (
                <div className="xai-warning-action">
                  <span className="xai-action-label">Defensive Action:</span>
                  <span className="xai-action-text">{item.recommendation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
