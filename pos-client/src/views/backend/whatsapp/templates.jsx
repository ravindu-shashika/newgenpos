import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PageLayout,
    DataTable,
    TextInput,
    ConfirmModal,
    Toast,
    Pagination,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

function canManageWhatsapp() {
    return permissionsBypassed()
        || authStore.getPermissions()?.includes('sidebar_whatsapp');
}

function formatLanguage(value) {
    if (value == null || value === '') return '—';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.code || value.language || JSON.stringify(value);
    return String(value);
}

function normalizeTemplates(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((tpl, index) => ({
        id: tpl.name || `template-${index}`,
        name: tpl.name ?? '—',
        language: formatLanguage(tpl.language),
        category: tpl.category ?? '—',
        status: tpl.status ?? '—',
    }));
}

export default function WhatsappTemplates() {
    const canDelete = canManageWhatsapp();
    const { toast, showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [assetId, setAssetId] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteName, setDeleteName] = useState(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const res = await api.get('whatsapp/templates');
            const data = res.data ?? {};
            setAssetId(data.asset_id ?? null);
            setRows(normalizeTemplates(data.templates));
            if (data.error) {
                setLoadError(data.error);
            }
        } catch (err) {
            const message = err?.message || 'Failed to load WhatsApp templates.';
            setLoadError(message);
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((row) =>
            [row.name, row.language, row.category, row.status]
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize) || 1);
    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, pageSize]);

    const handleDelete = async () => {
        if (!deleteName) return;
        try {
            await api.delete(`whatsapp/template/delete/${encodeURIComponent(deleteName)}`);
            showToast('Template deleted successfully.', 'success');
            setDeleteName(null);
            fetchTemplates();
        } catch (err) {
            showToast(err?.message || 'Failed to delete template.', 'error');
        }
    };

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'language', label: 'Language' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        ...(canDelete
            ? [{
                key: 'actions',
                label: 'Action',
                render: (row) => (
                    <button
                        type="button"
                        className="ui-btn sm danger"
                        onClick={() => setDeleteName(row.name)}
                    >
                        Delete
                    </button>
                ),
            }]
            : []),
    ];

    return (
        <PageLayout title="Message Templates">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                {assetId && (
                    <a
                        href={`https://business.facebook.com/latest/whatsapp_manager/message_templates?asset_id=${assetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-btn primary"
                    >
                        Manage Template
                    </a>
                )}
                <Link to="/whatsapp/settings" className="ui-btn secondary">
                    WhatsApp Settings
                </Link>
                <div style={{ width: 260, marginLeft: 'auto' }}>
                    <TextInput
                        placeholder="Search templates…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px', borderColor: 'var(--ui-debit)' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                    {loadError.toLowerCase().includes('credential') && (
                        <Link to="/whatsapp/settings" className="ui-btn sm secondary mt-2">
                            Configure credentials
                        </Link>
                    )}
                </div>
            )}

            <DataTable
                columns={columns}
                rows={paginatedRows}
                rowKey="id"
                loading={loading}
                emptyText={loadError ? 'No templates to display.' : 'No templates found.'}
            />

            {!loading && filteredRows.length > 0 && (
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRows={filteredRows.length}
                    onChange={setPage}
                    pageSizes={[10, 25, 50, 100]}
                    onPageSize={(nextSize) => {
                        setPageSize(nextSize);
                        setPage(1);
                    }}
                />
            )}

            {deleteName && (
                <ConfirmModal
                    title="Delete template"
                    message={`Delete template "${deleteName}" from WhatsApp? This cannot be undone.`}
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteName(null)}
                />
            )}
        </PageLayout>
    );
}
