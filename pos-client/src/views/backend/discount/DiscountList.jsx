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

const DiscountList = ({ controllerName }) => {
    const navigate = useNavigate();
    const ctrl = controllerName || 'discounts';
    const { canAdd, canEdit } = usePermissions(ctrl);

    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState(null);

    const { toast, showToast } = useToast();

    useEffect(() => {
        fetchDiscounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const res = await api.get('discounts');
            const data = res.data?.data ?? res.data ?? [];
            setDiscounts(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load discounts.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredDiscounts = useMemo(() => {
        let list = [...discounts];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(
                (d) =>
                    (d.name || '').toLowerCase().includes(low) ||
                    (d.discount_plan_names || '').toLowerCase().includes(low) ||
                    (d.product_labels || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];
            if (sortCol === 'discount_plans') {
                valA = a.discount_plan_names || '';
                valB = b.discount_plan_names || '';
            }
            if (sortCol === 'products') {
                valA = a.product_labels || '';
                valB = b.product_labels || '';
            }
            valA = (valA ?? '').toString().toLowerCase();
            valB = (valB ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [discounts, search, sortCol, sortDir]);

    const paginatedDiscounts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredDiscounts.slice(start, start + pageSize);
    }, [filteredDiscounts, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredDiscounts.length / pageSize));

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        {
            key: 'value_label',
            label: 'Value',
            sortable: true,
            render: (row) => row.value_label || '—',
        },
        {
            key: 'discount_plans',
            label: 'Discount Plan',
            sortable: true,
            render: (row) => row.discount_plan_names || '—',
        },
        {
            key: 'validity_label',
            label: 'Validity',
            render: (row) => row.validity_label || '—',
        },
        {
            key: 'days_label',
            label: 'Days',
            render: (row) => row.days_label || '—',
        },
        {
            key: 'products',
            label: 'Products',
            render: (row) => (
                <span title={row.product_labels}>{row.product_labels || '—'}</span>
            ),
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
                            onClick: () => navigate(`/discounts/${row.id}/edit`),
                        },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    return (
        <PageLayout
            title="Discount"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                canAdd ? (
                    <Link to="/discounts/create" className="ui-btn primary">
                        + Create Discount
                    </Link>
                ) : null
            }
        >
            <Toast toast={toast} />

            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by name, plan, or product…"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedDiscounts}
                loading={loading}
                emptyText="No discounts found"
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
                totalRows={filteredDiscounts.length}
                onChange={setPage}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </PageLayout>
    );
};

export default DiscountList;
