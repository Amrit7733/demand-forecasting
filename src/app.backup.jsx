import { useState } from 'react';
import './App.css';

const initial = [62, 74, 69, 87, 79, 94, 89, 108, 102, 119, 113, 131];
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ForecastChart({ values }) {
  const coords = values.map((v, i) => `${48 + i * 65},${245 - v * 1.35}`).join(' ');
  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 820 290" role="img" aria-label="Sample monthly demand forecast line chart">
        {[40, 90, 140, 190, 240].map(y => <line key={y} x1="38" x2="790" y1={y} y2={y} stroke="#30303c" strokeDasharray="4 7" />)}
        <defs><linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff334d" stopOpacity=".26"/><stop offset="100%" stopColor="#ff334d" stopOpacity="0"/></linearGradient></defs>
        <polygon points={`48,260 ${coords} 763,260`} fill="url(#redFill)" />
        <polyline points={coords} fill="none" stroke="#ff4057" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) => <circle key={i} cx={48 + i * 65} cy={245 - v * 1.35} r="4" fill="#ff6477" />)}
        {labels.map((label, i) => <text key={label} x={48 + i * 65} y="282" textAnchor="middle" fill="#9494a7" fontSize="12">{label}</text>)}
      </svg>
    </div>
  );
}

export default function App() {
  const [product, setProduct] = useState('Product A');
  const [period, setPeriod] = useState('12 months');
  const multiplier = product === 'Product B' ? .82 : product === 'Product C' ? 1.18 : 1;
  const values = initial.map(v => Math.round(v * multiplier));
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">◆</span><span>DEMAND<span className="brand-accent">IQ</span><small>INTELLIGENCE PLATFORM</small></span></div>
        <div className="side-label">WORKSPACE</div>
        <nav aria-label="Main navigation"><a className="nav-active" href="#overview">◈ &nbsp; Overview</a><a href="#forecast">⌁ &nbsp; Forecast Analytics</a><a href="#insights">▤ &nbsp; Inventory Insights</a></nav>
        <div className="sidebar-bottom"><span className="online-dot" /> Demo workspace <small>React dashboard • v1.0</small></div>
      </aside>
      <main className="main" id="overview">
        <header className="topbar"><span>ANALYTICS / OVERVIEW</span><span className="live-pill"><span className="online-dot"/> DEMO MODE</span></header>
        <section className="hero"><div><p className="eyebrow">PREDICTIVE INTELLIGENCE</p><h1>Demand <em>Forecasting</em></h1><p className="subtitle">Explore future demand, spot trends, and make smarter inventory decisions.</p></div><div className="hero-orb">↗</div></section>
        <section className="filters"><label>PRODUCT<select value={product} onChange={e => setProduct(e.target.value)}><option>Product A</option><option>Product B</option><option>Product C</option></select></label><label>PERIOD<select value={period} onChange={e => setPeriod(e.target.value)}><option>12 months</option><option>6 months</option></select></label><span className="filter-note">Illustrative data only</span></section>
        <section className="kpis" aria-label="Key metrics"><div className="metric"><span>PROJECTED DEMAND</span><strong>{total.toLocaleString()}</strong><small>Units • sample year</small></div><div className="metric"><span>PEAK MONTH</span><strong>December</strong><small>Highest sample demand</small></div><div className="metric"><span>FORECAST HORIZON</span><strong>{period}</strong><small>Demo selection</small></div><div className="metric"><span>MODEL STATUS</span><strong className="red">Demo</strong><small>Real model not connected</small></div></section>
        <section className="panel" id="forecast"><div className="panel-heading"><div><p className="eyebrow">FORECAST PERFORMANCE</p><h2>Demand trajectory</h2></div><span className="chart-tag">● SAMPLE FORECAST</span></div><ForecastChart values={period === '6 months' ? values.map((v, i) => i < 6 ? v : values[5]) : values} /><div className="chart-foot"><span><i className="legend-dot"/> Predicted demand (demo)</span><span>Jan – Dec</span></div></section>
        <section className="insights" id="insights"><div><p className="eyebrow">ACTIONABLE INTELLIGENCE</p><h2>Inventory insights</h2><p>Connect your trained forecasting model and CSV outputs next to replace these placeholders with actual reorder recommendations and evaluation metrics.</p></div><div className="insight-pill">NEXT: REAL DATA INTEGRATION ↗</div></section>
        <footer>DEMANDIQ © 2026 · Portfolio prototype · No live predictions yet</footer>
      </main>
    </div>
  );
}
