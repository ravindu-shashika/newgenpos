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

const BASED_ON_OPTIONS = [
    { value: 'created_at', label: 'Created Date' },
    { value: 'closing_date', label: 'Closing Date' },
];

const NUMERIC_KEYS = [
    'sales_amount',
    'cash_payment',
    'online_payment',
    'cheque_payment',
    'shipping_income',
    'delivery_charge',
    'net',
    'net_cash',
];

function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) return Number(0).toFixed(decimal);
    return n.toFixed(decimal);
}

function sumRows(rows, key) {
    return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

export default function BackendReportChallanReport() {
    const { toast, showToast } = useToast();

    const [basedOn, setBasedOn] = useState('created_at');
    const [startingDate, setStartingDate] = useState('');
    const [endingDate, setEndingDate] = useState('');
    const [decimal, setDecimal] = useState(2);

    const [allRows, setAllRows] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const fetchReport = useCallback(async (params = {}) => {
        setLoading(true);
        setLoadError('');
        try {
            const query = new URLSearchParams();
            if (params.starting_date) query.set('starting_date', params.starting_date);
            if (params.ending_date) query.set('ending_date', params.ending_date);
            if (params.based_on) query.set('based_on', params.based_on);

            const suffix = query.toString() ? `?${query.toString()}` : '';
            const res = await api.get(`report/challan-report${suffix}`);
            const data = res.data ?? {};

            setBasedOn(data.based_on || 'created_at');
            setStartingDate(data.starting_date || params.starting_date);
            setEndingDate(data.ending_date || params.ending_date);
            setDecimal(Number(data.decimal ?? 2));
            setAllRows(Array.isArray(data.rows) ? data.rows : []);
            setPage(1);
            setSelected(new Set());
        } catch (err) {
            setAllRows([]);
            const message = err?.message || 'Failed to load challan report.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const totalPages = pageSize === -1
        ? 1
        : Math.max(1, Math.ceil(allRows.length / pageSize) || 1);

    const pageRows = useMemo(() => {
        if (pageSize === -1) return allRows;
        const start = (page - 1) * pageSize;
        return allRows.slice(start, start + pageSize);
    }, [allRows, page, pageSize]);

    const totalsSource = useMemo(() => {
        if (selected.size === 0) return pageRows;
        return pageRows.filter((row) => selected.has(row.id));
    }, [pageRows, selected]);

    const totals = useMemo(() => {
        const next = {};
        NUMERIC_KEYS.forEach((key) => {
            next[key] = sumRows(totalsSource, key);
        });
        return next;
    }, [totalsSource]);

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

    const handleFilterChange = (next) => {
        if (!next.starting_date || !next.ending_date) return;
        fetchReport(next);
    };

    const columns = useMemo(() => [
        { key: 'challan_no', label: 'Challan No' },
        { key: 'order_no', label: 'Order No' },
        { key: 'order_date', label: 'Order Date' },
        { key: 'code', label: 'Code' },
        { key: 'delivery_date', label: 'Delivery Date' },
        {
            key: 'sales_amount',
            label: 'Sales Amount',
            align: 'right',
            render: (row) => formatMoney(row.sales_amount, decimal),
        },
        {
            key: 'cash_payment',
            label: 'Cash Payment',
            align: 'right',
            render: (row) => formatMoney(row.cash_payment, decimal),
        },
        {
            key: 'online_payment',
            label: 'Online Payment',
            align: 'right',
            render: (row) => formatMoney(row.online_payment, decimal),
        },
        {
            key: 'cheque_payment',
            label: 'Cheque Payment',
            align: 'right',
            render: (row) => formatMoney(row.cheque_payment, decimal),
        },
        {
            key: 'shipping_income',
            label: 'Shipping Income',
            align: 'right',
            render: (row) => formatMoney(row.shipping_income, decimal),
        },
        {
            key: 'delivery_charge',
            label: 'Delivery Charge',
            align: 'right',
            render: (row) => formatMoney(row.delivery_charge, decimal),
        },
        {
            key: 'net',
            label: 'Net',
            align: 'right',
            render: (row) => formatMoney(row.net, decimal),
        },
        {
            key: 'net_cash',
            label: 'Net Cash',
            align: 'right',
            render: (row) => formatMoney(row.net_cash, decimal),
        },
    ], [decimal]);

    const footerCells = useMemo(() => [
        <td key="f-challan">Total:</td>,
        <td key="f-order" />,
        <td key="f-order-date" />,
        <td key="f-code" />,
        <td key="f-delivery-date" />,
        <td key="f-sales" className="cell-num">{formatMoney(totals.sales_amount, decimal)}</td>,
        <td key="f-cash" className="cell-num">{formatMoney(totals.cash_payment, decimal)}</td>,
        <td key="f-online" className="cell-num">{formatMoney(totals.online_payment, decimal)}</td>,
        <td key="f-cheque" className="cell-num">{formatMoney(totals.cheque_payment, decimal)}</td>,
        <td key="f-shipping" className="cell-num">{formatMoney(totals.shipping_income, decimal)}</td>,
        <td key="f-delivery" className="cell-num">{formatMoney(totals.delivery_charge, decimal)}</td>,
        <td key="f-net" className="cell-num">{formatMoney(totals.net, decimal)}</td>,
        <td key="f-net-cash" className="cell-num">{formatMoney(totals.net_cash, decimal)}</td>,
    ], [totals, decimal]);

    const handleExportCsv = () => {
        const headers = [
            'Challan No',
            'Order No',
            'Order Date',
            'Code',
            'Delivery Date',
            'Sales Amount',
            'Cash Payment',
            'Online Payment',
            'Cheque Payment',
            'Shipping Income',
            'Delivery Charge',
            'Net',
            'Net Cash',
        ];

        const exportRows = (selected.size ? totalsSource : allRows).map((row) => [
            row.challan_no ?? '',
            row.order_no ?? '',
            row.order_date ?? '',
            row.code ?? '',
            row.delivery_date ?? '',
            row.sales_amount ?? 0,
            row.cash_payment ?? 0,
            row.online_payment ?? 0,
            row.cheque_payment ?? 0,
            row.shipping_income ?? 0,
            row.delivery_charge ?? 0,
            row.net ?? 0,
            row.net_cash ?? 0,
        ]);

        const csv = [headers, ...exportRows]
            .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'challan-report.csv';
        link.click();
    };

    return (
        <PageLayout
            title="Challan Report"
            actions={(
                <button
                    type="button"
                    className="ui-btn secondary"
                    onClick={handleExportCsv}
                    disabled={loading || allRows.length === 0}
                >
                    Export CSV
                </button>
            )}
        >
            <Toast toast={toast} />

            <div className="ui-card mb-3" style={{ padding: '20px 24px' }}>
                <FormRow>
                    <FormField label="Based On">
                        <SelectInput
                            value={basedOn}
                            onChange={(e) => {
                                const nextBasedOn = e.target.value;
                                setBasedOn(nextBasedOn);
                                handleFilterChange({
                                    starting_date: startingDate,
                                    ending_date: endingDate,
                                    based_on: nextBasedOn,
                                });
                            }}
                            options={BASED_ON_OPTIONS}
                        />
                    </FormField>
                    <FormField label="Start Date">
                        <TextInput
                            type="date"
                            value={startingDate}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStartingDate(value);
                                handleFilterChange({
                                    starting_date: value,
                                    ending_date: endingDate,
                                    based_on: basedOn,
                                });
                            }}
                        />
                    </FormField>
                    <FormField label="End Date">
                        <TextInput
                            type="date"
                            value={endingDate}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEndingDate(value);
                                handleFilterChange({
                                    starting_date: startingDate,
                                    ending_date: value,
                                    based_on: basedOn,
                                });
                            }}
                        />
                    </FormField>
                </FormRow>
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
                emptyText="No closed challans found for the selected filters."
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

            {!loading && allRows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize === -1 ? allRows.length || 10 : pageSize}
                    totalRows={allRows.length}
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
