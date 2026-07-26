import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    ArcElement,
    DoughnutController,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import moment from 'moment';
import api from '../services/api';
import authStore, { can } from '../stores/authStore';
import { PageLayout } from '../components/ui/PageLayout';

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    BarController,
    BarElement,
    ArcElement,
    DoughnutController,
    Tooltip,
    Legend,
    Filler,
);

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DASH_CSS = `
  .dash-shell { display: flex; flex-direction: column; gap: 20px; }
  .dash-welcome { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px; }
  .dash-welcome h2 {
    margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; color: var(--ui-ink);
  }
  .dash-welcome h2 span { color: var(--ui-accent); }
  .dash-welcome-sub { margin: 4px 0 0; font-size: 0.82rem; color: var(--ui-muted); }
  .dash-filters {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    padding: 10px 12px; background: var(--ui-surface); border: 1px solid var(--ui-border);
    border-radius: 14px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .dash-filters select, .dash-filters input[type="date"] {
    font-family: inherit; font-size: 0.8125rem; font-weight: 500; padding: 8px 12px;
    border: 1px solid var(--ui-border); border-radius: 10px; background: #f8fafc; color: var(--ui-ink);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .dash-filters select:focus, .dash-filters input[type="date"]:focus {
    border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); background: #fff;
  }
  .dash-filters-sep { color: var(--ui-muted); font-size: 0.75rem; font-weight: 500; padding: 0 2px; }
  .dash-alert {
    padding: 14px 16px; border-radius: 12px; display: flex; justify-content: space-between;
    align-items: flex-start; gap: 12px;
  }
  .dash-alert.warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border: 1px solid #fcd34d; color: #92400e; text-align: center;
  }
  .dash-widgets {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;
  }
  @media (max-width: 1200px) { .dash-widgets { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 900px) { .dash-widgets { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 560px) { .dash-widgets { grid-template-columns: 1fr; } }
  .dash-widget {
    position: relative; overflow: hidden;
    background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: 14px;
    padding: 16px 16px 16px 18px; display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: inherit;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .dash-widget.has-tip { overflow: visible; z-index: 2; }
  .dash-widget.has-tip:hover { z-index: 5; }
  .dash-widget::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--dash-accent, #64748b); border-radius: 14px 0 0 14px;
  }
  .dash-widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
    border-color: color-mix(in srgb, var(--dash-accent, #64748b) 35%, var(--ui-border));
  }
  .dash-widget.has-tip { cursor: help; }
  .dash-widget-tip {
    display: none; position: absolute; z-index: 30; left: 50%; bottom: calc(100% + 10px);
    transform: translateX(-50%); width: min(320px, 78vw); padding: 12px 14px;
    background: #0f172a; color: #f8fafc; border-radius: 12px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.28); pointer-events: none;
    text-align: left;
  }
  .dash-widget-tip::after {
    content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
    border: 7px solid transparent; border-top-color: #0f172a;
  }
  .dash-widget.has-tip:hover .dash-widget-tip,
  .dash-widget.has-tip:focus-within .dash-widget-tip { display: block; }
  .dash-tip-title {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #93c5fd; margin-bottom: 8px;
  }
  .dash-tip-formula {
    font-size: 0.72rem; font-weight: 600; line-height: 1.45; margin-bottom: 4px; color: #fff;
  }
  .dash-tip-formula.muted { color: #94a3b8; font-weight: 500; margin-bottom: 10px; }
  .dash-tip-rows { display: flex; flex-direction: column; gap: 5px; }
  .dash-tip-rows > div {
    display: flex; justify-content: space-between; gap: 12px;
    font-size: 0.72rem; color: #cbd5e1;
  }
  .dash-tip-rows strong { color: #f8fafc; font-variant-numeric: tabular-nums; font-weight: 700; }
  .dash-tip-total {
    margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.35);
    color: #fff !important; font-weight: 700;
  }
  .dash-tip-total strong { color: #93c5fd; font-size: 0.8rem; }
  .dash-widget-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.05rem; flex-shrink: 0; font-weight: 700;
  }
  .dash-widget-meta { min-width: 0; flex: 1; }
  .dash-widget-label {
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    color: var(--ui-muted); display: block; margin-bottom: 4px;
  }
  .dash-widget-value {
    font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; color: var(--ui-ink);
    font-variant-numeric: tabular-nums; line-height: 1.2;
  }
  .dash-widget.icon-purple { --dash-accent: #7c3aed; }
  .dash-widget.icon-cyan { --dash-accent: #0284c7; }
  .dash-widget.icon-orange { --dash-accent: #ea580c; }
  .dash-widget.icon-red { --dash-accent: #dc2626; }
  .dash-widget.icon-gold { --dash-accent: #d97706; }
  .dash-widget.icon-yellow { --dash-accent: #ca8a04; }
  .dash-widget.icon-green { --dash-accent: #059669; }
  .dash-widget.icon-blue { --dash-accent: #2563eb; }
  .dash-widget-icon.icon-purple { background: #f3e8ff; color: #7c3aed; }
  .dash-widget-icon.icon-cyan { background: #e0f2fe; color: #0284c7; }
  .dash-widget-icon.icon-orange { background: #ffedd5; color: #ea580c; }
  .dash-widget-icon.icon-red { background: #fee2e2; color: #dc2626; }
  .dash-widget-icon.icon-gold { background: #fef3c7; color: #d97706; }
  .dash-widget-icon.icon-yellow { background: #fef9c3; color: #ca8a04; }
  .dash-widget-icon.icon-green { background: #d1fae5; color: #059669; }
  .dash-widget-icon.icon-blue { background: #dbeafe; color: #2563eb; }
  .dash-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .dash-grid-2-1 { display: grid; grid-template-columns: 7fr 5fr; gap: 16px; }
  .dash-grid-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 900px) {
    .dash-grid-2, .dash-grid-2-1, .dash-grid-half { grid-template-columns: 1fr; }
  }
  .dash-card {
    background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: 14px;
    overflow: hidden; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .dash-card-header {
    padding: 16px 18px; border-bottom: 1px solid var(--ui-border);
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
  }
  .dash-card-header h3 { font-size: 0.92rem; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
  .dash-badge {
    font-size: 0.65rem; font-weight: 700; padding: 4px 9px; border-radius: 999px;
    background: #eff6ff; color: #1d4ed8; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .dash-card-body { padding: 16px 18px; }
  .dash-chart-wrap { position: relative; height: 280px; }
  .dash-chart-wrap.tall { height: 320px; }
  .dash-chart-wrap.pie { height: 240px; display: flex; align-items: center; justify-content: center; }
  .dash-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.72rem; color: var(--ui-muted); font-weight: 500; }
  .dash-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; vertical-align: middle; }
  .dash-tabs { display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid var(--ui-border); background: #fafbfc; }
  .dash-tab {
    padding: 12px 14px; font-size: 0.78rem; cursor: pointer; border: none; background: none;
    font-family: inherit; color: var(--ui-muted); border-bottom: 2px solid transparent; margin-bottom: -1px;
    font-weight: 500; border-radius: 8px 8px 0 0; transition: color 0.15s, background 0.15s;
  }
  .dash-tab:hover { color: var(--ui-ink); background: rgba(15, 23, 42, 0.03); }
  .dash-tab.active { color: var(--ui-accent); border-bottom-color: var(--ui-accent); font-weight: 700; }
  .dash-product { display: flex; align-items: center; gap: 10px; }
  .dash-product img {
    width: 36px; height: 36px; object-fit: cover; border-radius: 8px; border: 1px solid var(--ui-border);
  }
  .dash-status { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.68rem; font-weight: 600; }
  .dash-status.success { background: #dcfce7; color: #166534; }
  .dash-status.danger { background: #fee2e2; color: #991b1b; }
  .dash-status.warning { background: #fef9c3; color: #854d0e; }
  .dash-loading, .dash-error { padding: 56px 24px; text-align: center; color: var(--ui-muted); }
  .dash-error { color: var(--ui-debit); }
  .dash-card .ui-table-wrap { border: none; border-radius: 0; box-shadow: none; }
`;

