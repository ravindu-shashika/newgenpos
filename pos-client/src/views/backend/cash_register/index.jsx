import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PageLayout,
    DataTable,
    Modal,
    Pagination,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authStore from '../../../stores/authStore';

const PAGE_SIZES = [10, 25, 50, -1];

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
}

function formatCurrency(value) {
    return Number(value ?? 0).toFixed(2);
}

function canAccessCashRegister(user) {
    const roleId = Number(user?.role_id);
    return roleId > 0 && roleId <= 2;
}

function renderCustomMethods(customMethods) {
    if (!customMethods) return null;

    return Object.entries(customMethods).map(([key, value]) => {
        const methodName = key
            .replace('_payment', '')
            .replace(/_/g, ' ')
            .replace(/^\w/, (c) => c.toUpperCase());

        return (
            <tr key={key}>
                <td>{methodName}:</td>
                <td className="text-end">{formatCurrency(value)}</td>
            </tr>
        );
    });
}

export default function CashRegisterIndex() {
    const { toast, showToast } = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [selectedRegisterId, setSelectedRegisterId] = useState(null);
    const [registerDetails, setRegisterDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const user = authStore.getUser();
    const canView = canAccessCashRegister(user);

    const fetchCashRegisters = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('cash-register');
            const payload = response?.data ?? response;
            setRows(Array.isArray(payload?.data) ? payload.data : []);
        } catch (error) {
            showToast(error?.message || 'Failed to load cash registers.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (canView) {
            fetchCashRegisters();
        } else {
            setLoading(false);
        }
    }, [canView, fetchCashRegisters]);

    const paginated = useMemo(() => {
        if (pageSize === -1) return rows;
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(rows.length / pageSize) || 1);

    const handleViewDetails = useCallback(async (id) => {
        setSelectedRegisterId(id);
        setShowDetailsModal(true);
        setDetailsLoading(true);
        setRegisterDetails(null);
        try {
            const response = await api.get(`cash-register/getDetails/${id}`);
            const payload = response?.data ?? response;
            setRegisterDetails(payload?.data ?? payload);
        } catch (error) {
            showToast(error?.message || 'Failed to load register details.', 'error');
            setShowDetailsModal(false);
        } finally {
            setDetailsLoading(false);
        }
    }, [showToast]);

    const handleCloseRegister = async () => {
        try {
            await api.post('cash-register/close', {
                cash_register_id: selectedRegisterId,
            });
            setShowConfirmClose(false);
            setShowDetailsModal(false);
            showToast('Cash register closed successfully.', 'success');
            fetchCashRegisters();
        } catch (error) {
            showToast(error?.message || 'Failed to close register.', 'error');
        }
    };

    const columns = [
        { label: 'User', key: 'user_name', render: (row) => row.user?.name || '—' },
        { label: 'Warehouse', key: 'warehouse_name', render: (row) => row.warehouse?.name || '—' },
        {
            label: 'Cash in Hand',
            key: 'cash_in_hand',
            align: 'right',
            render: (row) => formatCurrency(row.cash_in_hand),
        },
        {
            label: 'Closing Balance',
            key: 'closing_balance',
            align: 'right',
            render: (row) => formatCurrency(row.closing_balance),
        },
        {
            label: 'Actual Cash',
            key: 'actual_cash',
            align: 'right',
            render: (row) => formatCurrency(row.actual_cash),
        },
        {
            label: 'Opened at',
            key: 'created_at',
            render: (row) => formatDate(row.created_at),
        },
        {
            label: 'Closed at',
            key: 'updated_at',
            render: (row) => (row.status ? 'N/A' : formatDate(row.updated_at)),
        },
        {
            label: 'Status',
            key: 'status',
            render: (row) =>
                row.status ? (
                    <span className="badge bg-success">Active</span>
                ) : (
                    <span className="badge bg-danger">Closed</span>
                ),
        },
        {
            label: 'Action',
            key: 'action',
            render: (row) => (
                <button
                    type="button"
                    className="ui-btn btn-sm secondary"
                    onClick={() => handleViewDetails(row.id)}
                    title="View"
                >
                    View
                </button>
            ),
        },
    ];

    if (!canView) {
        return (
            <PageLayout eyebrow="Sale" title="Cash Register">
                <p className="text-muted">You do not have permission to access cash registers.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout eyebrow="Sale" title="Cash Register">
            <DataTable
                columns={columns}
                rows={paginated}
                loading={loading}
                emptyText="No cash registers found."
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize === -1 ? rows.length || 10 : pageSize}
                totalRows={rows.length}
                onChange={setPage}
                pageSizes={PAGE_SIZES}
                onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {showDetailsModal && (
                <Modal
                    title="Cash Register Details"
                    onClose={() => setShowDetailsModal(false)}
                    footer={
                        registerDetails?.status ? (
                            <button
                                type="button"
                                className="ui-btn primary"
                                onClick={() => setShowConfirmClose(true)}
                            >
                                Close Register
                            </button>
                        ) : null
                    }
                >
                    <p>Please review the transaction and payments</p>
                    {detailsLoading ? (
                        <p className="text-muted">Loading details…</p>
                    ) : registerDetails ? (
                        <div className="row">
                            <div className="col-md-12">
                                <table className="table table-hover">
                                    <tbody>
                                        <tr>
                                            <td>Cash in Hand:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.cash_in_hand)}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Sale Amount:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.total_sale_amount)}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.total_payment)}</td>
                                        </tr>
                                        <tr>
                                            <td>Cash Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.cash_payment)}</td>
                                        </tr>
                                        <tr>
                                            <td>Credit Card Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.credit_card_payment)}</td>
                                        </tr>
                                        <tr>
                                            <td>Cheque Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.cheque_payment)}</td>
                                        </tr>
                                        <tr>
                                            <td>Gift Card Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.gift_card_payment)}</td>
                                        </tr>
                                        <tr>
                                            <td>Paypal Payment:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.paypal_payment)}</td>
                                        </tr>
                                        {renderCustomMethods(registerDetails.custom_methods)}
                                        <tr>
                                            <td>Total Sale Return:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.total_sale_return)}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Expense:</td>
                                            <td className="text-end">{formatCurrency(registerDetails.total_expense)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Total Cash:</strong></td>
                                            <td className="text-end">
                                                <strong>{formatCurrency(registerDetails.total_cash)}</strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">No details available.</p>
                    )}
                </Modal>
            )}

            {showConfirmClose && (
                <Modal
                    title="Confirm Close"
                    onClose={() => setShowConfirmClose(false)}
                    footer={
                        <>
                            <button
                                type="button"
                                className="ui-btn ghost"
                                onClick={() => setShowConfirmClose(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ui-btn danger"
                                onClick={handleCloseRegister}
                            >
                                Yes, Close Register
                            </button>
                        </>
                    }
                >
                    <p>Are you sure you want to close this register?</p>
                </Modal>
            )}

            <Toast toast={toast} />
        </PageLayout>
    );
}
