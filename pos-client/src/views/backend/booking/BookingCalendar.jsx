import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    SelectInput,
    TextInput,
    NumberInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
    FormField,
    FormRow,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';
import './bookingCalendar.css';

const STATUS_BADGE = {
    Booked: 'primary',
    Waiting: 'warning',
    Completed: 'success',
    Cancelled: 'danger',
};

const DEFAULT_FILTERS = {
    Booked: true,
    Waiting: true,
    Completed: true,
    Cancelled: true,
};

function emptyForm() {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const toLocal = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
        id: '',
        warehouse_id: '',
        customer_id: '',
        user_id: '',
        product_id: '',
        price: '',
        status: 'Booked',
        start_date: toLocal(now),
        end_date: toLocal(end),
        note: '',
    };
}

function hasBookingAccess(permissions) {
    const list = Array.isArray(permissions) ? permissions : [];
    return list.includes('booking') || list.some((p) => p.startsWith('booking'));
}

function StatusBadge({ status }) {
    return <span className={`booking-badge booking-badge-${STATUS_BADGE[status] || 'primary'}`}>{status}</span>;
}

export default function BookingCalendar() {
    const { toast, showToast } = useToast();
    const calendarRef = useRef(null);
    const canAccess = hasBookingAccess(authStore.getPermissions());

    const [tab, setTab] = useState('calendar');
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [statusFilters, setStatusFilters] = useState(DEFAULT_FILTERS);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [listFilters, setListFilters] = useState({
        warehouse_id: '0',
        status: '0',
        starting_date: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10),
        ending_date: new Date().toISOString().slice(0, 10),
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    const loadBootstrap = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('bookings/calendar');
            setMeta(res.data || {});
        } catch (err) {
            showToast(err?.message || 'Failed to load booking page.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const loadList = useCallback(async () => {
        setListLoading(true);
        try {
            const q = new URLSearchParams(listFilters);
            const res = await api.get(`bookings?${q}`);
            setRows(res.data?.data || []);
        } catch (err) {
            showToast(err?.message || 'Failed to load bookings.', 'error');
        } finally {
            setListLoading(false);
        }
    }, [listFilters, showToast]);

    useEffect(() => {
        if (canAccess) loadBootstrap();
        else setLoading(false);
    }, [canAccess, loadBootstrap]);

    useEffect(() => {
        if (tab === 'list' && canAccess) loadList();
    }, [tab, canAccess, loadList]);

    useEffect(() => {
        if (tab === 'calendar' && calendarRef.current) {
            calendarRef.current.getApi()?.updateSize();
        }
    }, [tab]);

    const activeStatuses = useMemo(
        () => Object.entries(statusFilters).filter(([, v]) => v).map(([k]) => k).join(','),
        [statusFilters]
    );

    const fetchEvents = useCallback(async (info, success, failure) => {
        try {
            const q = new URLSearchParams({
                start: info.startStr,
                end: info.endStr,
                status: activeStatuses || 'Booked,Waiting,Completed,Cancelled',
            });
            if (warehouseFilter) q.set('warehouse_id', warehouseFilter);
            const res = await api.get(`bookings/events?${q}`);
            success(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            failure(err);
        }
    }, [activeStatuses, warehouseFilter]);

    const refetchCalendar = () => calendarRef.current?.getApi()?.refetchEvents();

    useEffect(() => {
        if (tab === 'calendar') refetchCalendar();
    }, [activeStatuses, warehouseFilter, tab]);

    const openCreate = (startIso) => {
        const start = startIso ? new Date(startIso) : new Date();
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const pad = (d) => {
            const p = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
        };
        setForm({
            ...emptyForm(),
            warehouse_id: meta?.lock_warehouse_id ? String(meta.lock_warehouse_id) : (meta?.warehouses?.[0]?.id ? String(meta.warehouses[0].id) : ''),
            customer_id: meta?.customers?.[0]?.id ? String(meta.customers[0].id) : '',
            start_date: pad(start),
            end_date: pad(end),
        });
        setModalOpen(true);
    };

    const openEdit = async (id) => {
        try {
            const res = await api.get(`bookings/${id}`);
            const b = res.data || {};
            setForm({
                id: String(b.id),
                warehouse_id: String(b.warehouse_id || ''),
                customer_id: String(b.customer_id || ''),
                user_id: b.user_id ? String(b.user_id) : '',
                product_id: b.product_id ? String(b.product_id) : '',
                price: b.price ?? '',
                status: b.status || 'Booked',
                start_date: b.start_date_input || b.start_date?.slice(0, 16) || '',
                end_date: b.end_date_input || b.end_date?.slice(0, 16) || '',
                note: b.note || '',
            });
            setModalOpen(true);
        } catch (err) {
            showToast(err?.message || 'Could not load booking.', 'error');
        }
    };

    const onProductChange = (productId) => {
        const product = (meta?.service_products || []).find((p) => String(p.id) === String(productId));
        setForm((f) => ({
            ...f,
            product_id: productId,
            price: product?.price != null ? String(product.price) : f.price,
        }));
    };

    const saveBooking = async () => {
        if (!form.warehouse_id || !form.customer_id || !form.start_date || !form.end_date) {
            showToast('Warehouse, customer, and dates are required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                warehouse_id: form.warehouse_id,
                customer_id: form.customer_id,
                user_id: form.user_id || null,
                product_id: form.product_id || null,
                price: form.price || 0,
                status: form.status,
                start_date: form.start_date.replace('T', ' '),
                end_date: form.end_date.replace('T', ' '),
                note: form.note || '',
            };
            if (form.id) {
                await api.put(`bookings/${form.id}`, payload);
                showToast('Booking updated.', 'success');
            } else {
                await api.post('bookings', payload);
                showToast('Booking created.', 'success');
            }
            setModalOpen(false);
            refetchCalendar();
            if (tab === 'list') loadList();
        } catch (err) {
            showToast(err?.message || 'Save failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`bookings/${deleteTarget}`);
            showToast('Booking deleted.', 'success');
            setDeleteTarget(null);
            setModalOpen(false);
            refetchCalendar();
            loadList();
        } catch (err) {
            showToast(err?.message || 'Delete failed.', 'error');
        }
    };

    const toggleStatusFilter = (status) => {
        setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
    };

    const warehouseOptions = [{ value: '', label: 'All warehouses' }].concat(
        (meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }))
    );
    const customerOptions = (meta?.customers || []).map((c) => ({
        value: String(c.id),
        label: c.phone_number ? `${c.name} (${c.phone_number})` : c.name,
    }));
    const employeeOptions = [{ value: '', label: '— No employee —' }].concat(
        (meta?.employees || []).map((u) => ({ value: String(u.id), label: u.name }))
    );
    const productOptions = [{ value: '', label: '— No product —' }].concat(
        (meta?.service_products || []).map((p) => ({ value: String(p.id), label: p.name }))
    );
    const statusOptions = (meta?.status_options || []).map((s) => ({ value: s.value, label: s.label }));

    const paginatedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const listColumns = useMemo(() => [
        { label: 'Date', key: 'created_at', sortable: true },
        { label: 'Warehouse', key: 'warehouse_name' },
        {
            label: 'Customer',
            key: 'customer_name',
            render: (r) => (
                <div>
                    <div>{r.customer_name}</div>
                    {r.customer_phone && <small className="text-muted">{r.customer_phone}</small>}
                </div>
            ),
        },
        { label: 'Employee', key: 'employee_name' },
        { label: 'Service', key: 'product_name' },
        {
            label: 'Price',
            key: 'price',
            align: 'right',
            render: (r) => Number(r.price).toFixed(2),
        },
        { label: 'Start', key: 'start_display' },
        { label: 'End', key: 'end_display' },
        {
            label: 'Status',
            key: 'status',
            render: (r) => <StatusBadge status={r.status} />,
        },
        { label: 'Note', key: 'note' },
        {
            label: 'Action',
            key: 'action',
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        { label: 'Edit', onClick: () => openEdit(r.id) },
                        { label: 'Delete', danger: true, onClick: () => setDeleteTarget(r.id) },
                    ]}
                />
            ),
        },
    ], [openMenu]);

    if (!canAccess) {
        return (
            <PageLayout title="Booking">
                <p>You do not have permission to access bookings.</p>
            </PageLayout>
        );
    }

    if (loading) {
        return <PageLayout title="Booking"><p>Loading…</p></PageLayout>;
    }

    return (
        <PageLayout
            title="Booking"
            actions={(
                <button type="button" className="ui-btn primary" onClick={() => openCreate()}>
                    Add booking
                </button>
            )}
        >
            <div className="booking-tabs">
                <button type="button" className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>
                    Calendar view
                </button>
                <button type="button" className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
                    List view
                </button>
            </div>

            {tab === 'calendar' && (
                <div className="booking-calendar-layout">
                    <aside className="booking-sidebar">
                        <button type="button" className="ui-btn primary booking-add-btn" onClick={() => openCreate()}>
                            Add booking
                        </button>
                        <p className="booking-filter-title">Filters</p>
                        {meta?.show_warehouse_filter && (
                            <FormField label="Warehouse">
                                <SelectInput
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                    options={warehouseOptions}
                                />
                            </FormField>
                        )}
                        {(meta?.status_options || []).map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                className={`booking-filter-item ${statusFilters[s.value] ? '' : 'inactive'}`}
                                onClick={() => toggleStatusFilter(s.value)}
                            >
                                <span className="booking-dot" style={{ background: s.color }} />
                                {s.label}
                            </button>
                        ))}
                    </aside>
                    <div className="booking-calendar-main">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                            }}
                            height="auto"
                            selectable
                            events={fetchEvents}
                            dateClick={(info) => openCreate(info.dateStr)}
                            eventClick={(info) => openEdit(info.event.id)}
                        />
                    </div>
                </div>
            )}

            {tab === 'list' && (
                <div className="booking-list-panel">
                    <div className="booking-list-filters">
                        <FormField label="From">
                            <TextInput
                                type="date"
                                value={listFilters.starting_date}
                                onChange={(e) => setListFilters({ ...listFilters, starting_date: e.target.value })}
                            />
                        </FormField>
                        <FormField label="To">
                            <TextInput
                                type="date"
                                value={listFilters.ending_date}
                                onChange={(e) => setListFilters({ ...listFilters, ending_date: e.target.value })}
                            />
                        </FormField>
                        {meta?.show_warehouse_filter && (
                            <FormField label="Warehouse">
                                <SelectInput
                                    value={listFilters.warehouse_id}
                                    onChange={(e) => setListFilters({ ...listFilters, warehouse_id: e.target.value })}
                                    options={[{ value: '0', label: 'All' }].concat(
                                        (meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }))
                                    )}
                                />
                            </FormField>
                        )}
                        <FormField label="Status">
                            <SelectInput
                                value={listFilters.status}
                                onChange={(e) => setListFilters({ ...listFilters, status: e.target.value })}
                                options={[
                                    { value: '0', label: 'All' },
                                    ...statusOptions,
                                ]}
                            />
                        </FormField>
                        <button type="button" className="ui-btn primary" onClick={loadList}>Apply</button>
                    </div>
                    <DataTable
                        columns={listColumns}
                        rows={paginatedRows}
                        loading={listLoading}
                        emptyText="No bookings found."
                    />
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalRows={rows.length}
                        onChange={setPage}
                    />
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                title={form.id ? 'Edit booking' : 'Add booking'}
                onClose={() => setModalOpen(false)}
                footer={(
                    <>
                        {form.id && (
                            <button type="button" className="ui-btn danger" onClick={() => setDeleteTarget(form.id)}>
                                Delete
                            </button>
                        )}
                        <button type="button" className="ui-btn ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="button" className="ui-btn primary" disabled={submitting} onClick={saveBooking}>
                            {submitting ? 'Saving…' : 'Save'}
                        </button>
                    </>
                )}
            >
                <FormRow>
                    <FormField label="Warehouse *">
                        <SelectInput
                            value={form.warehouse_id}
                            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                            options={(meta?.warehouses || []).map((w) => ({ value: String(w.id), label: w.name }))}
                            disabled={Boolean(meta?.lock_warehouse_id)}
                        />
                    </FormField>
                    <FormField label="Customer *">
                        <SelectInput
                            value={form.customer_id}
                            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                            options={customerOptions}
                        />
                    </FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Employee">
                        <SelectInput
                            value={form.user_id}
                            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                            options={employeeOptions}
                        />
                    </FormField>
                    <FormField label="Status *">
                        <SelectInput
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            options={statusOptions}
                        />
                    </FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Product / service">
                        <SelectInput
                            value={form.product_id}
                            onChange={(e) => onProductChange(e.target.value)}
                            options={productOptions}
                        />
                    </FormField>
                    <FormField label="Price">
                        <NumberInput
                            min="0"
                            step="any"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                    </FormField>
                </FormRow>
                <FormRow>
                    <FormField label="Start *">
                        <TextInput
                            type="datetime-local"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        />
                    </FormField>
                    <FormField label="End *">
                        <TextInput
                            type="datetime-local"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        />
                    </FormField>
                </FormRow>
                <FormField label="Note">
                    <textarea
                        className="booking-note"
                        rows={3}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                    />
                </FormField>
            </Modal>

            {deleteTarget && (
                <ConfirmModal
                    title="Delete booking"
                    message="Are you sure you want to delete this booking?"
                    danger
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
