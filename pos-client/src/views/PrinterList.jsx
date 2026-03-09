import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Button,
    Table,
    Modal,
    Form,
    Row,
    Col,
    InputGroup,
    Dropdown,
    Badge
} from 'react-bootstrap';
import { useTable, usePagination, useGlobalFilter } from 'react-table';
import { api, msg } from '../services';

const PrinterList = () => {
    const [printers, setPrinters] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [connectionTypes, setConnectionTypes] = useState({});
    const [capabilityProfiles, setCapabilityProfiles] = useState({});
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        warehouse_id: '',
        connection_type: 'network',
        capability_profile: 'default',
        char_per_line: 42,
        ip_address: '',
        port: '9100',
        path: ''
    });

    const fetchPrinterData = async () => {
        setLoading(true);
        try {
            const res = await api.get('printers/data');
            if (res.data) {
                setPrinters(res.data.printers || []);
                setWarehouses(res.data.warehouses || []);
                setConnectionTypes(res.data.connection_types || {});
                setCapabilityProfiles(res.data.capability_profiles || {});

                // Set default warehouse if available on create
                if (!isEdit && res.data.warehouses?.length > 0) {
                    setFormData(prev => ({ ...prev, warehouse_id: res.data.warehouses[0].id }));
                }
            }
        } catch (error) {
            console.error("Error fetching printer data:", error);
            msg.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrinterData();
    }, []);

    const handleShowModal = (printer = null) => {
        if (printer) {
            setIsEdit(true);
            setFormData({
                id: printer.id,
                name: printer.name,
                warehouse_id: printer.warehouse_id,
                connection_type: printer.connection_type,
                capability_profile: printer.capability_profile,
                char_per_line: printer.char_per_line,
                ip_address: printer.ip_address || '',
                port: printer.port || '9100',
                path: printer.path || ''
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: '',
                name: '',
                warehouse_id: warehouses[0]?.id || '',
                connection_type: 'network',
                capability_profile: 'default',
                char_per_line: 42,
                ip_address: '',
                port: '9100',
                path: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (isEdit) {
                res = await api.put(`printers`, formData.id).values(formData);
            } else {
                res = await api.post('printers').values(formData);
            }

            if (res.data?.status === 200 || res.status === 200) {
                msg.success(res.data?.message || "Success");
                handleCloseModal();
                fetchPrinterData();
            } else {
                msg.error(res.data?.message || "Operation failed");
            }
        } catch (error) {
            msg.error(error.response?.data?.message || "An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this printer?")) {
            try {
                const res = await api.delete(`printers/${id}`);
                if (res.status === 200) {
                    msg.success("Printer deleted successfully");
                    fetchPrinterData();
                }
            } catch (error) {
                msg.error("Failed to delete printer");
            }
        }
    };

    const columns = useMemo(() => [
        {
            Header: 'Printer Name',
            accessor: 'name',
        },
        {
            Header: 'Warehouse',
            accessor: 'warehouse.name',
        },
        {
            Header: 'Connection Type',
            accessor: 'connection_type',
            Cell: ({ value }) => connectionTypes[value] || value
        },
        {
            Header: 'Capability Profile',
            accessor: 'capability_profile',
            Cell: ({ value }) => capabilityProfiles[value] || value
        },
        {
            Header: 'IP Address',
            accessor: 'ip_address',
        },
        {
            Header: 'Port',
            accessor: 'port',
        },
        {
            Header: 'Path',
            accessor: 'path',
        },
        {
            Header: 'Action',
            accessor: 'id',
            Cell: ({ row }) => (
                <Dropdown>
                    <Dropdown.Toggle variant="light" size="sm" id={`dropdown-action-${row.original.id}`}>
                        Action
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleShowModal(row.original)}>
                            <i className="dripicons-document-edit me-2"></i> Edit
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => handleDelete(row.original.id)} className="text-danger">
                            <i className="dripicons-trash me-2"></i> Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        }
    ], [connectionTypes, capabilityProfiles]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        nextPage,
        previousPage,
        setGlobalFilter,
        state: { pageIndex, globalFilter },
    } = useTable(
        {
            columns,
            data: printers,
            initialState: { pageSize: 10 },
        },
        useGlobalFilter,
        usePagination
    );

    return (
        <section className="bg-light p-4">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h4 mb-0">Printer List</h2>
                    <Button variant="info" onClick={() => handleShowModal()}>
                        <i className="dripicons-plus me-2"></i> Add Printer
                    </Button>
                </div>

                <Card className="border-0 shadow-sm">
                    <Card.Body>
                        <div className="mb-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <span className="me-2 text-muted">Show</span>
                                <Form.Select size="sm" className="w-auto me-2">
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </Form.Select>
                                <span className="text-muted">entries</span>
                            </div>
                            <Form.Control
                                type="text"
                                placeholder="Search..."
                                className="w-auto"
                                value={globalFilter || ''}
                                onChange={e => setGlobalFilter(e.target.value)}
                            />
                        </div>

                        <div className="table-responsive">
                            <Table hover {...getTableProps()} className="align-middle">
                                <thead className="bg-light">
                                    {headerGroups.map(headerGroup => (
                                        <tr {...headerGroup.getHeaderGroupProps()}>
                                            {headerGroup.headers.map(column => (
                                                <th {...column.getHeaderProps()} className="border-0 py-3">
                                                    {column.render('Header')}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody {...getTableBodyProps()}>
                                    {page.map(row => {
                                        prepareRow(row);
                                        return (
                                            <tr {...row.getRowProps()}>
                                                {row.cells.map(cell => (
                                                    <td {...cell.getCellProps()} className="py-3">
                                                        {cell.render('Cell')}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                    {page.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length} className="text-center py-5 text-muted">
                                                No printers found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <div className="text-muted small">
                                Showing {pageIndex * 10 + 1} to {Math.min((pageIndex + 1) * 10, printers.length)} of {printers.length} entries
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => previousPage()}
                                    disabled={!canPreviousPage}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => nextPage()}
                                    disabled={!canNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title>{isEdit ? 'Update Printer' : 'Add Printer'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="py-4">
                        <p className="text-muted italic small mb-4">
                            The field labels marked with * are required input fields.
                        </p>
                        {!isEdit && (
                            <div className="alert alert-danger bg-danger-subtle border-0 text-danger mb-4 small">
                                When you assign a receipt printer to this warehouse, browser printing will be turned off. 
                                Receipts will be printed using the assigned printer, following the template you set in the invoice settings.
                            </div>
                        )}
                        
                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Name *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Printer Name" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleInputChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Warehouse *</Form.Label>
                                    <Form.Select 
                                        name="warehouse_id" 
                                        value={formData.warehouse_id} 
                                        onChange={handleInputChange} 
                                        required
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Connection Type *</Form.Label>
                                    <Form.Select 
                                        name="connection_type" 
                                        value={formData.connection_type} 
                                        onChange={handleInputChange} 
                                        required
                                    >
                                        {Object.entries(connectionTypes).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Form.Group>
                                    <Form.Label>
                                        Capability Profile * 
                                        <i className="dripicons-question ms-1 text-info small" title="Different printers support different commands and code pages. If you are not sure, it is safest to use the Simple Capability Profile"></i>
                                    </Form.Label>
                                    <Form.Select 
                                        name="capability_profile" 
                                        value={formData.capability_profile} 
                                        onChange={handleInputChange} 
                                        required
                                    >
                                        {Object.entries(capabilityProfiles).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Characters per line *</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        name="char_per_line" 
                                        value={formData.char_per_line} 
                                        onChange={handleInputChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {formData.connection_type === 'network' && (
                            <Row>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>IP Address *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Printer IP address" 
                                            name="ip_address" 
                                            value={formData.ip_address} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>
                                            Port * 
                                            <i className="dripicons-question ms-1 text-info small" title="Most printers use port 9100"></i>
                                        </Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="port" 
                                            value={formData.port} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {(formData.connection_type === 'windows' || formData.connection_type === 'linux') && (
                            <Row>
                                <Col md={12} className="mb-3">
                                    <Form.Group>
                                        <Form.Label>Path *</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="path" 
                                            value={formData.path} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                        <Form.Text className="text-muted">
                                            <b>Windows: </b> Device files are typically <code>LPT1</code> (parallel) / <code>COM1</code> (serial). <br/>
                                            <b>Linux: </b> Device files are typically <code>/dev/lp0</code> (parallel), <code>/dev/usb/lp1</code> (USB), <code>/dev/ttyUSB0</code> (USB-Serial).
                                        </Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEdit ? 'Update Changes' : 'Save Printer'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </section>
    );
};

export default PrinterList;
