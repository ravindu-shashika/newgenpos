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

const MONTH_METRICS = [
    { key: 'total_discount', label: 'Product Discount' },
    { key: 'order_discount', label: 'Order Discount' },
    { key: 'total_tax', label: 'Product Tax' },
    { key: 'order_tax', label: 'Order Tax' },
    { key: 'shipping_cost', label: 'Shipping Cost' },
    { key: 'grand_total', label: 'grand total' },
];

function canViewMonthlyPurchase() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('monthly-purchase') ?? false;
}

function resolveReportYear(params, pathname) {
    if (params.year) {
        return params.year;
    }

    const match = pathname.match(/\/report\/monthly_purchase\/(\d{4})\/?$/);
    if (match) {
        return match[1];
    }

    return String(new Date().getFullYear());
}

function isPositiveMetric(value) {
    const amount = Number(String(value ?? '').replace(/,/g, ''));
    return !Number.isNaN(amount) && amount > 0;
}

function MonthCell({ data }) {
    const visibleMetrics = MONTH_METRICS.filter((metric) => isPositiveMetric(data?.[metric.key]));

    return (
        <td className="monthly-purchase-month-cell">
            {visibleMetrics.map((metric, index) => (
                <div key={metric.key} className="monthly-purchase-metric">
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

export default function BackendReportMonthlyPurchase() {
    const params = useParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { toast, showToast } = useToast();

    const year = useMemo(
        () => resolveReportYear(params, pathname),
        [params, pathname],
    );

    const [canView, setCanView] = useState(canViewMonthlyPurchase);
    const [report, setReport] = useState(null);
    const [warehouseId, setWarehouseId] = useState('0');
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewMonthlyPurchase())), []);

    useEffect(() => {
        if (!params.year) {
            const target = `/report/monthly_purchase/${year}`;
            if (pathname !== target) {
                navigate(target, { replace: true });
            }
        }
    }, [params.year, year, pathname, navigate]);

    const fetchReport = useCallback(async (nextWarehouseId, { isInitial = false } = {}) => {
        if (!year) return;

        if (isInitial) {
            setInitialLoading(true);
        } else {
            setTableLoading(true);
        }
        setLoadError('');

        try {
            const path = `report/monthly_purchase/${year}`;
            const res = nextWarehouseId === '0'
                ? await api.get(path)
                : await api.post(path, { warehouse_id: Number(nextWarehouseId) || 0 });

            const data = res.data ?? {};
            setReport(data);
            setWarehouseId(String(data.warehouse_id ?? nextWarehouseId ?? '0'));
        } catch (err) {
            setReport(null);
            const message = err?.message || 'Failed to load monthly purchase report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            if (isInitial) {
                setInitialLoading(false);
            } else {
                setTableLoading(false);
            }
        }
    }, [year, showToast]);

    useEffect(() => {
        if (!canView || !year) {
            setInitialLoading(false);
            return;
        }
        fetchReport(warehouseId, { isInitial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when year changes, keep warehouse filter
    }, [canView, year]);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...((report?.warehouses ?? []).map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        }))),
    ], [report?.warehouses]);

    const months = useMemo(
        () => (Array.isArray(report?.months) ? report.months : []),
        [report?.months],
    );

    const handleWarehouseChange = (event) => {
        const nextWarehouseId = event.target.value;
        setWarehouseId(nextWarehouseId);
        fetchReport(nextWarehouseId);
    };

    if (!canView) {
        return (
            <PageLayout title="Monthly Purchase Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <style>{`
                .monthly-purchase-report { font-size: 0.8125rem; }
                .monthly-purchase-report .monthly-purchase-title {
                    font-size: 1rem;
                    font-weight: 600;
                }
                .monthly-purchase-report .monthly-purchase-warehouse {
                    font-size: 0.8125rem;
                    min-width: 160px;
                }
                .monthly-purchase-report .monthly-purchase-table {
                    font-size: 0.75rem;
                }
                .monthly-purchase-report .monthly-purchase-table th,
                .monthly-purchase-report .monthly-purchase-table td {
                    padding: 0.45rem 0.5rem;
                    vertical-align: top;
                }
                .monthly-purchase-report .monthly-purchase-table thead th {
                    font-size: 0.8125rem;
                    font-weight: 600;
                }
                .monthly-purchase-report .monthly-purchase-metric {
                    margin-bottom: 0.35rem;
                    line-height: 1.25;
                }
                .monthly-purchase-report .monthly-purchase-metric strong,
                .monthly-purchase-report .monthly-purchase-metric span {
                    font-size: 0.72rem;
                }
            `}</style>
            <Toast toast={toast} />

            <div className="ui-card monthly-purchase-report">
                <div className="card-body" style={{ padding: '16px 20px' }}>
                    <h4 className="text-center mb-0 monthly-purchase-title">
                        Monthly Purchase Report
                        {' '}
                        &nbsp;&nbsp;
                        <select
                            className="form-select form-select-sm d-inline-block monthly-purchase-warehouse"
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
                                        className="table table-bordered mb-0 monthly-purchase-table"
                                        style={{
                                            borderTop: '1px solid #dee2e6',
                                            borderBottom: '1px solid #dee2e6',
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th>
                                                    <Link to={`/report/monthly_purchase/${report.prev_year}`}>
                                                        ← Previous
                                                    </Link>
                                                </th>
                                                <th colSpan={10} className="text-center">
                                                    {report.year}
                                                </th>
                                                <th className="text-end">
                                                    <Link to={`/report/monthly_purchase/${report.next_year}`}>
                                                        Next →
                                                    </Link>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {months.map((month) => (
                                                    <td key={month.label ?? month.index}>
                                                        <strong>{month.label}</strong>
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr>
                                                {months.map((month) => (
                                                    <MonthCell
                                                        key={`metrics-${month.label ?? month.index}`}
                                                        data={month}
                                                    />
                                                ))}
                                            </tr>
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
