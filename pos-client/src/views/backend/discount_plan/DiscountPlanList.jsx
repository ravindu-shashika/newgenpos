import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    PageLayout,
    DataTable,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../components/ui';
import { api } from '../../../services';
import usePermissions from '../../../stores/usePermissions';

const PAGE_SIZES = [10, 25, 50];

const DiscountPlanList = ({ controllerName }) => {
    const navigate = useNavigate();
    const ctrl = controllerName || 'discount-plans';
    const { canAdd, canEdit } = usePermissions(ctrl);

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const { toast, showToast } = useToast();

    useEffect(() => {
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const res = await api.get('discount-plans');
            const data = res.data?.data ?? res.data ?? [];
            setPlans(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load discount plans.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredPlans = useMemo(() => {
        let list = [...plans];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (p) =>
                    (p.name || '').toLowerCase().includes(low) ||
                    (p.customer_names || '').toLowerCase().includes(low) ||
                    (p.type || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'customers') {
                valA = a.customer_names || '';
                valB = b.customer_names || '';
            }
            valA = (valA ?? '').toString().toLowerCase();
            valB = (valB ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [plans, search, sortCol, sortDir]);

    const paginatedPlans = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredPlans.slice(start, start + pageSize);
    }, [filteredPlans, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'customers',
            label: 'Customer',
            sortable: true,
            render: (row) => row.customer_names || '—',
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (row) => {
                const type = row.type || '';
                return type.charAt(0).toUpperCase() + type.slice(1);
            },
        },
        {
            key: 'is_active',
            label: 'Status',
            render: (row) =>
                row.is_active ? (
                    <span className="ui-badge success">Active</span>
                ) : (
                    <span className="ui-badge warning">Inactive</span>
                ),
        },
        {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (row) => (
                <ActionMenu
                    id={row.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && {
                            label: '✎ Edit',
                            onClick: () => navigate(`/discount-plans/${row.id}/edit`),
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    return (
        <PageLayout
            title="Discount Plan"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                canAdd ? (
                    <Link to="/discount-plans/create" className="ui-btn primary">
                        + Create Discount Plan
                    </Link>
                ) : null
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, customer, or type…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedPlans}
                loading={loading}
                emptyText="No discount plans found"
                emptyIcon="🏷️"
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
                totalRows={filteredPlans.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </PageLayout>
    );
};

export default DiscountPlanList;
