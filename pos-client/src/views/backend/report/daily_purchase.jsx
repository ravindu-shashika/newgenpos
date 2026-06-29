import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    PageLayout,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thrusday', 'Friday', 'Saturday'];

const DAY_METRICS = [
    { key: 'total_discount', label: 'Product Discount' },
    { key: 'order_discount', label: 'Order Discount' },
    { key: 'total_tax', label: 'Product Tax' },
    { key: 'order_tax', label: 'Order Tax' },
    { key: 'shipping_cost', label: 'Shipping Cost' },
    { key: 'grand_total', label: 'grand total' },
];

function canViewDailyPurchase() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('daily-purchase') ?? false;
}

function resolveDailyPurchasePeriod(params, pathname) {
    if (params.year && params.month) {
        return { year: params.year, month: params.month };
    }

    const match = pathname.match(/\/report\/daily_purchase\/(\d{4})\/(\d{1,2})\/?$/);
    if (match) {
        return { year: match[1], month: match[2] };
    }

    const now = new Date();
    return {
        year: String(now.getFullYear()),
        month: String(now.getMonth() + 1).padStart(2, '0'),
    };
}

function isPhpTruthy(value) {
    if (value == null || value === '' || value === false) return false;
    if (value === 0 || value === '0') return false;
    const amount = Number(String(value).replace(/,/g, ''));
    if (!Number.isNaN(amount) && amount === 0) return false;
    return true;
}

function isTodayCell(year, month, day) {
    const today = new Date();
    return Number(year) === today.getFullYear()
        && Number(month) === today.getMonth() + 1
        && day === today.getDate();
}

function buildCalendarWeeks(startDay, numberOfDays, days) {
    const weeks = [];
    let dayIndex = 1;
    let started = false;

    while (dayIndex <= numberOfDays) {
        const week = [];

        for (let column = 1; column <= 7; column += 1) {
            if (dayIndex > numberOfDays) {
                break;
            }

            if (started) {
                week.push({
                    day: dayIndex,
                    ...(days?.[dayIndex] ?? days?.[String(dayIndex)] ?? {}),
                });
                dayIndex += 1;
                continue;
            }

            if (column === startDay) {
                week.push({
                    day: dayIndex,
                    ...(days?.[dayIndex] ?? days?.[String(dayIndex)] ?? {}),
                });
                started = true;
                dayIndex += 1;
                continue;
            }

            week.push(null);
        }

        weeks.push(week);
    }

    return weeks;
}

function DayCell({ year, month, day, data }) {
    const isToday = isTodayCell(year, month, day);
    const visibleMetrics = DAY_METRICS.filter((metric) => isPhpTruthy(data?.[metric.key]));

    return (
        <td className="daily-purchase-day-cell">
            <p className={`daily-purchase-day-num${isToday ? ' is-today' : ''}`}>
                <strong>{day}</strong>
            </p>
            {visibleMetrics.map((metric, index) => (
                <div key={metric.key} className="daily-purchase-metric">
                    <strong>{metric.label}</strong>
                    <br />
                    <span>{data[metric.key]}</span>
                    {index < visibleMetrics.length - 1 ? (
                        <>
                            <br />
                            <br />
                        </>
                    ) : (
                        <br />
                    )}
                </div>
            ))}
        </td>
    );
}

