import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Chart,
    PieController,
    ArcElement,
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
import { formatMoney } from './reportHelpers.jsx';

Chart.register(PieController, ArcElement, Tooltip, Legend);

function canViewWarehouseStockReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('warehouse-stock-report') ?? false;
}

function StockPieChart({ price, cost, profit, labels, theme }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    const color = theme?.color ?? '#733686';
    const colorRgba = theme?.color_rgba ?? 'rgba(115, 54, 134, 0.8)';

    useEffect(() => {
        if (!canvasRef.current) return;

        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: 'pie',
            data: {
                labels: labels ?? ['Stock Value by Price', 'Stock Value by Cost', 'Estimate Profit'],
                datasets: [{
                    data: [price, cost, profit],
                    borderWidth: 1,
                    backgroundColor: [color, '#ff8952', '#858c85'],
                    hoverBackgroundColor: [colorRgba, 'rgba(255, 137, 82, 0.8)', 'rgba(133, 140, 133, 0.8)'],
                    hoverBorderWidth: 4,
                    hoverBorderColor: [colorRgba, 'rgba(255, 137, 82, 0.8)', 'rgba(133, 140, 133, 0.8)'],
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const value = context.parsed ?? 0;
                                return `${context.label}: ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            },
                        },
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [price, cost, profit, labels, color, colorRgba]);

    return (
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}

export default function BackendReportWarehouseStock() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewWarehouseStockReport);

    const [warehouses, setWarehouses] = useState([]);
    const [warehouseId, setWarehouseId] = useState('0');
    const [decimal, setDecimal] = useState(2);
    const [totalItem, setTotalItem] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [estimateProfit, setEstimateProfit] = useState(0);
    const [labels, setLabels] = useState([]);
    const [theme, setTheme] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => authStore.subscribe(() => setCanView(canViewWarehouseStockReport())), []);

    const loadData = useCallback(async (selectedWarehouseId) => {
        setLoading(true);
        try {
            const res = await api.get('report/warehouse_stock', {
                params: { warehouse_id: selectedWarehouseId },
            });
            const data = res.data ?? {};
            setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
            setWarehouseId(String(data.warehouse_id ?? selectedWarehouseId ?? 0));
            setDecimal(Number(data.decimal ?? 2));
            setTotalItem(Number(data.total_item ?? 0));
            setTotalQty(Number(data.total_qty ?? 0));
            setTotalPrice(Number(data.total_price ?? 0));
            setTotalCost(Number(data.total_cost ?? 0));
            setEstimateProfit(Number(data.estimate_profit ?? 0));
            setLabels(Array.isArray(data.labels) ? data.labels : []);
            setTheme(data.theme ?? null);
        } catch (err) {
            showToast(err?.message || 'Failed to load warehouse stock chart.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!canView) { setLoading(false); return; }
        loadData(warehouseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canView]);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
    ], [warehouses]);

    const handleWarehouseChange = (e) => {
        const nextId = e.target.value;
        setWarehouseId(nextId);
        loadData(nextId);
    };

    if (!canView) {
        return (
            <PageLayout title="Stock Chart">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Stock Chart">
            <Toast toast={toast} />
            <div className="ui-card" style={{ padding: '24px' }}>
                <div className="text-center mb-4" style={{ maxWidth: 480, margin: '0 auto' }}>
                    <h3 className="mb-1">Stock Chart</h3>
                    <p className="text-muted mb-3">Select warehouse to view chart</p>
                    <FormField label="Warehouse">
                        <SelectInput
                            value={warehouseId}
                            onChange={handleWarehouseChange}
                            options={warehouseOptions}
                            disabled={loading}
                        />
                    </FormField>
                </div>

                {loading ? (
                    <p className="text-muted text-center">Loading…</p>
                ) : (
                    <>
                        <div className="row mb-4" style={{ maxWidth: 480, margin: '0 auto' }}>
                            <div className="col-md-6 text-center mb-3">
                                <span className="text-muted">Total Items</span>
                                <h2 className="mb-0"><strong>{formatMoney(totalItem, decimal)}</strong></h2>
                            </div>
                            <div className="col-md-6 text-center mb-3">
                                <span className="text-muted">Total Quantity</span>
                                <h2 className="mb-0"><strong>{formatMoney(totalQty, decimal)}</strong></h2>
                            </div>
                        </div>

                        <StockPieChart
                            price={totalPrice}
                            cost={totalCost}
                            profit={estimateProfit}
                            labels={labels}
                            theme={theme}
                        />
                    </>
                )}
            </div>
        </PageLayout>
    );
}