function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) return Number(0).toFixed(decimal);
    return n.toFixed(decimal);
}

function formatDateInput(value, dateFormat = 'd-m-Y') {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).split('T')[0] || '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return dateFormat
        .replace('d', day)
        .replace('m', month)
        .replace('Y', String(year));
}

/** Local placeholder — avoids 404 on missing server default (zummXD2dvAtI.png). */
const PRODUCT_IMAGE_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
            '<rect fill="#eceae4" width="80" height="80"/>' +
            '<text x="40" y="44" text-anchor="middle" fill="#9a958c" font-size="11" font-family="sans-serif">No image</text>' +
            '</svg>'
    );

function productImageUrl(base, images, fallback) {
    const first = images ? String(images).split(',')[0].trim() : '';
    if (!first || first === 'zummXD2dvAtI.png') {
        if (fallback && String(fallback).startsWith('http') && !String(fallback).includes('zummXD2dvAtI.png')) {
            return fallback;
        }
        return PRODUCT_IMAGE_PLACEHOLDER;
    }
    if (first.startsWith('http://') || first.startsWith('https://') || first.startsWith('data:')) {
        return first;
    }
    const root = String(base || '').replace(/\/$/, '');
    return root ? `${root}/${first}` : PRODUCT_IMAGE_PLACEHOLDER;
}

