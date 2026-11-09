import React, { useState, useEffect, useMemo } from 'react';
import {
  getAnalysisHistory,
  deleteAnalysisRecord,
  clearAllAnalysisHistory,
  exportHistoryAsJson,
  seedSampleScans
} from '../utils/historyStorage';
import DashboardResultModal from './DashboardResultModal';
import {
  BarChartIcon,
  PieChartIcon,
  FilterIcon,
  CalendarIcon,
  DownloadIcon,
  TrashIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  GlobeIcon,
  MailIcon,
  ImageIcon,
  SparklesIcon,
  RefreshIcon,
  ExternalLinkIcon,
  EyeIcon,
  ZapIcon
} from './Icons';

export default function Dashboard({ onLoadInScanner }) {
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filters state
  const [filterRisk, setFilterRisk] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'message' | 'url' | 'email' | 'screenshot'
  const [filterDate, setFilterDate] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination / display limit
  const [displayCount, setDisplayCount] = useState(10);

  // Load history and listen to real-time updates from any scan
  const loadHistory = () => {
    const data = getAnalysisHistory();
    setHistory(data);
  };

  useEffect(() => {
    loadHistory();

    const handleUpdate = (e) => {
      if (e.detail) {
        setHistory(e.detail);
      } else {
        loadHistory();
      }
    };

    window.addEventListener('scamlens_history_updated', handleUpdate);
    return () => {
      window.removeEventListener('scamlens_history_updated', handleUpdate);
    };
  }, []);

  // Filter logic
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;

    return history.filter((item) => {
      // Risk filter
      if (filterRisk === 'high' && item.riskScore < 60 && item.riskLevel !== 'High Risk') return false;
      if (
        filterRisk === 'medium' &&
        (item.riskScore >= 60 || item.riskScore < 25) &&
        item.riskLevel !== 'Moderate Risk' &&
        item.riskLevel !== 'Medium Risk'
      ) return false;
      if (filterRisk === 'low' && (item.riskScore >= 25 || item.riskLevel === 'High Risk')) return false;

      // Type filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Date filter
      if (filterDate !== 'all') {
        const itemTime = new Date(item.timestamp).getTime();
        const diffDays = (now - itemTime) / oneDay;
        if (filterDate === 'today' && diffDays > 1) return false;
        if (filterDate === 'week' && diffDays > 7) return false;
        if (filterDate === 'month' && diffDays > 30) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (item.preview || '').toLowerCase();
        const matchScam = (item.scamType || '').toLowerCase();
        const matchType = (item.type || '').toLowerCase();
        if (!matchText.includes(q) && !matchScam.includes(q) && !matchType.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [history, filterRisk, filterType, filterDate, searchQuery]);

  // Aggregate Statistics derived dynamically from actual analysis records
  const stats = useMemo(() => {
    const total = history.length;
    let high = 0;
    let medium = 0;
    let low = 0;
    let scoreSum = 0;
    const categoryCounts = {};

    history.forEach((item) => {
      const score = item.riskScore || 0;
      scoreSum += score;

      if (score >= 60 || item.riskLevel === 'High Risk') {
        high += 1;
      } else if (score >= 25 || item.riskLevel === 'Moderate Risk' || item.riskLevel === 'Medium Risk') {
        medium += 1;
      } else {
        low += 1;
      }

      // Group categories
      const cat = item.scamType || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const avgScore = total > 0 ? Math.round(scoreSum / total) : 0;

    // Sort categories by frequency
    const sortedCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      high,
      medium,
      low,
      avgScore,
      highPct: total > 0 ? Math.round((high / total) * 100) : 0,
      mediumPct: total > 0 ? Math.round((medium / total) * 100) : 0,
      lowPct: total > 0 ? Math.round((low / total) * 100) : 0,
      categories: sortedCategories
    };
  }, [history]);

  const handleDelete = (id) => {
    deleteAnalysisRecord(id);
    loadHistory();
  };

  const handleClearAll = () => {
    clearAllAnalysisHistory();
    setShowClearConfirm(false);
    loadHistory();
  };

  const handleSeedSamples = () => {
    seedSampleScans();
    loadHistory();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'url':
        return <GlobeIcon size={14} />;
      case 'email':
        return <MailIcon size={14} />;
      case 'screenshot':
        return <ImageIcon size={14} />;
      default:
        return <MessageSquareIcon size={14} />;
    }
  };

  const formatDate = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  const formatTime = (isoStr) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  return (
    <section id="dashboard" className="dashboard-section">
      <div className="section-container">
        {/* Dashboard Header Bar */}
        <div className="dash-header-card">
          <div className="dash-header-left">
            <div className="dash-eyebrow">
              <span className="dash-live-dot"></span>
              <span>SCAM RISK ANALYTICS</span>
            </div>
            <h2 className="dash-main-title">Personal Scam Risk Dashboard</h2>
            <p className="dash-subtitle">
              Real-time threat statistics, risk distribution analytics, and verifiable audit history stored locally in your browser.
            </p>
          </div>

          <div className="dash-header-actions">
            <button
              type="button"
              className="dash-action-btn secondary"
              onClick={loadHistory}
              title="Refresh telemetry"
            >
              <RefreshIcon size={15} />
              <span>Refresh</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                className="dash-action-btn secondary"
                onClick={exportHistoryAsJson}
                title="Export JSON audit report"
              >
                <DownloadIcon size={15} />
                <span>Export JSON</span>
              </button>
            )}

            {history.length > 0 && (
              <button
                type="button"
                className="dash-action-btn danger"
                onClick={() => setShowClearConfirm(true)}
                title="Clear all stored history"
              >
                <TrashIcon size={15} />
                <span>Clear History</span>
              </button>
            )}

            {history.length === 0 && (
              <button
                type="button"
                className="dash-action-btn primary"
                onClick={handleSeedSamples}
              >
                <SparklesIcon size={15} />
                <span>Load Sample Scans</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. Key Statistics Cards Row */}
        <div className="dash-metrics-grid">
          {/* Total Analyses Card */}
          <div className="dash-metric-card">
            <div className="dash-metric-top">
              <span className="dash-metric-title">Total Analysed</span>
              <span className="dash-metric-icon-box purple">
                <BarChartIcon size={18} />
              </span>
            </div>
            <div className="dash-metric-value">{stats.total}</div>
            <div className="dash-metric-caption">
              <span>Verified across all scanners</span>
            </div>
          </div>

          {/* High-Risk Detections Card */}
          <div className="dash-metric-card high-risk">
            <div className="dash-metric-top">
              <span className="dash-metric-title">High-Risk Detections</span>
              <span className="dash-metric-icon-box red">
                <ShieldAlertIcon size={18} />
              </span>
            </div>
            <div className="dash-metric-value red">{stats.high}</div>
            <div className="dash-metric-caption">
              <span className="bold-percent">{stats.highPct}%</span> of total scans
            </div>
          </div>

          {/* Medium-Risk Detections Card */}
          <div className="dash-metric-card medium-risk">
            <div className="dash-metric-top">
              <span className="dash-metric-title">Medium-Risk Cautions</span>
              <span className="dash-metric-icon-box amber">
                <AlertTriangleIcon size={18} />
              </span>
            </div>
            <div className="dash-metric-value amber">{stats.medium}</div>
            <div className="dash-metric-caption">
              <span className="bold-percent">{stats.mediumPct}%</span> of total scans
            </div>
          </div>

          {/* Low-Risk / Safe Clean Card */}
          <div className="dash-metric-card low-risk">
            <div className="dash-metric-top">
              <span className="dash-metric-title">Low-Risk (Safe)</span>
              <span className="dash-metric-icon-box green">
                <ShieldCheckIcon size={18} />
              </span>
            </div>
            <div className="dash-metric-value green">{stats.low}</div>
            <div className="dash-metric-caption">
              <span className="bold-percent">{stats.lowPct}%</span> verified benign
            </div>
          </div>

          {/* Average Threat Score Card */}
          <div className="dash-metric-card avg-score">
            <div className="dash-metric-top">
              <span className="dash-metric-title">Average Risk Score</span>
              <span className="dash-metric-icon-box purple">
                <ZapIcon size={18} />
              </span>
            </div>
            <div className="dash-metric-value purple">
              {stats.avgScore}
              <span className="dash-metric-max">/100</span>
            </div>
            <div className="dash-metric-caption">
              Overall calculated threat index
            </div>
          </div>
        </div>

        {/* 2. Visual Charts Row (Distribution & Category Analytics) */}
        <div className="dash-charts-grid">
          {/* Chart 1: Risk Level Distribution Chart */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <div className="dash-chart-header-left">
                <PieChartIcon size={18} className="text-purple" />
                <h4 className="dash-chart-title">Risk Level Distribution</h4>
              </div>
              <span className="dash-chart-tag">Actual Scan Data</span>
            </div>

            {stats.total === 0 ? (
              <div className="dash-chart-empty">
                <p>No scans recorded yet. Perform a scan or click "Load Sample Scans".</p>
              </div>
            ) : (
              <div className="dash-donut-chart-wrap">
                {/* Visual SVG Donut Chart */}
                <div className="dash-svg-donut-container">
                  <svg width="150" height="150" viewBox="0 0 150 150" className="dash-donut-svg">
                    <circle cx="75" cy="75" r="54" fill="none" stroke="#EAE8F2" strokeWidth="18" />
                    {/* SVG Segment Breakdown */}
                    {(() => {
                      const r = 54;
                      const circ = 2 * Math.PI * r;
                      const highStroke = (stats.high / stats.total) * circ;
                      const medStroke = (stats.medium / stats.total) * circ;
                      const lowStroke = (stats.low / stats.total) * circ;

                      let offset = 0;
                      return (
                        <>
                          {/* Low Risk Segment (Green) */}
                          <circle
                            cx="75"
                            cy="75"
                            r={r}
                            fill="none"
                            stroke="#16A34A"
                            strokeWidth="18"
                            strokeDasharray={`${lowStroke} ${circ}`}
                            strokeDashoffset={-offset}
                            className="donut-segment"
                          />
                          {/* Medium Risk Segment (Amber) */}
                          {(() => {
                            offset += lowStroke;
                            return (
                              <circle
                                cx="75"
                                cy="75"
                                r={r}
                                fill="none"
                                stroke="#F59E0B"
                                strokeWidth="18"
                                strokeDasharray={`${medStroke} ${circ}`}
                                strokeDashoffset={-offset}
                                className="donut-segment"
                              />
                            );
                          })()}
                          {/* High Risk Segment (Red) */}
                          {(() => {
                            offset += medStroke;
                            return (
                              <circle
                                cx="75"
                                cy="75"
                                r={r}
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="18"
                                strokeDasharray={`${highStroke} ${circ}`}
                                strokeDashoffset={-offset}
                                className="donut-segment"
                              />
                            );
                          })()}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="donut-center-label">
                    <span className="donut-center-number">{stats.total}</span>
                    <span className="donut-center-sub">SCANS</span>
                  </div>
                </div>

                {/* Donut Legend & Progress Bars */}
                <div className="dash-donut-legend">
                  <div className="donut-legend-item">
                    <div className="legend-label-row">
                      <span className="legend-bullet red"></span>
                      <span className="legend-name">High Risk</span>
                      <span className="legend-count">{stats.high} ({stats.highPct}%)</span>
                    </div>
                    <div className="legend-bar-track">
                      <div className="legend-bar-fill red" style={{ width: `${stats.highPct}%` }}></div>
                    </div>
                  </div>

                  <div className="donut-legend-item">
                    <div className="legend-label-row">
                      <span className="legend-bullet amber"></span>
                      <span className="legend-name">Medium Risk</span>
                      <span className="legend-count">{stats.medium} ({stats.mediumPct}%)</span>
                    </div>
                    <div className="legend-bar-track">
                      <div className="legend-bar-fill amber" style={{ width: `${stats.mediumPct}%` }}></div>
                    </div>
                  </div>

                  <div className="donut-legend-item">
                    <div className="legend-label-row">
                      <span className="legend-bullet green"></span>
                      <span className="legend-name">Low Risk (Safe)</span>
                      <span className="legend-count">{stats.low} ({stats.lowPct}%)</span>
                    </div>
                    <div className="legend-bar-track">
                      <div className="legend-bar-fill green" style={{ width: `${stats.lowPct}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Scam Category Statistics */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <div className="dash-chart-header-left">
                <BarChartIcon size={18} className="text-purple" />
                <h4 className="dash-chart-title">Scam Category Frequency</h4>
              </div>
              <span className="dash-chart-tag">Top Deception Vectors</span>
            </div>

            {stats.categories.length === 0 ? (
              <div className="dash-chart-empty">
                <p>No category vectors detected yet.</p>
              </div>
            ) : (
              <div className="dash-categories-bar-list">
                {stats.categories.map((cat, idx) => {
                  const maxCount = stats.categories[0]?.count || 1;
                  const barPct = Math.round((cat.count / maxCount) * 100);
                  return (
                    <div key={idx} className="category-bar-row">
                      <div className="category-info-row">
                        <span className="category-name-text">{cat.name}</span>
                        <span className="category-count-badge">
                          {cat.count} scan{cat.count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="category-bar-track">
                        <div
                          className="category-bar-fill"
                          style={{ width: `${barPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Recent Analysis History & Multi-Criteria Filtering */}
        <div className="dash-history-card">
          <div className="dash-history-header">
            <div>
              <h3 className="dash-history-title">Recent Analysis History</h3>
              <p className="dash-history-sub">
                Inspected SMS messages, links, email domains, and uploaded screenshots
              </p>
            </div>

            <div className="dash-count-pill">
              Showing {filteredHistory.length} of {history.length} records
            </div>
          </div>

          {/* Filtering Controls Bar */}
          <div className="dash-filters-toolbar">
            <div className="filter-group">
              <label className="filter-label">
                <FilterIcon size={13} />
                <span>Risk Level:</span>
              </label>
              <select
                className="dash-filter-select"
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk (60-100)</option>
                <option value="medium">Medium Risk (25-59)</option>
                <option value="low">Low Risk (0-24)</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <MessageSquareIcon size={13} />
                <span>Analysis Type:</span>
              </label>
              <select
                className="dash-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Payloads</option>
                <option value="message">Message / SMS</option>
                <option value="url">Link / URL</option>
                <option value="email">Email Sender</option>
                <option value="screenshot">Screenshot OCR</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                <CalendarIcon size={13} />
                <span>Date Range:</span>
              </label>
              <select
                className="dash-filter-select"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Past 24 Hours</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <input
                type="text"
                className="dash-search-input"
                placeholder="Search history or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="dash-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* History Records Table / Cards */}
          {filteredHistory.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <ShieldCheckIcon size={36} />
              </div>
              <h4>No Matching Analysis Records Found</h4>
              <p>
                {history.length === 0
                  ? 'You haven\'t scanned any content yet. Try scanning a suspicious SMS, web link, or screenshot.'
                  : 'No records matched your selected filters. Try adjusting the filter criteria above.'}
              </p>
              {history.length === 0 && (
                <button
                  type="button"
                  className="btn-seed-empty"
                  onClick={handleSeedSamples}
                >
                  <SparklesIcon size={15} />
                  <span>Load Sample Threat Records</span>
                </button>
              )}
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-records-table">
                <thead>
                  <tr>
                    <th>TYPE & DATE</th>
                    <th>PAYLOAD PREVIEW</th>
                    <th>SCAM CATEGORY</th>
                    <th>RISK LEVEL</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice(0, displayCount).map((record) => {
                    const isHigh = record.riskScore >= 60 || record.riskLevel === 'High Risk';
                    const isMed = !isHigh && (record.riskScore >= 25 || record.riskLevel === 'Moderate Risk' || record.riskLevel === 'Medium Risk');

                    const badgeClass = isHigh ? 'high' : isMed ? 'medium' : 'low';
                    const scoreColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#16A34A';

                    return (
                      <tr key={record.id} className="dash-record-row">
                        {/* Type & Date column */}
                        <td className="col-type-date">
                          <div className="type-badge-row">
                            <span className={`type-tag-pill ${record.type}`}>
                              {getTypeIcon(record.type)}
                              <span>{record.type.toUpperCase()}</span>
                            </span>
                          </div>
                          <span className="record-date-str">{formatDate(record.timestamp)}</span>
                          <span className="record-time-str">{formatTime(record.timestamp)}</span>
                        </td>

                        {/* Payload preview column */}
                        <td className="col-preview">
                          <p className="record-preview-text" title={record.fullInput || record.preview}>
                            {record.preview}
                          </p>
                          {record.warningSignsCount > 0 && (
                            <span className="record-triggers-chip">
                              <ZapIcon size={11} />
                              <span>{record.warningSignsCount} threat triggers</span>
                            </span>
                          )}
                        </td>

                        {/* Scam category column */}
                        <td className="col-category">
                          <span className="record-category-name">
                            {record.scamType || 'General Communication'}
                          </span>
                        </td>

                        {/* Risk level column */}
                        <td className="col-risk">
                          <div className="risk-display-wrap">
                            <span
                              className="risk-score-pill"
                              style={{ color: scoreColor }}
                            >
                              <strong>{record.riskScore}</strong>/100
                            </span>
                            <span className={`risk-tier-pill ${badgeClass}`}>
                              {isHigh ? 'High Risk' : isMed ? 'Medium' : 'Safe'}
                            </span>
                          </div>
                        </td>

                        {/* Actions column */}
                        <td className="col-actions text-right">
                          <div className="record-action-btns">
                            <button
                              type="button"
                              className="btn-record-open"
                              onClick={() => setSelectedRecord(record)}
                              title="Open full assessment report"
                            >
                              <EyeIcon size={14} />
                              <span>Open Result</span>
                            </button>

                            <button
                              type="button"
                              className="btn-record-del"
                              onClick={() => handleDelete(record.id)}
                              title="Delete record"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Show more button if > displayCount */}
              {filteredHistory.length > displayCount && (
                <div className="dash-pagination-row">
                  <button
                    type="button"
                    className="btn-show-more"
                    onClick={() => setDisplayCount((prev) => prev + 10)}
                  >
                    Show 10 More Records ({filteredHistory.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Privacy Footnote */}
          <div className="dash-privacy-footer">
            <span className="privacy-lock-icon">🔒</span>
            <p>
              <strong>Zero-Cloud Telemetry:</strong> All history records and risk statistics are stored locally in your browser sandbox. ScamLens never stores or transmits your scanned texts, URLs, or screenshots to any remote database.
            </p>
          </div>
        </div>

        {/* Modal: Full Analysis Details / Restore */}
        {selectedRecord && (
          <DashboardResultModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onLoadInScanner={onLoadInScanner}
            onDelete={handleDelete}
          />
        )}

        {/* Modal: Confirm Clear All History */}
        {showClearConfirm && (
          <div className="dash-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
            <div
              className="dash-modal-card confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-circle">
                <TrashIcon size={26} />
              </div>
              <h3 className="confirm-title">Clear Scam Analysis History?</h3>
              <p className="confirm-text">
                Are you sure you want to delete all stored analysis records? This will clear all historical risk statistics and cannot be undone.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="dash-modal-cancel-btn"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="dash-modal-delete-btn"
                  onClick={handleClearAll}
                >
                  Yes, Clear All History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
