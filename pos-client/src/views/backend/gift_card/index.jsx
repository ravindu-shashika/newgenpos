import React, { useState, useEffect, useMemo } from 'react';
import { api, generateUniqueCode } from '../../../services';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { Modal, Button, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import { FaPlus, FaEye, FaEdit, FaMoneyBillWave, FaTrash, FaPrint } from 'react-icons/fa';
import moment from 'moment';

const GiftCardPage = ({ currency, generalSetting }) => {
    const [data, setData] = useState([]);
    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);

    // Modal States
    const [modals, setModals] = useState({
        view: false,
        create: false,
        edit: false,
        recharge: false
    });

    const [formData, setFormData] = useState({
        id: '', card_no: '', amount: '', user_id: '', customer_id: '', expired_date: moment().format('YYYY-MM-DD'), is_user: false
    });

    useEffect(() => {
        fetchGiftCards();
        fetchDependencies(); // Fetch Users and Customers for dropdowns
    }, []);

    const fetchGiftCards = async () => {
        const res = await api.get('gift_cards');
        setData(res.data);
    };

    const fetchDependencies = async () => {
        const [u, c] = await Promise.all([api.get('users'), api.get('customers')]);
        setUsers(u.data);
        setCustomers(c.data);
    };

    const handleGenerateCode = async (targetField) => {
        try {
            const cardNo = await generateUniqueCode('gift_card', {
                exceptId: formData.id || null,
            });
            setFormData({ ...formData, [targetField]: cardNo });
        } catch (err) {
            console.error('Failed to generate card number', err);
        }
    };

    const toggleModal = (name, show, rowData = null) => {
        if (rowData) setFormData({ ...formData, ...rowData, is_user: !!rowData.user_id });
        setModals(prev => ({ ...prev, [name]: show }));
    };

    // Table Columns
    const columns = useMemo(() => [
        { header: 'Card No', accessorKey: 'card_no' },
        { header: 'Customer/User', accessorKey: 'client_name' },
        { header: 'Amount', accessorKey: 'amount' },
        { header: 'Expense', accessorKey: 'expense' },
        {
            header: 'Balance',
            accessorFn: d => (d.amount - d.expense).toFixed(generalSetting.decimal)
        },
        {
            header: 'Expired Date',
            accessorKey: 'expired_date',
            cell: ({ getValue }) => {
                const value = getValue();
                const isExpired = moment(value).isBefore(moment(), 'day');
                return (
                    <Badge bg={isExpired ? 'danger' : 'success'}>
                        {moment(value).format('DD-MM-YYYY')}
                    </Badge>
                );
            }
        },
        {
            header: 'Action',
            cell: ({ row }) => (
                <Dropdown>
                    <Dropdown.Toggle variant="secondary" size="sm">Action</Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => toggleModal('view', true, row.original)}><FaEye /> View</Dropdown.Item>
                        <Dropdown.Item onClick={() => toggleModal('edit', true, row.original)}><FaEdit /> Edit</Dropdown.Item>
                        <Dropdown.Item onClick={() => toggleModal('recharge', true, row.original)}><FaMoneyBillWave /> Recharge</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => handleDelete(row.original.id)}><FaTrash /> Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )
        }
    ], [generalSetting.decimal]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="p-4">
            <div className="mb-3">
                <Button variant="info" onClick={() => toggleModal('create', true)}>
                    <FaPlus /> Add Gift Card
                </Button>
            </div>

            <div className="table-responsive shadow-sm bg-white p-3">
                <table className="table">
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* VIEW MODAL (The Visual Card) */}
            <Modal show={modals.view} onHide={() => toggleModal('view', false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Card Details</Modal.Title>
                    <Button variant="light" className="ms-2" onClick={() => window.print()}><FaPrint /></Button>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <div className="gift-card-visual" style={{
                        background: 'linear-gradient(45deg, #333, #000)',
                        borderRadius: '15px',
                        padding: '20px',
                        color: '#fff',
                        width: '350px',
                        margin: '0 auto'
                    }}>
                        <div className="d-flex justify-content-between">
                            <h5>Gift Card</h5>
                            <h5>{currency.code} {(formData.amount - formData.expense).toFixed(2)}</h5>
                        </div>
                        <h2 className="my-4" style={{ letterSpacing: '4px' }}>{formData.card_no}</h2>
                        <div className="text-start">
                            <p className="mb-0 small">VALID THRU: {moment(formData.expired_date).format('MM/YY')}</p>
                            <p className="text-uppercase">{formData.client_name}</p>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* CREATE/EDIT MODAL */}
            <Modal show={modals.create || modals.edit} onHide={() => setModals({ ...modals, create: false, edit: false })}>
                <Form>
                    <Modal.Header closeButton>
                        <Modal.Title>{modals.edit ? 'Update' : 'Add'} Gift Card</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Card No *</Form.Label>
                            <InputGroup>
                                <Form.Control value={formData.card_no} onChange={e => setFormData({ ...formData, card_no: e.target.value })} />
                                <Button variant="outline-secondary" onClick={() => handleGenerateCode('card_no')}>Generate</Button>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Amount *</Form.Label>
                            <Form.Control type="number" value={formData.amount} />
                        </Form.Group>

                        <Form.Check
                            type="checkbox"
                            label="User List"
                            checked={formData.is_user}
                            onChange={e => setFormData({ ...formData, is_user: e.target.checked })}
                            className="mb-3"
                        />

                        {formData.is_user ? (
                            <Form.Group className="mb-3">
                                <Form.Label>User *</Form.Label>
                                <Form.Select value={formData.user_id}>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        ) : (
                            <Form.Group className="mb-3">
                                <Form.Label>Customer *</Form.Label>
                                <Form.Select value={formData.customer_id}>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Expired Date</Form.Label>
                            <Form.Control type="date" value={formData.expired_date} />
                        </Form.Group>

                        <Button variant="primary" type="submit">Submit</Button>
                    </Modal.Body>
                </Form>
            </Modal>
        </div>
    );
};

export default GiftCardPage;