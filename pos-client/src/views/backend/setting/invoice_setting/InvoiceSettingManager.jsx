import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
    PageLayout,
    DataTable,
    Modal,
    ConfirmModal,
    FormField,
    FormRow,
    TextInput,
    NumberInput,
    SelectInput,
    TextareaInput,
    FileInput,
    CheckboxInput,
    Toast,
    useToast,
    ActionMenu,
    Pagination,
} from '../../../../components/ui';
import { api } from '../../../../services';
import usePermissions from '../../../../stores/usePermissions';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50];

const SIZE_OPTIONS = [
    { value: 'a4', label: 'A4' },
    { value: '58mm', label: '58mm (Thermal Receipt)' },
    { value: '80mm', label: '80mm (Thermal Receipt)' },
];

const NUMBERING_OPTIONS = [
    { value: 'sequential', label: 'Sequential' },
    { value: 'random', label: 'Random' },
    { value: 'datewise', label: 'Date Wise' },
];

const DATE_FORMAT_OPTIONS = [
    { value: 'd.m.y h:i A', label: 'd.m.y h:i A' },
    { value: 'm.d.y h:i A', label: 'm.d.y h:i A' },
    { value: 'y.m.d h:i A', label: 'y.m.d h:i A' },
    { value: 'd-m-y h:i A', label: 'd-m-y h:i A' },
    { value: 'y-m-d h:i A', label: 'y-m-d h:i A' },
    { value: 'd/m/y h:i A', label: 'd/m/y h:i A' },
];

const CHECKBOX_FIELDS = [
    { key: 'active_logo_height_width', label: 'Active Logo Height Width' },
    { key: 'show_ref_number', label: 'Show Reference No' },
    { key: 'active_generat_settings', label: 'Auto Generate Numbering Type' },
    { key: 'active_date_format', label: 'Active Date Format' },
    { key: 'show_warehouse_info', label: 'Show Warehouse Info' },
    { key: 'show_bill_to_info', label: 'Show Bill To Info' },
    { key: 'show_biller_info', label: 'Served By' },
    { key: 'show_payment_note', label: 'Show Payment Note' },
    { key: 'hide_total_due', label: 'Hide Total Due' },
    { key: 'show_in_words', label: 'Show Amount In Words' },
    { key: 'show_footer_text', label: 'Show Footer Text' },
    { key: 'show_barcode', label: 'Show Barcode' },
    { key: 'show_qr_code', label: 'Show QR Code' },
    { key: 'active_primary_color', label: 'Active Primary Color' },
    { key: 'show_vat_registration_number', label: 'Show Vat Registration Number' },
    { key: 'show_sale_note', label: 'Show Sale Note' },
    { key: 'show_customer_name', label: 'Show Customer Name' },
    { key: 'show_description', label: 'Show Description [58mm, 80mm]' },
    { key: 'show_paid_info', label: 'Show Paid Info' },
];

const EMPTY_FORM = {
    template_name: '',
    invoice_name: '',
    size: 'a4',
    prefix: '',
    numbering_type: 'sequential',
    number_of_digit: 6,
    start_number: 1,
    header_text: '',
    footer_text: '',
    logo_height: 80,
    logo_width: 120,
    primary_color: '#0036B3',
    invoice_date_format: 'd.m.y h:i A',
    is_default: false,
    status: true,
    show_column: CHECKBOX_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: false }), {}),
};