function parseFilterStats(data) {
    return {
        revenue: Number(data[0] ?? 0),
        saleReturn: Number(data[1] ?? 0),
        profit: Number(data[2] ?? 0),
        purchaseReturn: Number(data[3] ?? 0),
        totalSale: Number(data[4] ?? 0),
        invoiceDue: Number(data[5] ?? 0),
        totalPurchase: Number(data[6] ?? 0),
        purchaseDue: Number(data[7] ?? 0),
        expense: Number(data[8] ?? 0),
    };
}

function StatWidget({ href, iconClass, icon, label, value, decimal, tip }) {
    const inner = (
        <>
            <div className={`dash-widget-icon ${iconClass}`}>{icon}</div>
            <div className="dash-widget-meta">
                <span className="dash-widget-label">{label}</span>
                <span className="dash-widget-value">{formatMoney(value, decimal)}</span>
            </div>
            {tip ? (
                <div className="dash-widget-tip" role="tooltip">
                    {tip}
                </div>
            ) : null}
        </>
    );
    const className = `dash-widget ${iconClass}${tip ? ' has-tip' : ''}`;
    if (href) {
        return <a className={className} href={href}>{inner}</a>;
    }
    return <div className={className}>{inner}</div>;
}

function ProfitFormulaTip({ stats, decimal }) {
    const revenue = Number(stats.revenue ?? 0);
    const purchaseReturn = Number(stats.purchaseReturn ?? 0);
    const expense = Number(stats.expense ?? 0);
    const profit = Number(stats.profit ?? 0);
    const sale = Number(stats.totalSale ?? 0);
    const saleReturn = Number(stats.saleReturn ?? 0);
    // COGS implied by API: profit = revenue + purchase_return - cogs - expense
    const cogs = revenue + purchaseReturn - expense - profit;

    return (
        <>
            <div className="dash-tip-title">Profit formula</div>
            <div className="dash-tip-formula">
                Profit = Revenue + Purchase Return − COGS − Expense
            </div>
            <div className="dash-tip-formula muted">
                Revenue = Sale − Sale Return + Income
            </div>
            <div className="dash-tip-rows">
                <div><span>Sale</span><strong>{formatMoney(sale, decimal)}</strong></div>
                <div><span>Sale Return</span><strong>{formatMoney(saleReturn, decimal)}</strong></div>
                <div><span>Revenue</span><strong>{formatMoney(revenue, decimal)}</strong></div>
                <div><span>Purchase Return</span><strong>{formatMoney(purchaseReturn, decimal)}</strong></div>
                <div><span>COGS</span><strong>{formatMoney(cogs, decimal)}</strong></div>
                <div><span>Expense</span><strong>{formatMoney(expense, decimal)}</strong></div>
                <div className="dash-tip-total">
                    <span>Profit</span>
                    <strong>{formatMoney(profit, decimal)}</strong>
                </div>
            </div>
        </>
    );
}

