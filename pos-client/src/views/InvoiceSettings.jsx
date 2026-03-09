import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    Table, 
    Button, 
    Card, 
    Row, 
    Col, 
    Form, 
    Badge, 
    Spinner,
    InputGroup 
} from 'react-bootstrap';
import { useTable, usePagination, useGlobalFilter } from 'react-table';
import { api, msg } from '../services';
import { Loader, SafeFontAwesomeIcon } from '../components';
import { faPlus, faEdit, faTrash, faCheck, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';

const InvoiceSettings = () => {
    const [invoiceSettings, setInvoiceSettings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        size: 'a4',
        template_name: '',
        prefix: '',
        numbering_type: 'sequential',
        number_of_digit: 6,
        start_number: '',
        header_text: '',
        footer_text: '',
        logo_height: 80,
        logo_width: 120,
        primary_color: '#0036B3',
        invoice_date_format: 'd.m.y h:m A',
        is_default: false,
        show_column: {}
    });
    const [logoFile, setLogoFile] = useState(null);
    const [currentId, setCurrentId] = useState(null);

    const checkboxFields = [
        { field: 'show_barcode', label: 'Show Barcode' },
        { field: 'show_qr_code', label: 'Show QR Code' },
        { field: 'show_description', label: 'Show Description[58mm,80mm]' },
        { field: 'show_in_words', label: 'Show Amount In Words' },
        { field: 'active_primary_color', label: 'Active Primary Color' },
        { field: 'show_warehouse_info', label: 'Show Warehouse Info' },
        { field: 'show_bill_to_info', label: 'Show Bill To Info' },
        { field: 'show_biller_info', label: 'Served By' },
        { field: 'show_paid_info', label: 'Show Paid Info' },
        { field: 'show_footer_text', label: 'Show Footer Text' },
        { field: 'show_payment_note', label: 'Show Payment Note' },
        { field: 'show_ref_number', label: 'Show Reference No' },
        { field: 'active_date_format', label: 'Active Date Format' },
        { field: 'active_generat_settings', label: 'Auto Generate Numbering Type' },
        { field: 'active_logo_height_width', label: 'Active Logo Height Width' },
        { field: 'hide_total_due', label: 'Hide Total Due' },
        { field: 'show_vat_registration_number', label: 'Show Vat Registration Number' },
        { field: 'show_sale_note', label: 'Show Sale Note' },
    ];

    useEffect(() => {
        fetchInvoiceSettings();
    }, []);

    const fetchInvoiceSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('setting/invoice');
            if (res.status === 200) {
                setInvoiceSettings(res.data.data);
            }
        } catch (error) {
            msg.error("Failed to fetch invoice settings");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDefault = async (id) => {
        if (!window.confirm('Are you sure you want to set this as default?')) return;
        try {
            await api.put(`setting/invoice/${id}`, { column: 'is_default' });
            msg.success("Default status updated");
            fetchInvoiceSettings();
        } catch (error) {
            msg.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this setting?')) return;
        try {
            const res = await api.delete(`setting/invoice/${id}`);
            if (res.data.success) {
                msg.success(res.data.message);
                fetchInvoiceSettings();
            } else {
                msg.error(res.data.message || "Failed to delete");
            }
        } catch (error) {
            msg.error("Error deleting invoice setting");
        }
    };

    const handleEdit = (invoice) => {
        let showCol = {};
        if (typeof invoice.show_column === 'string') {
            try {
                showCol = JSON.parse(invoice.show_column);
            } catch (e) {
                showCol = {};
            }
        } else {
            showCol = invoice.show_column || {};
        }

        setFormData({
            size: invoice.size,
            template_name: invoice.template_name,
            prefix: invoice.prefix || '',
            numbering_type: invoice.numbering_type,
            number_of_digit: invoice.number_of_digit || 6,
            start_number: invoice.start_number || '',
            header_text: invoice.header_text || '',
            footer_text: invoice.footer_text || '',
            logo_height: invoice.logo_height || 80,
            logo_width: invoice.logo_width || 120,
            primary_color: invoice.primary_color || '#0036B3',
            invoice_date_format: invoice.invoice_date_format || 'd.m.y h:m A',
            is_default: invoice.is_default === 1,
            show_column: showCol
        });
        setCurrentId(invoice.id);
        setEditMode(true);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setFormData({
            size: 'a4',
            template_name: '',
            prefix: '',
            numbering_type: 'sequential',
            number_of_digit: 6,
            start_number: '',
            header_text: '',
            footer_text: '',
            logo_height: 80,
            logo_width: 120,
            primary_color: '#0036B3',
            invoice_date_format: 'd.m.y h:m A',
            is_default: false,
            show_column: {}
        });
        setLogoFile(null);
        setEditMode(false);
        setCurrentId(null);
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('show_column.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                show_column: {
                    ...prev.show_column,
                    [field]: checked ? 1 : 0
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSelectAll = (e) => {
        const { checked } = e.target;
        const newShowCol = {};
        checkboxFields.forEach(item => {
            newShowCol[item.field] = checked ? 1 : 0;
        });
        setFormData(prev => ({
            ...prev,
            show_column: newShowCol
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (key === 'show_column') {
                Object.keys(formData.show_column).forEach(ckey => {
                    data.append(`show_column[${ckey}]`, formData.show_column[ckey]);
                });
            } else if (key === 'is_default') {
                data.append(key, formData[key] ? 1 : 0);
            } else {
                data.append(key, formData[key]);
            }
        });

        if (logoFile) {
            data.append('company_logo', logoFile);
        }

        if (editMode) {
            data.append('_method', 'PUT');
        }

        try {
            const url = editMode ? `setting/invoice/${currentId}` : 'setting/invoice';
            const res = await api.post(url, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 200) {
                msg.success(editMode ? "Updated successfully" : "Created successfully");
                setShowForm(false);
                fetchInvoiceSettings();
            }
        } catch (error) {
            msg.error("Error saving invoice setting");
        }
    };

    const columns = useMemo(() => [
        {
            Header: 'Template Name',
            accessor: 'template_name',
        },
        {
            Header: 'Size',
            accessor: 'size',
            Cell: ({ value }) => <span className="text-uppercase">{value}</span>
        },
        {
            Header: 'Default',
            accessor: 'is_default',
            Cell: ({ row, value }) => (
                <div className="text-center">
                    {value === 1 ? (
                        <Badge bg="success">Default</Badge>
                    ) : (
                        <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleToggleDefault(row.original.id)}
                        >
                            Set Default
                        </Button>
                    )}
                </div>
            )
        },
        {
            Header: 'Action',
            accessor: 'id',
            Cell: ({ row }) => (
                <div className="text-center">
                    <Button 
                        variant="warning" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleEdit(row.original)}
                    >
                        Update
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(row.original.id)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ], [invoiceSettings]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state,
        setGlobalFilter,
        nextPage,
        previousPage,
        canNextPage,
        canPreviousPage,
        pageOptions,
        setPageSize,
    } = useTable(
        {
            columns,
            data: invoiceSettings,
            initialState: { pageSize: 10 },
        },
        useGlobalFilter,
        usePagination
    );

    const { globalFilter, pageIndex, pageSize } = state;

    if (showForm) {
        return (
            <div className="container-fluid py-4">
                <Card className="shadow-sm border-0">
                    <Card.Header className="bg-white py-3">
                        <h4 className="mb-0">{editMode ? 'Edit Invoice Setting' : 'Add Invoice Setting'}</h4>
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Invoice Type</Form.Label>
                                        <Form.Select 
                                            name="size" 
                                            value={formData.size} 
                                            onChange={handleInputChange}
                                            disabled={editMode}
                                        >
                                            <option value="a4">A4</option>
                                            <option value="58mm">58mm (Thermal receipt)</option>
                                            <option value="80mm">80mm (Thermal receipt)</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Template Name *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="template_name" 
                                            value={formData.template_name} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Prefix *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="prefix" 
                                            value={formData.prefix} 
                                            onChange={handleInputChange} 
                                            required 
                                            minLength={2} 
                                            maxLength={11} 
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Numbering Type *</Form.Label>
                                        <Form.Select 
                                            name="numbering_type" 
                                            value={formData.numbering_type} 
                                            onChange={handleInputChange}
                                        >
                                            <option value="sequential">Sequential</option>
                                            <option value="random">Random</option>
                                            <option value="datewise">Date Wise</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                {formData.numbering_type === 'random' && (
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Number Of Digit (min-6, max-12)*</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                name="number_of_digit" 
                                                value={formData.number_of_digit} 
                                                onChange={handleInputChange} 
                                                min={6} 
                                                max={12} 
                                            />
                                        </Form.Group>
                                    </Col>
                                )}

                                {formData.numbering_type === 'sequential' && (
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Start Number *</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                name="start_number" 
                                                value={formData.start_number} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </Form.Group>
                                    </Col>
                                )}

                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Company Logo</Form.Label>
                                        <Form.Control 
                                            type="file" 
                                            onChange={(e) => setLogoFile(e.target.files[0])} 
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Logo Height</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            name="logo_height" 
                                            value={formData.logo_height} 
                                            onChange={handleInputChange} 
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Logo Width</Form.Label>
                                        <Form.Control 
                                            type="number" 
                                            name="logo_width" 
                                            value={formData.logo_width} 
                                            onChange={handleInputChange} 
                                        />
                                    </Form.Group>
                                </Col>

                                {formData.size === 'a4' && (
                                    <Col md={4} className="mb-3">
                                        <Form.Group>
                                            <Form.Label>Primary Color</Form.Label>
                                            <Form.Control 
                                                type="color" 
                                                name="primary_color" 
                                                value={formData.primary_color} 
                                                onChange={handleInputChange} 
                                            />
                                        </Form.Group>
                                    </Col>
                                )}

                                <Col md={4} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Invoice Date Format</Form.Label>
                                        <Form.Select 
                                            name="invoice_date_format" 
                                            value={formData.invoice_date_format} 
                                            onChange={handleInputChange}
                                        >
                                            <option value="d.m.y h:m A">d.m.y h:m A</option>
                                            <option value="m.d.y h:m A">m.d.y h:m A</option>
                                            <option value="y.m.d h:m A">y.m.d h:m A</option>
                                            <option value="d-m-y h:m A">d-m-y h:m A</option>
                                            <option value="y-m-d h:m A">y-m-d h:m A</option>
                                            <option value="d/m/y h:m A">d/m/y h:m A</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Footer Text</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={3} 
                                            name="footer_text" 
                                            value={formData.footer_text} 
                                            onChange={handleInputChange} 
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={12} className="mb-3">
                                    <Form.Check 
                                        type="checkbox"
                                        label="Default"
                                        name="is_default"
                                        checked={formData.is_default}
                                        onChange={handleInputChange}
                                    />
                                </Col>

                                <Col md={12} className="mt-4">
                                    <h5>Column Settings</h5>
                                    <hr />
                                    <Form.Check 
                                        type="checkbox"
                                        label="Select All"
                                        id="select-all"
                                        className="mb-3 font-weight-bold"
                                        onChange={handleSelectAll}
                                    />
                                    <Row>
                                        {checkboxFields.map((item) => (
                                            <Col md={4} key={item.field} className="mb-2">
                                                <Form.Check 
                                                    type="switch"
                                                    id={`checkbox_${item.field}`}
                                                    name={`show_column.${item.field}`}
                                                    label={item.label}
                                                    checked={formData.show_column[item.field] === 1}
                                                    onChange={handleInputChange}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Col>
                            </Row>

                            <div className="mt-4 d-flex">
                                <Button variant="primary" type="submit" className="mr-2">
                                    {editMode ? 'Update' : 'Submit'}
                                </Button>
                                <Button variant="secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="font-weight-bold text-dark mb-0">Invoice Settings</h3>
                    <p className="text-muted small mb-0">Manage your invoice templates and numbering systems</p>
                </div>
                <Button variant="primary" onClick={handleAddNew}>
                    <SafeFontAwesomeIcon icon={faPlus} className="mr-2" /> Add New Invoice Setting
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <div className="d-flex mb-3">
                        <InputGroup className="w-25">
                            <InputGroup.Text><SafeFontAwesomeIcon icon={faSearch} /></InputGroup.Text>
                            <Form.Control
                                placeholder="Search..."
                                value={globalFilter || ''}
                                onChange={e => setGlobalFilter(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <div className="table-responsive">
                        <Table {...getTableProps()} hover className="align-middle">
                            <thead className="bg-light">
                                {headerGroups.map(headerGroup => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map(column => (
                                            <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-5">
                                            <Loader />
                                        </td>
                                    </tr>
                                ) : page.length > 0 ? (
                                    page.map(row => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()}>
                                                {row.cells.map(cell => (
                                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                                ))}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4">No data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            Showing {page.length} of {invoiceSettings.length} entries
                        </div>
                        <div className="d-flex align-items-center">
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => previousPage()} 
                                disabled={!canPreviousPage}
                                className="mr-2"
                            >
                                Previous
                            </Button>
                            <span className="mx-2">
                                Page{' '}
                                <strong>
                                    {pageIndex + 1} of {pageOptions.length}
                                </strong>
                            </span>
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                onClick={() => nextPage()} 
                                disabled={!canNextPage}
                                className="ml-2"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default InvoiceSettings;
