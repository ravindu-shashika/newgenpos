import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import ProfitLossResult from './profit_loss_result';

function canViewProfitLoss() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('profit-loss') ?? false;
}

export default function BackendReportProfitLoss() {
    const { toast, showToast } = useToast();
    const canView = canViewProfitLoss();

    const [warehouses, setWarehouses] = useState([]);
    const [warehouseId, setWarehouseId] = useState('0');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [formLoading, setFormLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [result, setResult] = useState(null);

    const warehouseOptions = useMemo(() => [
        { value: '0', label: 'All Warehouse' },
        ...warehouses.map((warehouse) => ({
            value: String(warehouse.id),
            label: warehouse.name,
        })),
    ], [warehouses]);

    const fetchReport = useCallback(async (params) => {
        if (!params.start_date || !params.end_date) return;

        setLoading(true);
        setLoadError('');
        try {
            const res = await api.post('report/profit-loss', {
                start_date: params.start_date,
                end_date: params.end_date,
                warehouse_id: params.warehouse_id ?? '0',
            });
            setResult(res.data ?? null);
        } catch (err) {
            setResult(null);
            const message = err?.message || 'Failed to load profit / loss report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!canView) {
            setFormLoading(false);
            return;
        }

        const load = async () => {
            setFormLoading(true);
            setLoadError('');
            try {
                const res = await api.get('report/profit-loss');
                const data = res.data ?? {};
                setWarehouses(Array.isArray(data.warehouses) ? data.warehouses : []);
                const start = data.start_date || '';
                const end = data.end_date || '';
                const warehouse = String(data.warehouse_id ?? '0');
                setStartDate(start);
                setEndDate(end);
                setWarehouseId(warehouse);
                if (start && end) {
                    await fetchReport({
                        start_date: start,
                        end_date: end,
                        warehouse_id: warehouse,
                    });
                }
            } catch (err) {
                const message = err?.message || 'Failed to load profit / loss form.';
                setLoadError(message);
                showToast(message, 'error');
            } finally {
                setFormLoading(false);
            }
        };

        load();
    }, [canView, fetchReport, showToast]);

    const handleWarehouseChange = (event) => {
        const nextWarehouse = event.target.value;
        setWarehouseId(nextWarehouse);
        fetchReport({
            start_date: startDate,
            end_date: endDate,
            warehouse_id: nextWarehouse,
        });
    };

    const handleDateChange = (field) => (event) => {
        const value = event.target.value;
        const next = {
            start_date: field === 'start_date' ? value : startDate,
            end_date: field === 'end_date' ? value : endDate,
            warehouse_id: warehouseId,
        };
        if (field === 'start_date') setStartDate(value);
        else setEndDate(value);
        if (next.start_date && next.end_date) {
            fetchReport(next);
        }
    };

    if (!canView) {
        return (
            <PageLayout title="Profit / Loss Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Profit / Loss Report">
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                {formLoading ? (
                    <p className="text-muted mb-0">Loading filters…</p>
                ) : (
                    <FormRow>
                        <FormField label="Warehouse">
                            <SelectInput
                                value={warehouseId}
                                onChange={handleWarehouseChange}
                                options={warehouseOptions}
                            />
                        </FormField>
                        <FormField label="Start Date">
                            <TextInput
                                type="date"
                                value={startDate}
                                onChange={handleDateChange('start_date')}
                                required
                            />
                        </FormField>
                        <FormField label="End Date">
                            <TextInput
                                type="date"
                                value={endDate}
                                onChange={handleDateChange('end_date')}
                                required
                            />
                        </FormField>
                    </FormRow>
                )}
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                </div>
            )}

            {loading && (
                <p className="text-muted">Loading results…</p>
            )}

            {!loading && result && (
                <div style={{ opacity: loading ? 0.4 : 1 }}>
                    <ProfitLossResult data={result} />
                </div>
            )}
        </PageLayout>
    );
}
