import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    PageLayout,
    FormField,
    FormRow,
    SelectInput,
    TextInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
);

const TIME_PERIOD_OPTIONS = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

function canViewSaleReportChart() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('sale-report-chart') ?? false;
}

function SaleReportLineChart({ datePoints, soldQty, label, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const color = theme?.color ?? '#733686';

    useEffect(() => {
        if (!canvasRef.current) return;

        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: 'line',
            data: {
                labels: datePoints ?? [],
                datasets: [
                    {
                        label: label || 'Sold Qty',
                        data: (soldQty ?? []).map((value) => Number(value) || 0),
                        fill: false,
                        tension: 0.3,
                        backgroundColor: 'transparent',
                        borderColor: color,
                        borderCapStyle: 'butt',
                        borderJoinStyle: 'miter',
                        borderWidth: 3,
                        pointBorderColor: color,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 5,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: color,
                        pointHoverBorderColor: 'rgba(220,220,220,1)',
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        spanGaps: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [datePoints, soldQty, label, color]);

    return (
        <canvas
            ref={canvasRef}
            style={{ maxHeight: 420, width: '100%' }}
        />
    );
}

export default function BackendReportSaleReportChart() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewSaleReportChart);
    const typingTimerRef = useRef(null);

    const [warehouses, setWarehouses] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [warehouseId, setWarehouseId] = useState('0');
    const [timePeriod, setTimePeriod] = useState('weekly');
    const [productList, setProductList] = useState('');
    const [datePoints, setDatePoints] = useState([]);
    const [soldQty, setSoldQty] = useState([]);
    const [chartLabel, setChartLabel] = useState('Sold Qty');
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewSaleReportChart())), []);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        })),
    ], [warehouses]);

    const applyPayload = useCallback((data) => {
        setStartDate(data.start_date ?? '');
        setEndDate(data.end_date ?? '');
        setWarehouseId(String(data.warehouse_id ?? '0'));
        setTimePeriod(data.time_period || 'weekly');
        setProductList(data.product_list ?? '');
        setDatePoints(Array.isArray(data.date_points) ? data.date_points : []);
        setSoldQty(Array.isArray(data.sold_qty) ? data.sold_qty : []);
        setChartLabel(data.label || 'Sold Qty');
        setTheme(data.theme ?? null);
        if (Array.isArray(data.warehouses)) {
            setWarehouses(data.warehouses);
        }
    }, []);

    const fetchReport = useCallback(async (params) => {
        setLoading(true);
        setLoadError('');
        try {
            const payload = {
                start_date: params.start_date,
                end_date: params.end_date,
                warehouse_id: params.warehouse_id,
                time_period: params.time_period,
                product_list: params.product_list ?? '',
            };

            const res = params.useGet
                ? await api.get('report/sale-report-chart')
                : await api.post('report/sale-report-chart', payload);

            applyPayload(res.data ?? {});
        } catch (err) {
            setDatePoints([]);
            setSoldQty([]);
            const message = err?.message || 'Failed to load sale report chart.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [applyPayload, showToast]);

    useEffect(() => {
        if (!canView) {
            setLoading(false);
            return;
        }

        fetchReport({ useGet: true });
    }, [canView, fetchReport]);

    const reloadWithParams = useCallback((overrides = {}) => {
        const next = {
            start_date: overrides.start_date ?? startDate,
            end_date: overrides.end_date ?? endDate,
            warehouse_id: overrides.warehouse_id ?? warehouseId,
            time_period: overrides.time_period ?? timePeriod,
            product_list: overrides.product_list ?? productList,
        };

        if (!next.start_date || !next.end_date) return;
        fetchReport(next);
    }, [startDate, endDate, warehouseId, timePeriod, productList, fetchReport]);

    const scheduleProductListReload = useCallback((value) => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
            reloadWithParams({ product_list: value });
        }, 600);
    }, [reloadWithParams]);

    useEffect(() => () => {
        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
    }, []);

    if (!canView) {
        return (
            <PageLayout title="Sale Report Chart">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Sale Report Chart">
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                <FormRow>
                    <FormField label="Start Date">
                        <TextInput
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStartDate(value);
                                reloadWithParams({ start_date: value });
                            }}
                        />
                    </FormField>
                    <FormField label="End Date">
                        <TextInput
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEndDate(value);
                                reloadWithParams({ end_date: value });
                            }}
                        />
                    </FormField>
                    <FormField label="Warehouse">
                        <SelectInput
                            value={warehouseId}
                            onChange={(e) => {
                                const value = e.target.value;
                                setWarehouseId(value);
                                reloadWithParams({ warehouse_id: value });
                            }}
                            options={warehouseOptions}
                        />
                    </FormField>
                    <FormField label="Time Period">
                        <SelectInput
                            value={timePeriod}
                            onChange={(e) => {
                                const value = e.target.value;
                                setTimePeriod(value);
                                reloadWithParams({ time_period: value });
                            }}
                            options={TIME_PERIOD_OPTIONS}
                        />
                    </FormField>
                    <FormField label="Product List">
                        <TextInput
                            value={productList}
                            placeholder="Type product code separated by comma"
                            onChange={(e) => {
                                const value = e.target.value;
                                setProductList(value);
                                scheduleProductListReload(value);
                            }}
                            onKeyDown={() => {
                                if (typingTimerRef.current) {
                                    clearTimeout(typingTimerRef.current);
                                }
                            }}
                        />
                    </FormField>
                </FormRow>
            </div>

            <div className="ui-card" style={{ padding: '20px 24px' }}>
                {loadError && (
                    <p className="text-warning text-center mb-3" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                )}

                {loading ? (
                    <p className="text-muted text-center mb-0">Loading chart…</p>
                ) : (
                    <>
                        <SaleReportLineChart
                            datePoints={datePoints}
                            soldQty={soldQty}
                            label={chartLabel}
                            theme={theme}
                        />
                        {datePoints.length > 0 && (
                            <div className="table-responsive mt-4">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th style={{ textAlign: 'right' }}>Sold Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {datePoints.map((point, index) => (
                                            <tr key={`${point}-${index}`}>
                                                <td>{point}</td>
                                                <td style={{ textAlign: 'right' }}>{soldQty[index] ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageLayout>
    );
}
