import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { api } from '../../services';
// import { AccountList } from '..';

const AccountList = () => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [accountList, setAccountList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generalSettings, setGeneralSettings] = useState({ decimal: 2 });
  const [formData, setFormData] = useState({
    account_no: '',
    name: '',
    initial_balance: '',
    note: ''
  });
  const [addFormData, setAddFormData] = useState({
    account_no: '',
    name: '',
    initial_balance: '',
    note: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);


  // Format currency helper
  const formatCurrency = (value, decimals = 2) => {
    return parseFloat(value || 0).toFixed(decimals);
  };

  // Fetch accounts list
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('accounts');
      if (response.data?.status === 200) {
        setAccountList(response.data.data);
        // if (response.data.decimal) {
        //   setGeneralSettings({ decimal: response.data.decimal });
        // }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      alert('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };


  // Table data
  const data = useMemo(() => {
    return accountList.map((account) => ({
      id: account.id,
      account_no: account.account_no,
      name: account.name,
      initial_balance: account.initial_balance || 0,
      balance: account.balance || 0,
      is_default: account.is_default || false,
      note: account.note || ''
    }));
  }, [accountList]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="dt-checkboxes"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="dt-checkboxes"
          />
        ),
      },
      {
        accessorKey: 'account_no',
        header: 'Account No',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'initial_balance',
        header: 'Initial Balance',
        cell: ({ row }) => formatCurrency(row.getValue('initial_balance'), generalSettings.decimal),
      },
      {
        accessorKey: 'balance',
        header: 'Available Balance',
        cell: ({ row }) => formatCurrency(row.getValue('balance'), generalSettings.decimal),
      },
      {
        accessorKey: 'is_default',
        header: 'Default',
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getValue('is_default')}
            onChange={() => handleSetDefault(row.original.id)}
            className="default-checkbox"
            disabled={row.getValue('is_default')}
          />
        ),
      },
      {
        accessorKey: 'note',
        header: 'Note',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-default btn-sm dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              Action
              <span className="caret"></span>
            </button>
            <ul className="dropdown-menu edit-options dropdown-menu-right dropdown-default">
              <li>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => handleEditClick(row.original)}
                >
                  <i className="dripicons-document-edit"></i> Edit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => handleViewStatement(row.original.id)}
                >
                  <i className="dripicons-document"></i> Statement
                </button>
              </li>
              <li className="divider"></li>
              <li>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => handleDeleteClick(row.original.id)}
                >
                  <i className="dripicons-trash"></i> Delete
                </button>
              </li>
            </ul>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Handlers
  const handleEditClick = (account) => {
    setEditingAccount(account);
    setFormData({
      account_no: account.account_no,
      name: account.name,
      initial_balance: account.initial_balance,
      note: account.note
    });
    setShowEditModal(true);
  };

  const handleViewStatement = (accountId) => {
    // Navigate to statement view - implement based on your router
    console.log('View statement for account:', accountId);
    // Example: navigate(`/accounts/${accountId}/statement`);
  };

  const handleDeleteClick = async (accountId) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        setLoading(true);
        const response = await api.delete(`accounts/${accountId}`);
        if (response.data?.status === 200) {
          alert(response.data.message || 'Account deleted successfully');
          await fetchAccounts();
        } else {
          alert(response.data?.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert(error.response?.data?.message || 'Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      setLoading(true);
      const response = await api.post(`accounts/makeDefault/${accountId}`).values({});
      if (response.data?.status === 200) {
        alert(response.data.message || 'Account set as default');
        await fetchAccounts();
      } else {
        alert(response.data?.message || 'Failed to set default account');
      }
    } catch (error) {
      console.error('Error setting default account:', error);
      alert(error.response?.data?.message || 'Failed to set default account');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAccount?.id) {
      alert('Account ID is missing');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`accounts/${editingAccount.id}`).values(formData);

      if (response.data?.status === 200) {
        alert(response.data.message || 'Account updated successfully');
        setShowEditModal(false);
        await fetchAccounts();
      } else {
        alert(response.data?.message || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      const errorMessage = error.response?.data?.message || Object.values(error.response?.data?.errors || {}).flat().join(', ') || 'Failed to update account';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await api.post('accounts').values(addFormData);

      if (response.data?.status === 200) {
        alert(response.data.message || 'Account created successfully');
        setShowAddModal(false);
        setAddFormData({
          account_no: '',
          name: '',
          initial_balance: '',
          note: ''
        });
        await fetchAccounts();
      } else {
        alert(response.data?.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.message || Object.values(error.response?.data?.errors || {}).flat().join(', ') || 'Failed to create account';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddClick = () => {
    setAddFormData({
      account_no: '',
      name: '',
      initial_balance: '',
      note: ''
    });
    setShowAddModal(true);
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate totals
  const totalInitialBalance = useMemo(() => {
    return data.reduce((sum, row) => sum + parseFloat(row.initial_balance || 0), 0);
  }, [data]);

  return (
    <>
      {loading && (
        <div className="alert alert-info">
          <i className="fa fa-spinner fa-spin"></i> Loading...
        </div>
      )}

      <section>
        <div className="container-fluid mb-3">
          <button
            className="btn btn-info"
            onClick={handleAddClick}
            disabled={loading}
          >
            <i className="dripicons-plus"></i> Add Account
          </button>
        </div>

        <div className="mb-3">
          <input
            placeholder="Search..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      className="not-exported"
                    >
                      <div className="flex items-center">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-2">
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted()] ?? ''}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    No accounts found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="tfoot active">
              <tr>
                <th></th>
                <th>Total</th>
                <th></th>
                <th>{formatCurrency(totalInitialBalance, generalSettings.decimal)}</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="pagination-info">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <span className="ml-3">
              | Showing {table.getRowModel().rows.length} of {data.length} results
            </span>
          </div>
          <div className="pagination-controls">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="form-control form-control-sm"
              style={{ width: 'auto', display: 'inline-block' }}
            >
              {[10, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>

            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-sm btn-outline-primary ml-2"
            >
              <i className="dripicons-chevron-left"></i> Previous
            </button>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn btn-sm btn-outline-primary ml-2"
            >
              Next <i className="dripicons-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {showEditModal && (
        <div
          id="editModal"
          className="modal fade show text-left"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Account</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowEditModal(false)}
                >
                  <span aria-hidden="true">
                    <i className="dripicons-cross"></i>
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <p className="italic">
                  <small>The field labels marked with * are required input fields.</small>
                </p>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label>Account No *</label>
                    <input
                      type="text"
                      name="account_no"
                      value={formData.account_no}
                      onChange={handleFormChange}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Balance</label>
                    <input
                      type="number"
                      name="initial_balance"
                      step="any"
                      value={formData.initial_balance}
                      onChange={handleFormChange}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Note</label>
                    <textarea
                      name="note"
                      rows="3"
                      value={formData.note}
                      onChange={handleFormChange}
                      className="form-control"
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary">
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          id="account-modal"
          className="modal fade show text-left"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Account</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowAddModal(false)}
                >
                  <span aria-hidden="true">
                    <i className="dripicons-cross"></i>
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <p className="italic">
                  <small>The field labels marked with * are required input fields.</small>
                </p>
                <form onSubmit={handleAddSubmit}>
                  <div className="form-group">
                    <label>Account No *</label>
                    <input
                      type="text"
                      name="account_no"
                      value={addFormData.account_no}
                      onChange={handleAddFormChange}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={addFormData.name}
                      onChange={handleAddFormChange}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Initial Balance</label>
                    <input
                      type="number"
                      name="initial_balance"
                      step="any"
                      value={addFormData.initial_balance}
                      onChange={handleAddFormChange}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Note</label>
                    <textarea
                      name="note"
                      rows="3"
                      value={addFormData.note}
                      onChange={handleAddFormChange}
                      className="form-control"
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="btn btn-primary">
                      Add Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountList;