function CashFlowChart({ data, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !data) return;
        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: 'line',
            data: {
                labels: data.months || [],
                datasets: [
                    {
                        label: 'Payment Received',
                        data: (data.received || []).map(Number),
                        borderColor: theme?.color || '#733686',
                        backgroundColor: 'transparent',
                        borderWidth: 1.8,
                        tension: 0.45,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                    },
                    {
                        label: 'Payment Sent',
                        data: (data.sent || []).map(Number),
                        borderColor: '#6fb1b5',
                        backgroundColor: 'transparent',
                        borderWidth: 1.8,
                        tension: 0.45,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        border: { display: false },
                        ticks: { callback: (v) => Number(v).toLocaleString() },
                    },
                },
            },
        });
        return () => chartRef.current?.destroy();
    }, [data, theme]);

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h3>Cash Flow</h3>
                <div className="dash-legend">
                    <span><span className="dash-legend-dot" style={{ background: theme?.color }} /> Payment Received</span>
                    <span><span className="dash-legend-dot" style={{ background: '#6fb1b5' }} /> Payment Sent</span>
                </div>
            </div>
            <div className="dash-card-body">
                <div className="dash-chart-wrap">
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}

function MonthlySummaryChart({ summary, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !summary) return;
        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: 'doughnut',
            data: {
                labels: ['Purchase', 'Revenue', 'Expense'],
                datasets: [{
                    data: [summary.purchase, summary.revenue, summary.expense],
                    backgroundColor: [theme?.color || '#733686', '#ff8952', '#858c85'],
                    hoverBackgroundColor: [theme?.color_rgba || 'rgba(115,54,134,0.8)', 'rgba(255,137,82,0.8)', 'rgba(133,140,133,0.8)'],
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
            },
        });
        return () => chartRef.current?.destroy();
    }, [summary, theme]);

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h3>{summary?.month_label || `${moment().format('MMMM YYYY')}`}</h3>
            </div>
            <div className="dash-card-body">
                <div className="dash-chart-wrap pie">
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}

function YearlyReportChart({ report, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !report) return;
        chartRef.current?.destroy();
        const primary = theme?.color || '#733686';
        const primaryRgba = theme?.color_rgba || 'rgba(115,54,134,0.8)';
        chartRef.current = new Chart(canvasRef.current, {
            type: 'bar',
            data: {
                labels: MONTHS,
                datasets: [
                    {
                        label: 'Purchased Amount',
                        data: (report.purchase || []).slice(0, 12).map(Number),
                        backgroundColor: primaryRgba,
                        borderColor: primary,
                        borderWidth: 1,
                    },
                    {
                        label: 'Sold Amount',
                        data: (report.sale || []).slice(0, 12).map(Number),
                        backgroundColor: 'rgba(255, 137, 82, 1)',
                        borderColor: 'rgba(255, 137, 82, 1)',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } } },
                scales: { y: { beginAtZero: true } },
            },
        });
        return () => chartRef.current?.destroy();
    }, [report, theme]);

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h3>Yearly Report {report?.year || ''}</h3>
            </div>
            <div className="dash-card-body">
                <div className="dash-chart-wrap tall">
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ type, value }) {
    const maps = {
        sale: { 1: ['Completed', 'success'], 2: ['Pending', 'danger'], default: ['Draft', 'warning'] },
        purchase: { 1: ['Received', 'success'], 2: ['Partial', 'danger'], 3: ['Pending', 'danger'], default: ['Ordered', 'warning'] },
        quotation: { 1: ['Pending', 'success'], 2: ['Sent', 'danger'] },
    };
    const map = maps[type] || {};
    const [label, cls] = map[value] || map.default || ['—', 'warning'];
    return <span className={`dash-status ${cls}`}>{label}</span>;
}

