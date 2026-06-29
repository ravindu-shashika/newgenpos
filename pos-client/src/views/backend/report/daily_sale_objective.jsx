import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    PageLayout,
    FormField,
    FormRow,
    TextInput,
    DataTable,
    Pagination,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function canViewDailySaleObjective() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('dso-report') ?? false;
}

export default function BackendReportDailySaleObjective() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewDailySaleObjective);

    const [startingDate, setStartingDate] = useState('');
    const [endingDate, setEndingDate] = useState('');
    const [formLoading, setFormLoading] = useState(true);

    const [rows, setRows] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewDailySaleObjective())), []);

    useEffect(() => {
        if (!canView) {
            setFormLoading(false);
            return;
        }
        const load = async () => {
            setFormLoading(true);
            try {
                const res = await api.get('report/daily-sale-objective');
                const data = res.data ?? {};
                setStartingDate(data.starting_date || '');
                setEndingDate(data.ending_date || '');
            } catch (err) {
                showToast(err?.message || 'Failed to load daily sale objective report.', 'error');
            } finally {
                setFormLoading(false);
            }
        };
        load();
    }, [canView, showToast]);

    const fetchRows = useCallback(async () => {
        if (!startingDate || !endingDate || formLoading) return;
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.post('report/daily-sale-objective-data', {
                draw: page,
                start: pageSize === -1 ? 0 : (page - 1) * pageSize,
                length: pageSize === -1 ? -1 : pageSize,
                search: { value: search },
                order: [{ column: 1, dir: 'desc' }],
                starting_date: startingDate,
                ending_date: endingDate,
            });
            const data = res.data ?? {};
            setRows((data.data ?? []).map((row, index) => ({
                ...row,
                id: row.id ?? `dso-${row.key ?? index}-${index}`,
            })));
            setTotalRows(Number(data.recordsFiltered ?? data.recordsTotal ?? 0));
            setSelected(new Set());
        } catch (err) {
            setRows([]);
            setTotalRows(0);
            setLoadError(err?.message || 'Failed to load daily sale objective data.');
        } finally {
            setLoading(false);
        }
    }, [startingDate, endingDate, formLoading, page, pageSize, search]);

    useEffect(() => { setPage(1); }, [startingDate, endingDate]);
    useEffect(() => { fetchRows(); }, [fetchRows]);

    const columns = useMemo(() => [
        { key: 'date', label: 'Date' },
        { key: 'product_info', label: 'Product Info' },
        { key: 'number_of_products', label: 'Number of Products', align: 'right' },
    ], []);

    if (!canView) {
        return (
            <PageLayout title="Daily Sale Objective Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Daily Sale Objective Report">
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                {formLoading ? <p className="text-muted mb-0">Loading filters…</p> : (
                    <FormRow>
                        <FormField label="Start Date">
                            <TextInput type="date" value={startingDate} onChange={(e) => setStartingDate(e.target.value)} />
                        </FormField>
                        <FormField label="End Date">
                            <TextInput type="date" value={endingDate} onChange={(e) => setEndingDate(e.target.value)} />
                        </FormField>
                    </FormRow>
                )}
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                </div>
            )}

            <DataTable
                columns={columns}
                rows={rows}
                rowKey="id"
                loading={loading || formLoading}
                emptyText="No daily sale objective records found."
                selected={selected}
                onToggleRow={(id) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                })}
                onToggleAll={() => {
                    if (selected.size === rows.length && rows.length) setSelected(new Set());
                    else setSelected(new Set(rows.map((r) => r.id)));
                }}
            />

            {!loading && !formLoading && totalRows > 0 && (
                <Pagination
                    page={page}
                    totalPages={pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRows / pageSize))}
                    pageSize={pageSize === -1 ? totalRows || 10 : pageSize}
                    totalRows={totalRows}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, -1]}
                    onPageSize={(s) => { setPageSize(s); setPage(1); }}
                />
            )}
        </PageLayout>
    );
}
