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
  .dash-welcome { margin-bottom: 20px; }
  .dash-welcome h2 { font-size: 1rem; font-weight: 500; color: var(--ui-muted); }
  .dash-welcome span { color: var(--ui-ink); font-weight: 600; }
  .dash-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 20px; }
  .dash-filters select, .dash-filters input[type="date"] {
    font-family: var(--ui-mono); font-size: 0.78rem; padding: 8px 12px;
    border: 1px solid var(--ui-border); border-radius: var(--ui-radius); background: var(--ui-surface);
  }
  .dash-alert { padding: 12px 16px; border-radius: var(--ui-radius); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .dash-alert.warning { background: #fef9c3; border: 1px solid #fde68a; color: #854d0e; text-align: center; }
  .dash-widgets { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .dash-widget {
    background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: 8px;
    padding: 16px; display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .dash-widget:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .dash-widget-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
  .dash-widget-label { font-size: 0.72rem; color: var(--ui-muted); display: block; margin-bottom: 2px; }
  .dash-widget-value { font-size: 1rem; font-weight: 600; color: var(--ui-ink); }
  .icon-purple { background: #f3e8ff; color: #733686; }
  .icon-cyan { background: #e0f7fa; color: #0584a0; }
  .icon-orange { background: #fff3e0; color: #ff8952; }
  .icon-red { background: #ffebee; color: #f66162; }
  .icon-gold { background: #fef9c3; color: #d48519; }
  .icon-yellow { background: #fefce8; color: #bdbb39; }
  .icon-green { background: #ecfdf5; color: #00c689; }
  .icon-blue { background: #eff6ff; color: #297ff9; }
  .dash-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
  .dash-grid-2-1 { display: grid; grid-template-columns: 7fr 5fr; gap: 16px; margin-bottom: 16px; }
  .dash-grid-half { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  @media (max-width: 900px) {
    .dash-grid-2, .dash-grid-2-1, .dash-grid-half { grid-template-columns: 1fr; }
  }
  .dash-card { background: var(--ui-surface); border: 1px solid var(--ui-border); border-radius: 8px; overflow: hidden; }
  .dash-card-header { padding: 14px 16px; border-bottom: 1px solid var(--ui-border); display: flex; justify-content: space-between; align-items: center; }
  .dash-card-header h3 { font-size: 0.88rem; font-weight: 600; margin: 0; }
  .dash-badge { font-size: 0.65rem; padding: 3px 8px; border-radius: 99px; background: var(--ui-accent); color: #fff; letter-spacing: 0.04em; }
  .dash-card-body { padding: 16px; }
  .dash-chart-wrap { position: relative; height: 280px; }
  .dash-chart-wrap.tall { height: 320px; }
  .dash-chart-wrap.pie { height: 240px; display: flex; align-items: center; justify-content: center; }
  .dash-legend { display: flex; gap: 16px; font-size: 0.68rem; color: var(--ui-muted); }
  .dash-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
  .dash-tabs { display: flex; border-bottom: 1px solid var(--ui-border); }
  .dash-tab { padding: 10px 16px; font-size: 0.75rem; cursor: pointer; border: none; background: none; font-family: var(--ui-mono); color: var(--ui-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .dash-tab.active { color: var(--ui-ink); border-bottom-color: var(--ui-ink); font-weight: 600; }
  .dash-product { display: flex; align-items: center; gap: 10px; }
  .dash-product img { width: 30px; height: 25px; object-fit: cover; border-radius: 2px; border: 1px solid var(--ui-border); }
  .dash-status { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.65rem; font-weight: 500; }
  .dash-status.success { background: #dcfce7; color: #166534; }
  .dash-status.danger { background: #fee2e2; color: #991b1b; }
  .dash-status.warning { background: #fef9c3; color: #854d0e; }
  .dash-loading { padding: 48px; text-align: center; color: var(--ui-muted); }
  .dash-error { padding: 24px; color: var(--ui-debit); }
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

function productImageUrl(base, images, fallback) {
    const first = images ? String(images).split(',')[0] : fallback;
    return `${base}/${first}`;
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

function StatWidget({ href, iconClass, icon, label, value, decimal }) {
    const inner = (
        <>
            <div className={`dash-widget-icon ${iconClass}`}>{icon}</div>
            <div>
                <span className="dash-widget-label">{label}</span>
                <span className="dash-widget-value">{formatMoney(value, decimal)}</span>
            </div>
        </>
    );
    if (href) {
        return <a className="dash-widget" href={href}>{inner}</a>;
    }
    return <div className="dash-widget">{inner}</div>;
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
                                        onError={(e) => { e.target.src = `${imageBase}/${fallbackImage}`; }}
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
            <div className="dash-welcome">
                <h2>Welcome <span>{data.user?.name}</span></h2>
                {data.customer?.points ? (
                    <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--ui-muted)' }}>
                        Reward Points: <strong>{data.customer.points}</strong>
                        {data.reward_point?.per_point_amount != null && (
                            <> · One Point = {formatMoney(data.reward_point.per_point_amount, decimal)}</>
                        )}
                    </p>
                ) : null}
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

            <div className="dash-welcome">
                <h2>Welcome <span>{user.name}</span></h2>
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
                    <span style={{ color: 'var(--ui-muted)', fontSize: '0.72rem' }}>to</span>
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
                    <StatWidget iconClass="icon-blue" icon="★" label="Profit" value={stats.profit} decimal={decimal} />
                </div>
            )}

            {(showCashFlow || showMonthly) && (
                <div className="dash-grid-2">
                    {showCashFlow && <CashFlowChart data={bootstrap.cash_flow} theme={theme} />}
                    {showMonthly && <MonthlySummaryChart summary={bootstrap.monthly_summary} theme={theme} />}
                </div>
            )}

            {showYearly && (
                <div style={{ marginBottom: 16 }}>
                    <YearlyReportChart report={bootstrap.yearly_report} theme={theme} />
                </div>
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
