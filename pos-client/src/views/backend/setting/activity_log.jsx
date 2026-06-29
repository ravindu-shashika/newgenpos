import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    PageLayout,
    DataTable,
    TextInput,
    Toast,
    Pagination,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function canViewActivityLog() {
    if (permissionsBypassed()) return true;
    const roleId = authStore.getUser()?.role_id;
    if (roleId != null && Number(roleId) <= 2) {
        return authStore.getPermissions()?.includes('profit-loss') ?? false;
    }
    return true;
}

function formatDate(value, dateFormat = 'd-m-Y') {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value).split('T')[0] || String(value);
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return dateFormat
        .replace('d', day)
        .replace('m', month)
        .replace('Y', String(year));
}

function formatDateTime(value, dateFormat = 'd-m-Y') {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const h12 = hours % 12 || 12;
    return `${formatDate(value, dateFormat)} ${h12}:${minutes} ${ampm}`;
}

function stripHtml(html) {
    if (!html) return '';
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent || el.innerText || '';
}

function escapeCsv(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export default function BackendSettingActivityLog() {
    const { toast, showToast } = useToast();
    const canView = canViewActivityLog();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [dateFormat, setDateFormat] = useState('d-m-Y');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState(new Set());

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('setting/activity-log');
            const data = res.data ?? {};
            setRows(Array.isArray(data.rows) ? data.rows : []);
            setDateFormat(data.date_format || 'd-m-Y');
        } catch (err) {
            showToast(err?.message || 'Failed to load activity log.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (canView) {
            fetchLogs();
        }
    }, [canView, fetchLogs]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((row) =>
            [
                row.date,
                row.username ?? row.user_name,
                row.action,
                row.reference_no,
                stripHtml(row.item_description),
            ].some((value) => String(value ?? '').toLowerCase().includes(term))
        );
    }, [rows, search]);

    const totalPages = pageSize === -1
        ? 1
        : Math.max(1, Math.ceil(filteredRows.length / pageSize) || 1);

    const paginatedRows = useMemo(() => {
        if (pageSize === -1) return filteredRows;
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === paginatedRows.length && paginatedRows.length > 0) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paginatedRows.map((row) => row.id)));
        }
    };

    const exportRows = useMemo(() => {
        if (selected.size === 0) return filteredRows;
        return filteredRows.filter((row) => selected.has(row.id));
    }, [filteredRows, selected]);

    const handleExportCsv = () => {
        const headers = ['Date', 'Username', 'Action', 'Reference No', 'Item Description', 'Created At'];
        const csvRows = exportRows.map((row) => [
            formatDate(row.date, dateFormat),
            row.username ?? row.user_name ?? '',
            row.action ?? '',
            row.reference_no ?? '',
            stripHtml(row.item_description),
            formatDateTime(row.created_at, dateFormat),
        ]);
        const csv = [headers, ...csvRows]
            .map((row) => row.map(escapeCsv).join(','))
            .join('\n');
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = 'activity-log.csv';
        link.click();
    };

    const columns = [
        {
            key: 'date',
            label: 'Date',
            render: (row) => formatDate(row.date, dateFormat),
        },
        {
            key: 'username',
            label: 'Username',
            render: (row) => row.username ?? row.user_name ?? '—',
        },
        { key: 'action', label: 'Action' },
        { key: 'reference_no', label: 'Reference No' },
        {
            key: 'item_description',
            label: 'Item Description',
            render: (row) => (
                row.item_description
                    ? (
                        <span
                            dangerouslySetInnerHTML={{ __html: row.item_description }}
                        />
                    )
                    : '—'
            ),
        },
        {
            key: 'created_at',
            label: 'Created At',
            render: (row) => formatDateTime(row.created_at, dateFormat),
        },
    ];

    if (!canView) {
        return (
            <PageLayout title="Activity Log">
                <p className="text-muted">You do not have permission to view the activity log.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout
            title="Activity Log"
            actions={(
                <>
                    <button
                        type="button"
                        className="ui-btn secondary"
                        onClick={handleExportCsv}
                        disabled={loading || exportRows.length === 0}
                    >
                        Export CSV
                    </button>
                    <button
                        type="button"
                        className="ui-btn secondary"
                        onClick={() => window.print()}
                        disabled={loading || filteredRows.length === 0}
                    >
                        Print
                    </button>
                </>
            )}
        >
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div style={{ width: 280, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search activity log…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                rows={paginatedRows}
                rowKey="id"
                loading={loading}
                emptyText="No activity log entries found."
                selected={selected}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
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
                    }}
                />
            )}
        </PageLayout>
    );
}
