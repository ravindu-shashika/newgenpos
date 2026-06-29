import React, { useState, useEffect, useMemo } from 'react';

import {
    PageLayout,
    DataTable,
    Toast,
    useToast,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import { permissionsBypassed } from '../../../config/permissions';

const PAGE_SIZES = [10, 25, 50];

function canViewNotifications() {
    if (permissionsBypassed()) return true;
    const perms = authStore.getPermissions() || [];
    return perms.includes('all_notification');
}

const NotificationList = () => {
    const canView = canViewNotifications();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [search, setSearch] = useState('');

    const { toast, showToast } = useToast();

    useEffect(() => {
        if (canView) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canView]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get('notifications');
            const data = res.data?.data ?? res.data ?? [];
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load notifications.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredNotifications = useMemo(() => {
        let list = [...notifications];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (n) =>
                    (n.from_user_name || '').toLowerCase().includes(low) ||
                    (n.to_user_name || '').toLowerCase().includes(low) ||
                    (n.message || '').toLowerCase().includes(low) ||
                    (n.document_name || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'date_label') {
                valA = a.date_label || a.created_at || '';
                valB = b.date_label || b.created_at || '';
            }
            valA = (valA ?? '').toString().toLowerCase();
            valB = (valB ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [notifications, search, sortCol, sortDir]);

    const paginatedNotifications = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredNotifications.slice(start, start + pageSize);
    }, [filteredNotifications, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));

    const columns = [
        {
            key: 'date_label',
            label: 'Date',
            sortable: true,
            render: (row) => row.date_label || '—',
        },
        {
            key: 'from_user_name',
            label: 'From',
            sortable: true,
            render: (row) => row.from_user_name || '—',
        },
        {
            key: 'to_user_name',
            label: 'To',
            sortable: true,
            render: (row) => row.to_user_name || '—',
        },
        {
            key: 'document_name',
            label: 'Document',
            render: (row) =>
                row.document_url ? (
                    <a href={row.document_url} target="_blank" rel="noopener noreferrer">
                        Open
                    </a>
                ) : (
                    'N/A'
                ),
        },
        {
            key: 'message',
            label: 'Message',
            sortable: true,
            render: (row) => (
                <span
                    style={{
                        display: 'inline-block',
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    title={row.message}
                >
                    {row.message || '—'}
                </span>
            ),
        },
        {
            key: 'reminder_date_label',
            label: 'Reminder Date',
            render: (row) => row.reminder_date_label || 'N/A',
        },
        {
            key: 'is_read',
            label: 'Status',
            render: (row) =>
                row.is_read ? (
                    <span className="ui-badge success">Read</span>
                ) : (
                    <span className="ui-badge warning">Unread</span>
                ),
        },
    ];

    if (!canView) {
        return (
            <PageLayout title="All Notification">
                <p className="text-muted">You do not have permission to view notifications.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="All Notification">
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by user, message, or document…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedNotifications}
                loading={loading}
                emptyText="No notifications found"
                emptyIcon="🔔"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(col) => {
                    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                    else {
                        setSortCol(col);
                        setSortDir('asc');
                    }
                }}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizes={PAGE_SIZES}
                totalRows={filteredNotifications.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </PageLayout>
    );
};

export default NotificationList;