// ─── Component ────────────────────────────────────────────────────────────────
const InvoiceSettingManager = ({ controllerName }) => {

    // ── Data ──────────────────────────────────────────────────────────────────
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Pagination / sort / search ─────────────────────────────────────────────
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sortCol, setSortCol] = useState('template_name');
    const [sortDir, setSortDir] = useState('asc');
    const [search, setSearch] = useState('');

    // ── Selection ──────────────────────────────────────────────────────────────
    const [openMenu, setOpenMenu] = useState(null);

    // ── Modals ─────────────────────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // ── Form ───────────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const logoRef = useRef();

    // ── Toast ──────────────────────────────────────────────────────────────────
    const { toast, showToast } = useToast();

    // -- Permissions --
    const { canAdd, canEdit, canDelete } = usePermissions(controllerName);

    const setField = (name) => (e) => {
        const { type, value, checked, files } = e.target;
        setForm((f) => ({
            ...f,
            [name]: type === 'checkbox' ? checked : type === 'file' ? (files?.[0] || null) : value,
        }));
    };

    const normalizeShowColumn = (showColumn) => {
        const base = { ...EMPTY_FORM.show_column };
        if (!showColumn || typeof showColumn !== 'object') {
            return base;
        }
        CHECKBOX_FIELDS.forEach(({ key }) => {
            base[key] = Boolean(showColumn[key]);
        });
        return base;
    };

    const mapInvoiceToForm = (item) => ({
        ...EMPTY_FORM,
        ...item,
        size: item.size || 'a4',
        numbering_type: item.numbering_type || 'sequential',
        invoice_date_format: item.invoice_date_format || EMPTY_FORM.invoice_date_format,
        prefix: item.prefix ?? '',
        header_text: item.header_text ?? '',
        footer_text: item.footer_text ?? '',
        template_name: item.template_name ?? '',
        start_number: item.start_number ?? 1,
        number_of_digit: item.number_of_digit ?? 6,
        logo_height: item.logo_height ?? 80,
        logo_width: item.logo_width ?? 120,
        primary_color: item.primary_color || '#0036B3',
        show_column: normalizeShowColumn(item.show_column),
        is_default: !!item.is_default,
        status: !!item.status,
        company_logo: null,
    });

    // -- Client-side Filtering/Sorting/Pagination -------------------------------
    const filteredAndSorted = useMemo(() => {
        let list = Array.isArray(invoices) ? [...invoices] : [];
        if (search) {
            const low = search.toLowerCase();
            list = list.filter(p =>
                (p.template_name || '').toLowerCase().includes(low) ||
                (p.size || '').toLowerCase().includes(low)
            );
        }
        list.sort((a, b) => {
            let valA = (a[sortCol] ?? '').toString().toLowerCase();
            let valB = (b[sortCol] ?? '').toString().toLowerCase();
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [invoices, search, sortCol, sortDir]);

    const paginatedInvoices = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAndSorted.slice(start, start + pageSize);
    }, [filteredAndSorted, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('setting/invoice');
            const data = (res.data?.data ?? res.data ?? []).map(item => ({
                ...item,
                show_column: typeof item.show_column === 'string' ? JSON.parse(item.show_column) : (item.show_column ?? {})
            }));
            setInvoices(data);
        } catch {
            showToast('Failed to load invoice settings.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleSetDefault = async (id) => {
        try {
            await api.put(`setting/invoice/${id}`, { column: 'is_default' });
            fetchInvoices();
            showToast('Default status updated.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update status.', 'error');
        }
    };

    const handleOpenAdd = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setIsEditing(false);
        setModalOpen(true);
        setActiveTab('general');
    };

    const handleOpenEdit = (item) => {
        setForm(mapInvoiceToForm(item));
        setFormErrors({});
        setIsEditing(true);
        setModalOpen(true);
        setActiveTab('general');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        // Simple validation check before submit
        if (form.prefix && (form.prefix.length < 2 || form.prefix.length > 10)) {
            showToast('Prefix must be between 2 and 10 characters.', 'error');
            return;
        }

        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (key === 'show_column') {
                formData.append('show_column', JSON.stringify(form.show_column));
            } else if (key === 'company_logo') {
                if (form[key]) formData.append(key, form[key]);
            } else if (key === 'is_default' || key === 'status') {
                formData.append(key, form[key] ? 1 : 0);
            } else if (form[key] !== null && form[key] !== undefined) {
                formData.append(key, form[key]);
            }
        });

        if (isEditing) {
            formData.append('_method', 'PUT');
        }

        try {
            const url = isEditing ? `setting/invoice/${form.id}` : 'setting/invoice';
            await api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showToast(`Invoice setting ${isEditing ? 'updated' : 'created'} successfully.`);
            setModalOpen(false);
            fetchInvoices();
        } catch (err) {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors || {});
                showToast('Validation failed. Check the form.', 'error');
            } else {
                showToast(err.response?.data?.message || 'An error occurred.', 'error');
            }
        }
    };

    const handleDelete = async () => {
        try {
            const res = await api.delete(`setting/invoice/${deleteId}`);
            if (res.data?.success === false) {
                 showToast(res.data?.message || 'Default invoice cannot be deleted.', 'error');
            } else {
                 showToast('Invoice setting deleted successfully.');
                 fetchInvoices();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete.', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        const newCols = { ...form.show_column };
        CHECKBOX_FIELDS.forEach(f => {
            newCols[f.key] = checked;
        });
        setForm({ ...form, show_column: newCols });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        { key: 'template_name', label: 'Template Name', sortable: true },
        { key: 'size', label: 'Size', sortable: true, render: (r) => r.size?.toUpperCase() },
        {
            key: 'is_default',
            label: 'Default Status',
            center: true,
            render: (r) => (
                r.is_default ? (
                    <span className="ui-badge success">Default</span>
                ) : (
                    <button 
                        className="ui-btn link small" 
                        onClick={() => handleSetDefault(r.id)}
                    >
                        Set Default
                    </button>
                )
            )
        },
        {
            key: 'action',
            label: 'Action',
            center: true,
            render: (r) => (
                <ActionMenu
                    id={r.id}
                    openId={openMenu}
                    setOpenId={setOpenMenu}
                    items={[
                        canEdit && { label: '✎ Update', onClick: () => handleOpenEdit(r) },
                        (canEdit && canDelete) && { divider: true },
                        canDelete && { label: '🗑 Delete', danger: true, onClick: () => setDeleteId(r.id) },
                    ].filter(Boolean)}
                />
            ),
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <PageLayout
            eyebrow="Settings"
            title="Invoice Settings"
            onClick={(e) => { if (!e.target.closest('.ui-action-wrap')) setOpenMenu(null); }}
            actions={
                <>{canAdd && <button className="ui-btn primary" onClick={handleOpenAdd}>+ Add New</button>}</>
            }
        >
            <div className="ui-toolbar">
                <input
                    className="ui-search"
                    placeholder="Search by template name…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
            </div>

            <DataTable
                columns={columns}
                rows={paginatedInvoices}
                loading={loading}
                emptyText="No invoice settings found"
                emptyIcon="📄"
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={(key) => { if(sortCol===key) setSortDir(d=>d==='asc'?'desc':'asc'); else {setSortCol(key);setSortDir('asc');} setPage(1); }}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalRows={filteredAndSorted.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />

            {/* -- Add/Edit Modal -- */}
            {modalOpen && (
                <Modal
                    title={isEditing ? 'Edit Invoice Setting' : 'Add Invoice Setting'}
                    onClose={() => setModalOpen(false)}
                    size="large"
                    footer={
                        <div className="ui-modal-footer">
                            <button className="ui-btn secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="ui-btn primary" onClick={handleSubmit}>Submit</button>
                        </div>
                    }
                >
                    <div className="ui-tabs">
                        {['general', 'numbering', 'content', 'style', 'columns'].map(tab => (
                            <button 
                                key={tab} 
                                className={`ui-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="ui-tab-content mt-4">
                        {activeTab === 'general' && (
                            <>
                                <FormRow>
                                    <FormField label="Invoice Type" error={formErrors.size}>
                                        <SelectInput 
                                            options={SIZE_OPTIONS} 
                                            value={form.size || 'a4'} 
                                            disabled={isEditing}
                                            onChange={setField('size')} 
                                        />
                                    </FormField>
                                    <FormField label="Template Name" required error={formErrors.template_name}>
                                        <TextInput value={form.template_name} onChange={setField('template_name')} />
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Invoice Date Format" error={formErrors.invoice_date_format}>
                                        <SelectInput
                                            options={DATE_FORMAT_OPTIONS}
                                            value={form.invoice_date_format || DATE_FORMAT_OPTIONS[0].value}
                                            onChange={setField('invoice_date_format')}
                                        />
                                    </FormField>
                                    <div className="flex gap-6 items-end pb-2 pl-4">
                                        <CheckboxInput label="Default" checked={form.is_default} onChange={setField('is_default')} />
                                        {!isEditing && <CheckboxInput label="Status" checked={form.status} onChange={setField('status')} />}
                                    </div>
                                </FormRow>
                            </>
                        )}

                        {activeTab === 'numbering' && (
                            <>
                                <FormRow>
                                    <FormField label="Prefix" required error={formErrors.prefix}>
                                        <TextInput 
                                            value={form.prefix} 
                                            onChange={setField('prefix')} 
                                            placeholder="Min 2, Max 10 chars"
                                        />
                                    </FormField>
                                    <FormField label="Numbering Type" required error={formErrors.numbering_type}>
                                        <SelectInput
                                            options={NUMBERING_OPTIONS}
                                            value={form.numbering_type || 'sequential'}
                                            onChange={setField('numbering_type')}
                                        />
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    {form.numbering_type === 'sequential' && (
                                        <FormField label="Start Number" required error={formErrors.start_number}>
                                            <NumberInput value={form.start_number} onChange={setField('start_number')} />
                                        </FormField>
                                    )}
                                    {form.numbering_type === 'random' && (
                                        <FormField label="Number of Digits (6-12)" required error={formErrors.number_of_digit}>
                                            <NumberInput min={6} max={12} value={form.number_of_digit} onChange={setField('number_of_digit')} />
                                        </FormField>
                                    )}
                                </FormRow>
                            </>
                        )}

                        {activeTab === 'content' && (
                            <>
                                <FormField label="Header Text" error={formErrors.header_text}>
                                    <TextInput value={form.header_text} onChange={setField('header_text')} placeholder="Max 100 chars" />
                                </FormField>
                                <FormField label="Footer Text" error={formErrors.footer_text}>
                                    <TextareaInput rows={4} value={form.footer_text} onChange={setField('footer_text')} placeholder="Max 100 chars" />
                                </FormField>
                            </>
                        )}

                        {activeTab === 'style' && (
                            <>
                                <FormRow>
                                    {form.size === 'a4' && (
                                        <FormField label="Primary Color" error={formErrors.primary_color}>
                                            <TextInput type="color" value={form.primary_color} onChange={setField('primary_color')} />
                                        </FormField>
                                    )}
                                    <FormField label="Logo Width (px)" error={formErrors.logo_width}>
                                        <NumberInput value={form.logo_width} onChange={setField('logo_width')} />
                                    </FormField>
                                    <FormField label="Logo Height (px)" error={formErrors.logo_height}>
                                        <NumberInput value={form.logo_height} onChange={setField('logo_height')} />
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Company Logo" error={formErrors.company_logo}>
                                        <FileInput inputRef={logoRef} onChange={setField('company_logo')} />
                                    </FormField>
                                </FormRow>
                            </>
                        )}

                        {activeTab === 'columns' && (
                            <>
                                <div className="mb-4 pb-2 border-b">
                                    <CheckboxInput 
                                        label="Select All" 
                                        checked={Object.values(form.show_column).every(v => v)}
                                        onChange={handleSelectAll} 
                                    />
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                    {CHECKBOX_FIELDS.map(f => (
                                        <CheckboxInput 
                                            key={f.key} 
                                            label={f.label} 
                                            name={f.key}
                                            checked={!!form.show_column?.[f.key]} 
                                            onChange={(e) => setForm({
                                                ...form,
                                                show_column: { ...form.show_column, [f.key]: e.target.checked },
                                            })} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </Modal>
            )}

            {/* -- Confirm Delete -- */}
            {deleteId && (
                <ConfirmModal
                    title="Delete Invoice Setting"
                    danger
                    message="Are you sure you want to delete this invoice setting?"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteId(null)}
                />
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
};

export default InvoiceSettingManager;