export default function BackendReportDailyPurchase() {
    const params = useParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { toast, showToast } = useToast();

    const { year, month } = useMemo(
        () => resolveDailyPurchasePeriod(params, pathname),
        [params, pathname],
    );

    const [canView, setCanView] = useState(canViewDailyPurchase);
    const [report, setReport] = useState(null);
    const [warehouseId, setWarehouseId] = useState('0');
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewDailyPurchase())), []);

    useEffect(() => {
        if (!params.year || !params.month) {
            const target = `/report/daily_purchase/${year}/${month}`;
            if (pathname !== target) {
                navigate(target, { replace: true });
            }
        }
    }, [params.year, params.month, year, month, pathname, navigate]);

    const fetchReport = useCallback(async (nextWarehouseId, { isInitial = false } = {}) => {
        if (!year || !month) return;

        if (isInitial) {
            setInitialLoading(true);
        } else {
            setTableLoading(true);
        }
        setLoadError('');

        try {
            const path = `report/daily_purchase/${year}/${month}`;
            const res = nextWarehouseId === '0'
                ? await api.get(path)
                : await api.post(path, { warehouse_id: Number(nextWarehouseId) || 0 });

            const data = res.data ?? {};
            setReport(data);
            setWarehouseId(String(data.warehouse_id ?? nextWarehouseId ?? '0'));
        } catch (err) {
            setReport(null);
            const message = err?.message || 'Failed to load daily purchase report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            if (isInitial) {
                setInitialLoading(false);
            } else {
                setTableLoading(false);
            }
        }
    }, [year, month, showToast]);

    useEffect(() => {
        if (!canView || !year || !month) {
            setInitialLoading(false);
            return;
        }
        fetchReport(warehouseId, { isInitial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when month changes, keep warehouse filter
    }, [canView, year, month]);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...((report?.warehouses ?? []).map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        }))),
    ], [report?.warehouses]);

    const weeks = useMemo(() => {
        if (!report) return [];
        return buildCalendarWeeks(
            Number(report.start_day ?? 1),
            Number(report.number_of_day ?? 0),
            report.days ?? {},
        );
    }, [report]);

    const handleWarehouseChange = (event) => {
        const nextWarehouseId = event.target.value;
        setWarehouseId(nextWarehouseId);
        fetchReport(nextWarehouseId);
    };

    if (!canView) {
        return (
            <PageLayout title="Daily Purchase Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <style>{`
                .daily-purchase-report { font-size: 0.8125rem; }
                .daily-purchase-report .daily-purchase-title {
                    font-size: 1rem;
                    font-weight: 600;
                }
                .daily-purchase-report .daily-purchase-warehouse {
                    font-size: 0.8125rem;
                    min-width: 160px;
                }
                .daily-purchase-report .daily-purchase-table {
                    font-size: 0.75rem;
                }
                .daily-purchase-report .daily-purchase-table th,
                .daily-purchase-report .daily-purchase-table td {
                    padding: 0.45rem 0.5rem;
                    vertical-align: top;
                }
                .daily-purchase-report .daily-purchase-table thead th {
                    font-size: 0.8125rem;
                    font-weight: 600;
                }
                .daily-purchase-report .daily-purchase-day-num {
                    margin: 0 0 0.35rem;
                    font-size: 0.8125rem;
                }
                .daily-purchase-report .daily-purchase-day-num.is-today {
                    color: red;
                }
                .daily-purchase-report .daily-purchase-metric {
                    margin-bottom: 0.35rem;
                    line-height: 1.25;
                }
                .daily-purchase-report .daily-purchase-metric strong,
                .daily-purchase-report .daily-purchase-metric span {
                    font-size: 0.72rem;
                }
            `}</style>
            <Toast toast={toast} />

            <div className="ui-card daily-purchase-report">
                <div className="card-body" style={{ padding: '16px 20px' }}>
                    <h4 className="text-center mb-0 daily-purchase-title">
                        Daily Purchase Report
                        {' '}
                        &nbsp;&nbsp;
                        <select
                            className="form-select form-select-sm d-inline-block daily-purchase-warehouse"
                            style={{
                                width: 'auto',
                                verticalAlign: 'middle',
                            }}
                            value={warehouseId}
                            onChange={handleWarehouseChange}
                            disabled={initialLoading && !report}
                        >
                            {warehouseOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </h4>

                    {loadError && (
                        <p className="text-warning text-center mt-3 mb-0" style={{ fontSize: '0.9rem' }}>
                            {loadError}
                        </p>
                    )}

                    <div id="report-table">
                        {initialLoading && !report ? (
                            <p className="text-muted text-center mt-4 mb-0">Loading...</p>
                        ) : report && (
                            tableLoading ? (
                                <p className="text-muted text-center mt-4 mb-0">Loading...</p>
                            ) : (
                                <div className="table-responsive mt-4">
                                    <table
                                        className="table table-bordered mb-0 daily-purchase-table"
                                        style={{
                                            borderTop: '1px solid #dee2e6',
                                            borderBottom: '1px solid #dee2e6',
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th>
                                                    <Link to={`/report/daily_purchase/${report.prev_year}/${report.prev_month}`}>
                                                        ← Previous
                                                    </Link>
                                                </th>
                                                <th colSpan={5} className="text-center">
                                                    {report.month_label}
                                                </th>
                                                <th className="text-end">
                                                    <Link to={`/report/daily_purchase/${report.next_year}/${report.next_month}`}>
                                                        Next →
                                                    </Link>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {WEEKDAYS.map((label) => (
                                                    <td key={label}><strong>{label}</strong></td>
                                                ))}
                                            </tr>
                                            {weeks.map((week, weekIndex) => (
                                                <tr key={`week-${weekIndex}`}>
                                                    {week.map((cell, cellIndex) => (
                                                        cell
                                                            ? (
                                                                <DayCell
                                                                    key={`${cell.day}-${cellIndex}`}
                                                                    year={report.year}
                                                                    month={report.month}
                                                                    day={cell.day}
                                                                    data={cell}
                                                                />
                                                            )
                                                            : <td key={`empty-${weekIndex}-${cellIndex}`} />
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
