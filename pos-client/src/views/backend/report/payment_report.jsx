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
    SelectInput,
    TextInput,
    DataTable,
    Pagination,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

const DEFAULT_PAYMENT_METHODS = [
    { value: '', label: 'All' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Bank', label: 'Bank' },
    { value: 'Cheque', label: 'Cheque' },
    { value: 'Moneipoint', label: 'Moneipoint' },
    { value: 'Pesapal', label: 'Pesapal' },
    { value: 'Points', label: 'Points' },
];

function canViewPaymentReport() {
    if (permissionsBypassed()) return true;
    return authStore.getPermissions()?.includes('payment-report') ?? false;
}

function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) return Number(0).toFixed(decimal);
    return n.toFixed(decimal);
}

function sumRows(rows, key) {
    return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function CreatedByCell({ name, email }) {
    if (!name && !email) return '—';
    return (
        <span>
            {name || '—'}
            {email ? (
                <>
                    <br />
                    {email}
                </>
            ) : null}
        </span>
    );
}

export default function BackendReportPaymentReport() {
    const { toast, showToast } = useToast();
    const [canView, setCanView] = useState(canViewPaymentReport);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentMethodOptions, setPaymentMethodOptions] = useState(DEFAULT_PAYMENT_METHODS);
    const [decimal, setDecimal] = useState(2);

    const [allRows, setAllRows] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => authStore.subscribe(() => setCanView(canViewPaymentReport())), []);

    const fetchReport = useCallback(async (params = {}) => {
        setLoading(true);
        setLoadError('');
        try {
            const payload = {
                start_date: params.start_date,
                end_date: params.end_date,
                payment_method: params.payment_method ?? '',
            };

            const res = params.useGet
                ? await api.get('report/payment_report_by_date')
                : await api.post('report/payment_report_by_date', payload);

            const data = res.data ?? {};
            setStartDate(data.start_date || '');
            setEndDate(data.end_date || '');
            setPaymentMethod(data.payment_method ?? '');
            setDecimal(Number(data.decimal ?? 2));
            setAllRows(Array.isArray(data.rows) ? data.rows : []);
            if (Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
                setPaymentMethodOptions(data.payment_methods);
            }
            setPage(1);
            setSelected(new Set());
        } catch (err) {
            setAllRows([]);
            const message = err?.message || 'Failed to load payment report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!canView) {
            setLoading(false);
            return;
        }

        fetchReport({ useGet: true });
    }, [canView, fetchReport]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return allRows;

        return allRows.filter((row) => [
            row.date,
            row.payment_reference,
            row.sale_reference,
            row.purchase_reference,
            row.paying_method,
            row.created_by_name,
            row.created_by_email,
            row.amount,
        ].some((value) => String(value ?? '').toLowerCase().includes(term)));
    }, [allRows, search]);

    const totalPages = pageSize === -1
        ? 1
        : Math.max(1, Math.ceil(filteredRows.length / pageSize) || 1);

    const pageRows = useMemo(() => {
        if (pageSize === -1) return filteredRows;
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const totalsSource = useMemo(() => {
        if (selected.size === 0) return pageRows;
        return pageRows.filter((row) => selected.has(row.id));
    }, [pageRows, selected]);

    const totalAmount = useMemo(
        () => sumRows(totalsSource, 'amount'),
        [totalsSource],
    );

    const reloadWithParams = useCallback((overrides = {}) => {
        const next = {
            start_date: overrides.start_date ?? startDate,
            end_date: overrides.end_date ?? endDate,
            payment_method: overrides.payment_method ?? paymentMethod,
        };

        if (!next.start_date || !next.end_date) return;
        fetchReport(next);
    }, [startDate, endDate, paymentMethod, fetchReport]);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === pageRows.length && pageRows.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(pageRows.map((row) => row.id)));
        }
    };

    const columns = useMemo(() => [
        { key: 'date', label: 'Date' },
        { key: 'payment_reference', label: 'Payment Reference' },
        { key: 'sale_reference', label: 'Sale Reference' },
        { key: 'purchase_reference', label: 'Purchase Reference' },
        { key: 'paying_method', label: 'Paid By' },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: (row) => formatMoney(row.amount, decimal),
        },
        {
            key: 'created_by',
            label: 'Created By',
            render: (row) => (
                <CreatedByCell
                    name={row.created_by_name}
                    email={row.created_by_email}
                />
            ),
        },
    ], [decimal]);

    const footerCells = useMemo(() => [
        <td key="f-date">Total:</td>,
        <td key="f-payment-ref" />,
        <td key="f-sale-ref" />,
        <td key="f-purchase-ref" />,
        <td key="f-paid-by" />,
        <td key="f-amount" className="cell-num">{formatMoney(totalAmount, decimal)}</td>,
        <td key="f-created-by" />,
    ], [totalAmount, decimal]);

    const handleExportCsv = () => {
        const headers = [
            'Date',
            'Payment Reference',
            'Sale Reference',
            'Purchase Reference',
            'Paid By',
            'Amount',
            'Created By',
            'Email',
        ];

        const exportRows = (selected.size ? totalsSource : filteredRows).map((row) => [
            row.date ?? '',
            row.payment_reference ?? '',
            row.sale_reference ?? '',
            row.purchase_reference ?? '',
            row.paying_method ?? '',
            row.amount ?? 0,
            row.created_by_name ?? '',
            row.created_by_email ?? '',
        ]);

        const csv = [headers, ...exportRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'payment-report.csv';
        link.click();
    };

    if (!canView) {
        return (
            <PageLayout title="Payment Report">
                <p className="text-muted">You do not have permission to view this report.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Payment Report"
            actions={(
                <button
                    type="button"
                    className="ui-btn secondary"
                    onClick={handleExportCsv}
                    disabled={loading || filteredRows.length === 0}
                >
                    Export CSV
                </button>
            )}
        >
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
                    <FormField label="Payment Method">
                        <SelectInput
                            value={paymentMethod}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPaymentMethod(value);
                                reloadWithParams({ payment_method: value });
                            }}
                            options={paymentMethodOptions}
                        />
                    </FormField>
                </FormRow>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search payments…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
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
                emptyText="No payments found for the selected filters."
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                footer={(
                    <>
                        <td />
                        {footerCells}
                    </>
                )}
            />

            {!loading && filteredRows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize === -1 ? filteredRows.length || 10 : pageSize}
                    totalRows={filteredRows.length}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, -1]}
                    onPageSize={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(1);
                        setSelected(new Set());
                    }}
                />
            )}
        </PageLayout>
    );
}
