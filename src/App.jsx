
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const DATA_URL = '/oos_predictions.csv';

function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some(v => v.trim())) lines.push(row);
      row = [];
    } else {
      cell += c;
    }
  }

  row.push(cell);
  if (row.some(v => v.trim())) lines.push(row);

  if (lines.length < 2) return [];

  const headers = lines.shift().map((h, i) =>
    (i === 0 ? h.replace(/^\uFEFF/, '') : h)
      .trim()
      .toLowerCase()
  );

  return lines.map(values =>
    Object.fromEntries(
      headers.map((h, i) => [
        h,
        (values[i] ?? '').trim()
      ])
    )
  );
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(value) {
  if (value === null || !Number.isFinite(value)) return '—';

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}

function dateLabel(date) {
  if (!date) return '—';

  const [year, month, day] = date.split('-');

  if (!year || !month || !day) return date;

  const d = new Date(`${year}-${month}-${day}T00:00:00`);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function ForecastChart({ rows }) {
  if (!rows.length) {
    return (
      <div className="chart-wrap">
        <p style={{ padding: 30, color: '#aaa' }}>
          No valid predictions for this selection.
        </p>
      </div>
    );
  }

  const width = 820;
  const height = 310;
  const left = 55;
  const right = 785;
  const top = 30;
  const bottom = 255;

  const allValues = rows.flatMap(r =>
    [r.p10, r.p50, r.p90].filter(Number.isFinite)
  );

  const min = Math.min(0, ...allValues);
  const max = Math.max(1, ...allValues);
  const range = Math.max(1, max - min);

  const x = i =>
    left + (rows.length === 1
      ? (right - left) / 2
      : i * (right - left) / (rows.length - 1));

  const y = value =>
    bottom - ((value - min) / range) * (bottom - top);

  const linePoints = rows
    .map((r, i) => `${x(i)},${y(r.p50)}`)
    .join(' ');

  const hasBand = rows.every(
    r => r.p10 !== null && r.p90 !== null
  );

  const bandPoints = hasBand
    ? [
        ...rows.map((r, i) => `${x(i)},${y(r.p90)}`),
        ...rows.slice().reverse().map((r, i) => {
          const index = rows.length - 1 - i;
          return `${x(index)},${y(r.p10)}`;
        })
      ].join(' ')
    : '';

  const areaPoints = [
    `${x(0)},${bottom}`,
    ...rows.map((r, i) => `${x(i)},${y(r.p50)}`),
    `${x(rows.length - 1)},${bottom}`
  ].join(' ');

  const labelStep = Math.max(1, Math.ceil(rows.length / 7));

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Daily p50 demand forecast with p10 to p90 uncertainty"
      >
        <defs>
          <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="#ff4057"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="#ff4057"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map(i => {
          const value = min + (range * i) / 4;
          const py = y(value);

          return (
            <g key={i}>
              <line
                x1={left}
                x2={right}
                y1={py}
                y2={py}
                stroke="#30303c"
                strokeDasharray="4 7"
              />
              <text
                x={left - 10}
                y={py + 4}
                textAnchor="end"
                fill="#9494a7"
                fontSize="11"
              >
                {formatNumber(value)}
              </text>
            </g>
          );
        })}

        <polygon
          points={areaPoints}
          fill="url(#forecastFill)"
        />

        {hasBand && (
          <polygon
            points={bandPoints}
            fill="#ff4057"
            fillOpacity="0.16"
            stroke="none"
          />
        )}

        <polyline
          points={linePoints}
          fill="none"
          stroke="#ff4057"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((r, i) => (
          <circle
            key={`${r.date}-${i}`}
            cx={x(i)}
            cy={y(r.p50)}
            r="3.5"
            fill="#ff6477"
          >
            <title>
              {`${r.date}
P10: ${formatNumber(r.p10)}
P50: ${formatNumber(r.p50)}
P90: ${formatNumber(r.p90)}`}
            </title>
          </circle>
        ))}

        {rows.map((r, i) => {
          if (
            i % labelStep !== 0 &&
            i !== rows.length - 1
          ) {
            return null;
          }

          return (
            <text
              key={`${r.date}-${i}`}
              x={x(i)}
              y="285"
              textAnchor="middle"
              fill="#9494a7"
              fontSize="11"
            >
              {dateLabel(r.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function App() {
  const [csvData, setCsvData] = useState([]);
  const [product, setProduct] = useState('');
  const [period, setPeriod] = useState(28);
  const [fold, setFold] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadCSV() {
      try {
        const response = await fetch(DATA_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`CSV request failed: ${response.status}`);
        }

        const text = await response.text();
        const parsed = parseCSV(text);

        if (!parsed.length) {
          throw new Error('CSV is empty.');
        }

        const required = ['date', 'p50'];

        for (const col of required) {
          if (!(col in parsed[0])) {
            throw new Error(`Missing CSV column: ${col}`);
          }
        }

        const valid = parsed
          .map(r => ({
            ...r,
            productKey: r.item_code || r.id || 'All items',
            p10: numberOrNull(r.p10),
            p50: numberOrNull(r.p50),
            p90: numberOrNull(r.p90),
            sales: numberOrNull(r.sales)
          }))
          .filter(r =>
            r.date &&
            /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
            r.p50 !== null
          );

        if (!valid.length) {
          throw new Error('No valid dated p50 predictions found.');
        }

        setCsvData(valid);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCSV();

    return () => controller.abort();
  }, []);

  const products = useMemo(() => {
    return [...new Set(csvData.map(r => r.productKey))]
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
  }, [csvData]);

  const selectedProduct = products.includes(product)
    ? product
    : (products[0] || '');

  const folds = useMemo(() => {
    return [...new Set(
      csvData
        .filter(r => r.productKey === selectedProduct)
        .map(r => r.fold)
        .filter(v => v !== undefined && v !== '')
    )].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [csvData, selectedProduct]);

  const selectedFold = folds.includes(fold)
    ? fold
    : (folds[0] || '');

  const forecast = useMemo(() => {
    const filtered = csvData
      .filter(r => r.productKey === selectedProduct)
      .filter(r =>
        !folds.length || r.fold === selectedFold
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    // Keep one observation per date within the selected fold.
    const byDate = new Map();

    filtered.forEach(r => {
      if (!byDate.has(r.date)) {
        byDate.set(r.date, r);
      }
    });

    const uniqueRows = [...byDate.values()];

    // Use the latest available daily evaluation window.
    return uniqueRows.slice(-period);
  }, [csvData, selectedProduct, selectedFold, folds, period]);

  const total = forecast.reduce(
    (sum, r) => sum + r.p50,
    0
  );

  const peak = forecast.length
    ? forecast.reduce((best, r) =>
        r.p50 > best.p50 ? r : best
      )
    : null;

  const evaluated = forecast.filter(
    r => r.sales !== null
  );

  const mae = evaluated.length
    ? evaluated.reduce(
        (sum, r) => sum + Math.abs(r.sales - r.p50),
        0
      ) / evaluated.length
    : null;

  const actualTotal = evaluated.reduce(
    (sum, r) => sum + r.sales,
    0
  );

  const absoluteError = evaluated.reduce(
    (sum, r) => sum + Math.abs(r.sales - r.p50),
    0
  );

  const wape = evaluated.length && actualTotal > 0
    ? (absoluteError / actualTotal) * 100
    : null;

  const hasBand = forecast.length > 0 &&
    forecast.every(
      r => r.p10 !== null && r.p90 !== null
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span>
            DEMAND<span className="brand-accent">IQ</span>
            <small>INTELLIGENCE PLATFORM</small>
          </span>
        </div>

        <div className="side-label">WORKSPACE</div>

        <nav aria-label="Main navigation">
          <a className="nav-active" href="#overview">
            ◈ &nbsp; Overview
          </a>
          <a href="#forecast">
            ⌁ &nbsp; Forecast Analytics
          </a>
          <a href="#insights">
            ▤ &nbsp; Inventory Insights
          </a>
        </nav>

        <div className="sidebar-bottom">
          <span className="online-dot" />
          Historical evaluation
          <small>React dashboard • v2.0</small>
        </div>
      </aside>

      <main className="main" id="overview">
        <header className="topbar">
          <span>ANALYTICS / OVERVIEW</span>

          <span className="live-pill">
            <span className="online-dot" />
            HISTORICAL CSV
          </span>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">
              PREDICTIVE INTELLIGENCE
            </p>

            <h1>
              Demand <em>Forecasting</em>
            </h1>

            <p className="subtitle">
              Explore historical out-of-sample predictions,
              demand patterns, and model performance.
            </p>
          </div>

          <div className="hero-orb">↗</div>
        </section>

        <section className="filters">
          <label>
            PRODUCT
            <select
              value={selectedProduct}
              onChange={e => {
                setProduct(e.target.value);
                setFold('');
              }}
            >
              {products.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            PERIOD
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={28}>Last 28 days</option>
            </select>
          </label>

          {folds.length > 0 && (
            <label>
              EVALUATION FOLD
              <select
                value={selectedFold}
                onChange={e => setFold(e.target.value)}
              >
                {folds.map(f => (
                  <option key={f} value={f}>
                    Fold {f}
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="filter-note">
            {loading
              ? 'Loading predictions...'
              : error
                ? 'CSV error'
                : `${csvData.length.toLocaleString()} valid rows loaded`}
          </span>
        </section>

        {error && (
          <p
            role="alert"
            style={{
              color: '#ff6477',
              padding: '12px 20px'
            }}
          >
            CSV error: {error}. Check public/oos_predictions.csv.
          </p>
        )}

        <section className="kpis" aria-label="Key metrics">
          <div className="metric">
            <span>PROJECTED DEMAND</span>
            <strong>{formatNumber(total)}</strong>
            <small>
              Sum of selected daily p50 predictions
            </small>
          </div>

          <div className="metric">
            <span>PEAK DEMAND DAY</span>
            <strong>
              {peak ? dateLabel(peak.date) : '—'}
            </strong>
            <small>
              {peak
                ? `${formatNumber(peak.p50)} predicted units`
                : 'No predictions'}
            </small>
          </div>

          <div className="metric">
            <span>FORECAST COVERAGE</span>
            <strong>{forecast.length} days</strong>
            <small>
              Up to {period} available daily records
            </small>
          </div>

          <div className="metric">
            <span>MODEL MAE</span>
            <strong className="red">
              {formatNumber(mae)}
            </strong>
            <small>
              {evaluated.length
                ? `WAPE: ${wape === null ? 'N/A' : `${formatNumber(wape)}%`}`
                : 'Actual sales unavailable'}
            </small>
          </div>
        </section>

        <section className="panel" id="forecast">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                FORECAST PERFORMANCE
              </p>
              <h2>Daily demand trajectory</h2>
            </div>

            <span className="chart-tag">
              ● P50 FORECAST
            </span>
          </div>

          <ForecastChart rows={forecast} />

          <div className="chart-foot">
            <span>
              <i className="legend-dot" />
              P50 median prediction
              {hasBand ? ' • Shaded P10–P90 range' : ''}
            </span>

            <span>
              {forecast.length
                ? `${dateLabel(forecast[0].date)} – ${dateLabel(forecast[forecast.length - 1].date)}`
                : 'No dates'}
            </span>
          </div>
        </section>

        <section className="insights" id="insights">
          <div>
            <p className="eyebrow">
              ACTIONABLE INTELLIGENCE
            </p>

            <h2>Model evaluation insights</h2>

            <p>
              This dashboard displays historical out-of-sample
              demand predictions from the exported CSV.
              P50 represents median predicted demand, while
              P10 and P90 show the estimated uncertainty range.
              MAE and WAPE compare predictions against actual
              sales when available. Evaluation folds are kept
              separate to avoid mixing forecast windows.
            </p>
          </div>

          <div className="insight-pill">
            HISTORICAL FORECAST ANALYSIS ↗
          </div>
        </section>

        <footer>
          DEMANDIQ © 2026 · Data Science Portfolio ·
          Historical Forecast Evaluation
        </footer>
      </main>
    </div>
  );
}