function DataTable({ columns, rows, emptyLabel = 'No records' }) {
    return (
        <div className="ui-table-wrap">
            <table className="ui-table">
                <thead>
                    <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--ui-muted)' }}>{emptyLabel}</td></tr>
                    ) : rows.map((row, i) => (
                        <tr key={row.id ?? i}>{columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RecentTransactions({ decimal, dateFormat }) {
    const [tab, setTab] = useState('sale');
    const [sales, setSales] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        Promise.all([
            api.get('recent-sale'),
            api.get('recent-purchase'),
            api.get('recent-quotation'),
            api.get('recent-payment'),
        ]).then(([s, p, q, pay]) => {
            setSales(s.data || []);
            setPurchases(p.data || []);
            setQuotations(q.data || []);
            setPayments(pay.data || []);
        }).catch(() => {});
    }, []);

    const tabs = [
        { id: 'sale', label: 'Sale' },
        { id: 'purchase', label: 'Purchase' },
        { id: 'quotation', label: 'Quotation' },
        { id: 'payment', label: 'Payment' },
    ];

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h3>Recent Transaction</h3>
                <span className="dash-badge">latest 5</span>
            </div>
            <div className="dash-tabs">
                {tabs.map((t) => (
                    <button key={t.id} type="button" className={`dash-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="dash-card-body" style={{ paddingTop: 0 }}>
                {tab === 'sale' && (
                    <DataTable
                        columns={[
                            { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                            { key: 'reference_no', label: 'Reference' },
                            { key: 'name', label: 'Customer' },
                            { key: 'status', label: 'Status', render: (r) => <StatusBadge type="sale" value={r.sale_status} /> },
                            { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total / (r.exchange_rate || 1), decimal) },
                        ]}
                        rows={sales}
                    />
                )}
                {tab === 'purchase' && (
                    <DataTable
                        columns={[
                            { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                            { key: 'reference_no', label: 'Reference' },
                            { key: 'name', label: 'Supplier' },
                            { key: 'status', label: 'Status', render: (r) => <StatusBadge type="purchase" value={r.status} /> },
                            { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total / (r.exchange_rate || 1), decimal) },
                        ]}
                        rows={purchases}
                    />
                )}
                {tab === 'quotation' && (
                    <DataTable
                        columns={[
                            { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                            { key: 'reference_no', label: 'Reference' },
                            { key: 'name', label: 'Customer' },
                            { key: 'status', label: 'Status', render: (r) => <StatusBadge type="quotation" value={r.quotation_status} /> },
                            { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total, decimal) },
                        ]}
                        rows={quotations}
                    />
                )}
                {tab === 'payment' && (
                    <DataTable
                        columns={[
                            { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                            { key: 'payment_reference', label: 'Reference' },
                            { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount / (r.exchange_rate || 1), decimal) },
                            { key: 'paying_method', label: 'Paid By' },
                        ]}
                        rows={payments}
                    />
                )}
            </div>
        </div>
    );
}

function BestSellerPanel({ title, endpoint, valueKey, valueLabel, imageBase, fallbackImage, isMoney, decimal }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        api.get(endpoint).then((res) => setRows(res.data || [])).catch(() => setRows([]));
    }, [endpoint]);

    return (
        <div className="dash-card">
            <div className="dash-card-header">
                <h3>{title}</h3>
                <span className="dash-badge">top 5</span>
            </div>
            <div className="dash-card-body" style={{ paddingTop: 0 }}>
                <DataTable
                    columns={[
                        {
                            key: 'product',
                            label: 'Product Details',
                            render: (r) => (
                                <div className="dash-product">
                                    <img
                                        src={productImageUrl(imageBase, r.product_images, fallbackImage)}
                                        alt=""
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = PRODUCT_IMAGE_PLACEHOLDER;
                                        }}
                                    />
                                    <span>{r.product_name} [{r.product_code}]</span>
                                </div>
                            ),
                        },
                        {
                            key: 'value',
                            label: valueLabel,
                            render: (r) => {
                                if (isMoney) {
                                    const rate = r.exchange_rate || 1;
                                    return formatMoney(r[valueKey] / rate, decimal);
                                }
                                return r[valueKey];
                            },
                        },
                    ]}
                    rows={rows}
                />
            </div>
        </div>
    );
}

function CustomerDashboard({ data }) {
    const decimal = data.decimal ?? 2;
    const dateFormat = data.date_format ?? 'd-m-Y';
    const [tab, setTab] = useState('sale');

    const tabs = [
        { id: 'sale', label: 'Sale' },
        { id: 'payment', label: 'Payment' },
        { id: 'quotation', label: 'Quotation' },
        { id: 'return', label: 'Return' },
    ];

    return (
        <PageLayout title="Dashboard">
            <style>{DASH_CSS}</style>
            <div className="dash-shell">
            <div className="dash-welcome">
                <div>
                    <h2>Welcome <span>{data.user?.name}</span></h2>
                    {data.customer?.points ? (
                        <p className="dash-welcome-sub">
                            Reward Points: <strong>{data.customer.points}</strong>
                            {data.reward_point?.per_point_amount != null && (
                                <> · One Point = {formatMoney(data.reward_point.per_point_amount, decimal)}</>
                            )}
                        </p>
                    ) : (
                        <p className="dash-welcome-sub">Your recent sales, payments, and returns.</p>
                    )}
                </div>
            </div>
            <div className="dash-card">
                <div className="dash-tabs">
                    {tabs.map((t) => (
                        <button key={t.id} type="button" className={`dash-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="dash-card-body">
                    {tab === 'sale' && (
                        <DataTable
                            columns={[
                                { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                                { key: 'reference_no', label: 'Reference' },
                                { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name },
                                { key: 'status', label: 'Status', render: (r) => <StatusBadge type="sale" value={r.sale_status} /> },
                                { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total / (r.exchange_rate || 1), decimal) },
                            ]}
                            rows={data.sales || []}
                        />
                    )}
                    {tab === 'payment' && (
                        <DataTable
                            columns={[
                                { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                                { key: 'payment_reference', label: 'Reference' },
                                { key: 'sale_reference', label: 'Sale Ref' },
                                { key: 'amount', label: 'Amount', render: (r) => formatMoney(r.amount / (r.exchange_rate || 1), decimal) },
                            ]}
                            rows={data.payments || []}
                        />
                    )}
                    {tab === 'quotation' && (
                        <DataTable
                            columns={[
                                { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                                { key: 'reference_no', label: 'Reference' },
                                { key: 'customer', label: 'Customer', render: (r) => r.customer?.name },
                                { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total, decimal) },
                            ]}
                            rows={data.quotations || []}
                        />
                    )}
                    {tab === 'return' && (
                        <DataTable
                            columns={[
                                { key: 'date', label: 'Date', render: (r) => formatDateInput(r.created_at, dateFormat) },
                                { key: 'reference_no', label: 'Reference' },
                                { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name },
                                { key: 'total', label: 'Grand Total', render: (r) => formatMoney(r.grand_total / (r.exchange_rate || 1), decimal) },
                            ]}
                            rows={data.returns || []}
                        />
                    )}
                </div>
            </div>
            </div>
        </PageLayout>
    );
}

function AdminDashboard({ bootstrap }) {
    const user = bootstrap.user || authStore.getUser() || {};
    const decimal = bootstrap.decimal ?? 2;
    const dateFormat = bootstrap.date_format ?? 'd-m-Y';
    const theme = bootstrap.theme || {};
    const imageBase = bootstrap.product_image_base || '';
    const fallbackImage = bootstrap.default_product_image || 'zummXD2dvAtI.png';

    const [startDate, setStartDate] = useState(bootstrap.filter_start_date || moment().subtract(29, 'days').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(bootstrap.filter_end_date || moment().format('YYYY-MM-DD'));
    const [warehouseId, setWarehouseId] = useState(() => {
        if (user.role_id > 2) return String(user.warehouse_id || 0);
        return '0';
    });
    const [stats, setStats] = useState(null);

    const showSummary = can('revenue_profit_summary');
    const showCashFlow = can('cash_flow');
    const showMonthly = can('monthly_summary');
    const showYearly = can('yearly_report');

    const loadFilter = useCallback(async (start, end, warehouse) => {
        try {
            const res = await api.get(`dashboard-filter/${start}/${end}/${warehouse}`);
            setStats(parseFilterStats(res.data));
        } catch {
            setStats(parseFilterStats([]));
        }
    }, []);

    useEffect(() => {
        loadFilter(startDate, endDate, warehouseId);
    }, [startDate, endDate, warehouseId, loadFilter]);

    const monthLabel = moment().format('MMMM');
    const yearLabel = moment().format('YYYY');

    return (
        <PageLayout title="Dashboard">
            <style>{DASH_CSS}</style>
            <div className="dash-shell">
            <div className="dash-welcome">
                <div>
                    <h2>Welcome <span>{user.name}</span></h2>
                    <p className="dash-welcome-sub">Overview of sales, purchases, and profit for the selected period.</p>
                </div>
            </div>

            {bootstrap.restaurant_orders != null && (
                <div className="dash-alert warning">
                    <a href="#/kitchen/dashboard" style={{ color: 'inherit', textDecoration: 'none', width: '100%' }}>
                        <strong>{bootstrap.restaurant_orders} Orders to serve</strong>
                    </a>
                </div>
            )}

            {showSummary && (
                <div className="dash-filters">
                    {user.role_id <= 2 && (
                        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                            <option value="0">All Warehouse</option>
                            {(bootstrap.warehouses || []).map((w) => (
                                <option key={w.id} value={String(w.id)}>{w.name}</option>
                            ))}
                        </select>
                    )}
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <span className="dash-filters-sep">to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            )}

            {showSummary && stats && (
                <div className="dash-widgets">
                    <StatWidget href="#/sales" iconClass="icon-purple" icon="▮" label="Sale" value={stats.totalSale} decimal={decimal} />
                    <StatWidget iconClass="icon-cyan" icon="▤" label="Sale Due" value={stats.invoiceDue} decimal={decimal} />
                    <StatWidget href="#/return-sale" iconClass="icon-orange" icon="↩" label="Sale Return" value={stats.saleReturn} decimal={decimal} />
                    <StatWidget iconClass="icon-red" icon="◈" label="Expense" value={stats.expense} decimal={decimal} />
                    <StatWidget href="#/purchases" iconClass="icon-gold" icon="↓" label="Purchase" value={stats.totalPurchase} decimal={decimal} />
                    <StatWidget iconClass="icon-yellow" icon="!" label="Purchase Due" value={stats.purchaseDue} decimal={decimal} />
                    <StatWidget href="#/return-purchase" iconClass="icon-green" icon="↩" label="Purchase Return" value={stats.purchaseReturn} decimal={decimal} />
                    <StatWidget iconClass="icon-blue" icon="★" label="Profit" value={stats.profit} decimal={decimal} tip={<ProfitFormulaTip stats={stats} decimal={decimal} />} />
                </div>
            )}

            {(showCashFlow || showMonthly) && (
                <div className="dash-grid-2">
                    {showCashFlow && <CashFlowChart data={bootstrap.cash_flow} theme={theme} />}
                    {showMonthly && <MonthlySummaryChart summary={bootstrap.monthly_summary} theme={theme} />}
                </div>
            )}

            {showYearly && (
                <YearlyReportChart report={bootstrap.yearly_report} theme={theme} />
            )}

            <div className="dash-grid-2-1">
                <RecentTransactions decimal={decimal} dateFormat={dateFormat} />
                <BestSellerPanel
                    title={`Best Seller ${monthLabel}`}
                    endpoint="monthly-best-selling-qty"
                    valueKey="sold_qty"
                    valueLabel="Qty"
                    imageBase={imageBase}
                    fallbackImage={fallbackImage}
                    decimal={decimal}
                />
            </div>

            <div className="dash-grid-half">
                <BestSellerPanel
                    title={`Best Seller ${yearLabel} (Qty)`}
                    endpoint="yearly-best-selling-qty"
                    valueKey="sold_qty"
                    valueLabel="Qty"
                    imageBase={imageBase}
                    fallbackImage={fallbackImage}
                    decimal={decimal}
                />
                <BestSellerPanel
                    title={`Best Seller ${yearLabel} (Price)`}
                    endpoint="yearly-best-selling-price"
                    valueKey="total_price"
                    valueLabel="Grand Total"
                    imageBase={imageBase}
                    fallbackImage={fallbackImage}
                    isMoney
                    decimal={decimal}
                />
            </div>
            </div>
        </PageLayout>
    );
}

export default function Dashboard() {
    const [bootstrap, setBootstrap] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('dashboard');
                const data = res.data ?? res;
                if (cancelled) return;
                if (data.redirect && data.dashboard_type === 'kitchen') {
                    window.location.href = data.redirect;
                    return;
                }
                setBootstrap(data);
            } catch (err) {
                if (!cancelled) setError(err?.response?.data?.message || 'Failed to load dashboard');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <PageLayout title="Dashboard">
                <style>{DASH_CSS}</style>
                <div className="dash-loading">Loading dashboard…</div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout title="Dashboard">
                <style>{DASH_CSS}</style>
                <div className="dash-error">{error}</div>
            </PageLayout>
        );
    }

    if (bootstrap?.dashboard_type === 'customer') {
        return <CustomerDashboard data={bootstrap} />;
    }

    return <AdminDashboard bootstrap={bootstrap || {}} />;
}
