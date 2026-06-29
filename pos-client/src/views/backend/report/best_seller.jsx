import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Chart,
    BarController,
    BarElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    PageLayout,
    FormField,
    SelectInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

function canViewBestSeller() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('best-seller') ?? false;
}

function BestSellerChart({ items, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const color = theme?.color ?? '#733686';
    const colorRgba = theme?.color_rgba ?? 'rgba(115, 54, 134, 0.8)';

    useEffect(() => {
        if (!canvasRef.current || !items?.length) return;

        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: 'bar',
            data: {
                labels: items.map((item) => item.month),
                datasets: [
                    {
                        label: 'Sale Qty',
                        data: items.map((item) => Number(item.sold_qty ?? 0)),
                        backgroundColor: items.map(() => colorRgba),
                        borderColor: items.map(() => color),
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            afterLabel(context) {
                                const product = items[context.dataIndex]?.product;
                                return product ? `Product: ${product}` : 'No sales';
                            },
                        },
                    },
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
    }, [items, color, colorRgba]);

    return (
        <canvas
            ref={canvasRef}
            style={{ maxHeight: 420, width: '100%' }}
        />
    );
}

export default function BackendReportBestSeller() {
    const { toast, showToast } = useToast();
    const canView = canViewBestSeller();

    const [warehouses, setWarehouses] = useState([]);
    const [warehouseId, setWarehouseId] = useState('0');
    const [items, setItems] = useState([]);
    const [startMonth, setStartMonth] = useState('');
    const [endMonth, setEndMonth] = useState('');
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        })),
    ], [warehouses]);

    const applyPayload = useCallback((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setStartMonth(data.start_month ?? '');
        setEndMonth(data.end_month ?? '');
        setTheme(data.theme ?? null);
        if (Array.isArray(data.warehouses)) {
            setWarehouses(data.warehouses);
        }
        setWarehouseId(String(data.warehouse_id ?? '0'));
    }, []);

    const fetchReport = useCallback(async (nextWarehouseId) => {
        setLoading(true);
        setLoadError('');
        try {
            const payload = { warehouse_id: nextWarehouseId };
            const res = nextWarehouseId === '0'
                ? await api.get('report/best_seller')
                : await api.post('report/best_seller', payload);
            applyPayload(res.data ?? {});
        } catch (err) {
            setLoadError(err?.message || 'Failed to load best seller report.');
            showToast(err?.message || 'Failed to load best seller report.', 'error');
        } finally {
            setLoading(false);
        }
    }, [applyPayload, showToast]);

    useEffect(() => {
        if (canView) {
            fetchReport('0');
        } else {
            setLoading(false);
        }
    }, [canView, fetchReport]);

    const handleWarehouseChange = (event) => {
        const nextWarehouseId = event.target.value;
        setWarehouseId(nextWarehouseId);
        fetchReport(nextWarehouseId);
    };

    if (!canView) {
        return (
            <PageLayout title="Best Seller">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    const titleRange = startMonth && endMonth
        ? `${startMonth} - ${endMonth}`
        : '';

    return (
        <PageLayout title="Best Seller">
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 mb-3">
                    <h3 className="mb-0 text-center" style={{ fontSize: '1.1rem' }}>
                        Best Seller
                        {titleRange ? ` From ${titleRange}` : ''}
                    </h3>
                    <div style={{ minWidth: 220 }}>
                        <FormField label="Warehouse">
                            <SelectInput
                                value={warehouseId}
                                onChange={handleWarehouseChange}
                                options={warehouseOptions}
                            />
                        </FormField>
                    </div>
                </div>

                {loadError && (
                    <p className="text-warning text-center mb-3" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                )}

                {loading ? (
                    <p className="text-muted text-center mb-0">Loading chart…</p>
                ) : (
                    <>
                        <BestSellerChart items={items} theme={theme} />
                        {items.length > 0 && (
                            <div className="table-responsive mt-4">
                                <table className="ui-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Best Seller Product</th>
                                            <th style={{ textAlign: 'right' }}>Sold Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.month}>
                                                <td>{item.month}</td>
                                                <td>{item.product || '—'}</td>
                                                <td style={{ textAlign: 'right' }}>{item.sold_qty ?? 0}</td>
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
