import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    PageLayout,
    TextInput,
    DataTable,
    Pagination,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function canViewProductExpiryReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('product-expiry-report') ?? false;
}

function productImageUrl(image) {
    const serverBase = (api.defaultPath || '').replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000';
    if (!image) return `${serverBase}/images/zummXD2dvAtI.png`;
    if (image === 'zummXD2dvAtI.png') return `${serverBase}/images/zummXD2dvAtI.png`;
    return `${serverBase}/images/product/${image}`;
}

function ExpiryBadge({ date, isExpired }) {
    const className = isExpired ? 'badge badge-danger' : 'badge badge-warning';
    return <span className={className}>{date}</span>;
}

export default function BackendReportProductExpiryReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewProductExpiryReport);

    const [allRows, setAllRows] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewProductExpiryReport())), []);

    const fetchReport = useCallback(async () => {
        if (!canView) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.get('report/product-expiry');
            const data = res.data ?? {};
            setAllRows(Array.isArray(data.rows) ? data.rows : []);
            setPage(1);
            setSelected(new Set());
        } catch (err) {
            setAllRows([]);
            const message = err?.message || 'Failed to load product expiry report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [canView, showToast]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return allRows;
        return allRows.filter((row) => [
            row.name,
            row.code,
            row.batch_no,
            row.expired_date,
            row.qty,
        ].some((value) => String(value ?? '').toLowerCase().includes(term)));
    }, [allRows, search]);

    const pageRows = useMemo(() => {
        if (pageSize === -1) return filteredRows;
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const columns = useMemo(() => [
        {
            key: 'image',
            label: 'Image',
            render: (row) => (
                <img
                    src={productImageUrl(row.image)}
                    alt={row.name || 'Product'}
                    height={80}
                    width={80}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    onError={(e) => {
                        e.currentTarget.src = productImageUrl('');
                    }}
                />
            ),
        },
        { key: 'name', label: 'Product Name' },
        { key: 'code', label: 'Product Code' },
        { key: 'batch_no', label: 'Batch No' },
        {
            key: 'expired_date',
            label: 'Expiry Date',
            render: (row) => <ExpiryBadge date={row.expired_date} isExpired={row.is_expired} />,
        },
        { key: 'qty', label: 'Quantity', align: 'right' },
    ], []);

    if (!canView) {
        return (
            <PageLayout title="Product Expiry Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Product Expiry Report">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                </div>
            )}

            <DataTable
                columns={columns}
                rows={pageRows}
                rowKey="id"
                loading={loading}
                emptyText="No batch products found."
                selected={selected}
                onToggleRow={(id) => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                })}
                onToggleAll={() => {
                    if (selected.size === pageRows.length && pageRows.length) setSelected(new Set());
                    else setSelected(new Set(pageRows.map((r) => r.id)));
                }}
            />

            {!loading && filteredRows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredRows.length / pageSize))}
                    pageSize={pageSize === -1 ? filteredRows.length || 10 : pageSize}
                    totalRows={filteredRows.length}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, -1]}
                    onPageSize={(s) => { setPageSize(s); setPage(1); }}
                />
            )}
        </PageLayout>
    );
}
