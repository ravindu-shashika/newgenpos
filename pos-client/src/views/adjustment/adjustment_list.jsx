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

const AdjustmentList = () => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal and form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);

  // Form state for add/edit
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [products, setProducts] = useState([]);
  const [adjustmentItems, setAdjustmentItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [document, setDocument] = useState(null);
  const [note, setNote] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    fetchAdjustments();
    fetchWarehouses();
  }, []);

  // Fetch products when warehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseProducts(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  // Filter products based on search
  useEffect(() => {
    if (productSearch.trim()) {
      const filtered = products.filter(
        (p) =>
          p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.name.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const response = await api.get('qty_adjustment');
      if (response.data?.status === 200) {
        setAdjustments(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
      alert('Failed to fetch adjustments');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('warehouses');
      if (response.data?.status === 200) {
        setWarehouses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchWarehouseProducts = async (warehouseId) => {
    try {
      const response = await api.get(`qty_adjustment/getproduct/${warehouseId}`);
      if (response.data) {
        // API returns arrays: [codes, names, quantities, unitCosts]
        const [codes, names, quantities, unitCosts] = response.data;
        const productList = codes.map((code, index) => ({
          code,
          name: names[index],
          qty: quantities[index],
          unit_cost: unitCosts[index],
        }));
        setProducts(productList);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedWarehouse('');
    setAdjustmentItems([]);
    setProductSearch('');
    setDocument(null);
    setNote('');
    setEditingAdjustment(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = async (adjustmentId) => {
    try {
      const response = await api.get(`qty_adjustment/${adjustmentId}`);
      if (response.data?.status === 200) {
        const adj = response.data.data;
        setEditingAdjustment(adj);
        setSelectedWarehouse(adj.warehouse_id);
        setNote(adj.note || '');
        const items = adj.items.map((item, idx) => ({
          id: Date.now() + idx,
          code: item.code,
          name: item.name,
          qty: item.qty,
          unit_cost: item.unit_cost,
          adjustment_qty: item.adjustment_qty,
          action: ['-', '+'].includes(item.action) ? item.action : '-',
          product_id: item.product_id,
        }));
        setAdjustmentItems(items);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching adjustment:', error);
      alert('Failed to load adjustment');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedWarehouse('');
    setAdjustmentItems([]);
    setProductSearch('');
    setDocument(null);
    setNote('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAdjustment(null);
    setSelectedWarehouse('');
    setAdjustmentItems([]);
    setProductSearch('');
    setDocument(null);
    setNote('');
  };

  const handleProductSelect = (product) => {
    const existingIndex = adjustmentItems.findIndex((item) => item.code === product.code);
    
    if (existingIndex > -1) {
      const updated = [...adjustmentItems];
      updated[existingIndex].adjustment_qty = (parseFloat(updated[existingIndex].adjustment_qty) || 0) + 1;
      setAdjustmentItems(updated);
    } else {
      setAdjustmentItems((prevItems) => [
        ...prevItems,
        {
          id: Date.now() + Math.random(),
          code: product.code,
          name: product.name,
          qty: product.qty,
          unit_cost: product.unit_cost,
          adjustment_qty: 1,
          action: '-',
        },
      ]);
    }
    setProductSearch('');
    setFilteredProducts([]);
  };

  const handleRemoveItem = (id) => {
    setAdjustmentItems(adjustmentItems.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setAdjustmentItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          // Validate action field to prevent invalid values
          if (field === 'action' && !['-', '+'].includes(value)) {
            return item;
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWarehouse) {
      alert('Please select a warehouse');
      return;
    }

    if (adjustmentItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('warehouse_id', selectedWarehouse);
      formData.append('note', note);
      if (document) {
        formData.append('document', document);
      }

      adjustmentItems.forEach((item, index) => {
        formData.append(`items[${index}][product_code]`, item.code);
        formData.append(`items[${index}][product_id]`, item.id);
        formData.append(`items[${index}][qty]`, item.adjustment_qty);
        formData.append(`items[${index}][action]`, item.action);
        formData.append(`items[${index}][unit_cost]`, item.unit_cost);
      });

      const response = await api.postFormData('qty_adjustment').values(formData);

      if (response.data?.status === 200) {
        alert(response.data.message || 'Adjustment created successfully');
        handleCloseAddModal();
        await fetchAdjustments();
      } else {
        alert(response.data?.message || 'Failed to create adjustment');
      }
    } catch (error) {
      console.error('Error creating adjustment:', error);
      alert(error.response?.data?.message || 'Failed to create adjustment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWarehouse) {
      alert('Please select a warehouse');
      return;
    }

    if (adjustmentItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('warehouse_id', selectedWarehouse);
      formData.append('note', note);
      if (document) {
        formData.append('document', document);
      }

      adjustmentItems.forEach((item, index) => {
        formData.append(`items[${index}][product_code]`, item.code);
        formData.append(`items[${index}][product_id]`, item.product_id || item.id);
        formData.append(`items[${index}][qty]`, item.adjustment_qty);
        formData.append(`items[${index}][action]`, item.action);
        formData.append(`items[${index}][unit_cost]`, item.unit_cost);
      });

      const response = await api.put(`qty_adjustment/${editingAdjustment.id}`).values(formData);

      if (response.data?.status === 200) {
        alert(response.data.message || 'Adjustment updated successfully');
        handleCloseEditModal();
        await fetchAdjustments();
      } else {
        alert(response.data?.message || 'Failed to update adjustment');
      }
    } catch (error) {
      console.error('Error updating adjustment:', error);
      alert(error.response?.data?.message || 'Failed to update adjustment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adjustmentId) => {
    if (window.confirm('Are you sure you want to delete this adjustment?')) {
      try {
        const response = await api.delete(`qty_adjustment/${adjustmentId}`);
        if (response.data?.status === 200) {
          alert(response.data.message || 'Adjustment deleted successfully');
          await fetchAdjustments();
        } else {
          alert(response.data?.message || 'Failed to delete adjustment');
        }
      } catch (error) {
        console.error('Error deleting adjustment:', error);
        alert(error.response?.data?.message || 'Failed to delete adjustment');
      }
    }
  };

  const handleDeleteBySelection = async () => {
    const selectedIds = Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(idx => data[idx].id);
    
    if (selectedIds.length === 0) {
      alert('Please select at least one adjustment');
      return;
    }

    if (!window.confirm('Are you sure you want to delete the selected adjustments?')) {
      return;
    }

    try {
      const response = await api.post('qty_adjustment/deletebyselection').values({
        adjustmentIdArray: selectedIds,
      });

      if (response.data?.status === 200) {
        alert(response.data.message || 'Adjustments deleted successfully');
        setRowSelection({});
        await fetchAdjustments();
      } else {
        alert(response.data?.message || 'Failed to delete adjustments');
      }
    } catch (error) {
      console.error('Error deleting adjustments:', error);
      alert(error.response?.data?.message || 'Failed to delete adjustments');
    }
  };

  const handleExport = (format) => {
    const selectedRows = Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(idx => data[idx]);
    
    const rowsToExport = selectedRows.length > 0 ? selectedRows : data;

    let csv = 'Date,Reference,Warehouse,Products,Note\n';
    
    rowsToExport.forEach(row => {
      const productsStr = row.products.map(p => `${p.name} (${p.qty})`).join(' | ');
      csv += `"${row.date}","${row.reference_no}","${row.warehouse}","${productsStr}","${row.note}"\n`;
    });

    if (format === 'csv') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'adjustments.csv';
      link.click();
    } else if (format === 'pdf') {
      alert('PDF export requires a PDF library. CSV export is available.');
    } else if (format === 'print') {
      window.print();
    }
  };

  const totalQty = useMemo(() => {
    return adjustmentItems.reduce((sum, item) => sum + (parseFloat(item.adjustment_qty) || 0), 0);
  }, [adjustmentItems]);

  const data = useMemo(() => {
    return adjustments.map((adjustment) => ({
      id: adjustment.id,
      date: new Date(adjustment.created_at).toLocaleDateString(),
      reference_no: adjustment.reference_no,
      warehouse: adjustment.warehouse?.name || '',
      products: adjustment.items || [],
      note: adjustment.note || '',
    }));
  }, [adjustments]);

  const itemColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'code',
        header: 'Code',
      },
      {
        accessorKey: 'unit_cost',
        header: 'Unit Cost',
        cell: ({ row }) => row.getValue('unit_cost'),
      },
      {
        accessorKey: 'qty',
        header: 'Available Quantity',
        cell: ({ row }) => row.getValue('qty'),
      },
      {
        accessorKey: 'adjustment_qty',
        header: 'Adjustment Quantity',
        cell: ({ row }) => (
          <input
            type="number"
            value={row.original.adjustment_qty}
            onChange={(e) => handleUpdateItem(row.original.id, 'adjustment_qty', e.target.value)}
            className="form-control"
            step="any"
            required
          />
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <select
            value={row.original.action || '-'}
            onChange={(e) => handleUpdateItem(row.original.id, 'action', e.target.value)}
            className="form-control"
          >
            <option value="-">Subtraction</option>
            <option value="+">Addition</option>
          </select>
        ),
      },
      {
        id: 'delete',
        header: 'Delete',
        cell: ({ row }) => (
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => handleRemoveItem(row.original.id)}
          >
            <i className="dripicons-trash"></i>
          </button>
        ),
      },
    ],
    []
  );

  const itemTable = useReactTable({
    data: adjustmentItems,
    columns: itemColumns,
    getCoreRowModel: getCoreRowModel(),
  });
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
        accessorKey: 'date',
        header: 'Date',
      },
      {
        accessorKey: 'reference_no',
        header: 'Reference',
      },
      {
        accessorKey: 'warehouse',
        header: 'Warehouse',
      },
      {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => (
          <div>
            {row.getValue('products').map((product, idx) => (
              <div key={idx}>
                {product.name}
                <br />
                {product.qty} x {product.unit_cost}
              </div>
            ))}
          </div>
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
              Action <span className="caret"></span>
            </button>
            <ul className="dropdown-menu edit-options dropdown-menu-right dropdown-default">
              <li>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => handleOpenEditModal(row.original.id)}
                >
                  <i className="dripicons-document-edit"></i> Edit
                </button>
              </li>
              <li className="divider"></li>
              <li>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={() => handleDelete(row.original.id)}
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

  return (
    <>
      <section>
      <div className="container-fluid mb-3">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="btn btn-info"
        >
          <i className="dripicons-plus"></i> Add Adjustment
        </button>
      </div>

      {loading && (
        <div className="alert alert-info">
          <i className="fa fa-spinner fa-spin"></i> Loading adjustments...
        </div>
      )}

      <div className="mb-3">
        <input
          placeholder="Search..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="form-control"
        />
      </div>

      <div className="mb-3">
        <button
          onClick={() => handleExport('csv')}
          className="btn btn-sm btn-info mr-2"
          title="Export to CSV"
        >
          <i className="fa fa-file-text-o"></i> CSV
        </button>
        <button
          onClick={() => handleExport('print')}
          className="btn btn-sm btn-secondary mr-2"
          title="Print"
        >
          <i className="fa fa-print"></i> Print
        </button>
        <button
          onClick={handleDeleteBySelection}
          className="btn btn-sm btn-danger"
          title="Delete Selected"
        >
          <i className="dripicons-trash"></i> Delete Selected
        </button>
      </div>

      <div className="table-responsive">
        <table className="table purchase-list">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    className={header.id === 'select' || header.id === 'actions' ? 'not-exported' : ''}
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
                  No adjustments found
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

    {/* Add Modal */}
    {showAddModal && (
      <div
        className="modal"
        style={{
          display: 'block',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
        }}
        onClick={handleCloseAddModal}
      >
        <div
          className="modal-dialog modal-lg"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Adjustment</h4>
              <button
                type="button"
                className="close"
                onClick={handleCloseAddModal}
              >
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Warehouse *</label>
                      <select
                        required
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="form-control"
                      >
                        <option value="">Select warehouse...</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Attach Document</label>
                      <input
                        type="file"
                        onChange={(e) => setDocument(e.target.files[0])}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-12">
                    <label>Select Product</label>
                    <div className="search-box input-group">
                      <button type="button" className="btn btn-secondary btn-lg">
                        <i className="fa fa-barcode"></i>
                      </button>
                      <input
                        type="text"
                        placeholder="Please type product code and select"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="form-control"
                        disabled={!selectedWarehouse}
                      />
                    </div>

                    {filteredProducts.length > 0 && (
                      <div
                        className="dropdown-menu show mt-2"
                        style={{ display: 'block', width: '100%', position: 'relative', maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {filteredProducts.slice(0, 10).map((product) => (
                          <button
                            key={product.code}
                            type="button"
                            className="dropdown-item"
                            onClick={() => handleProductSelect(product)}
                            style={{ textAlign: 'left', width: '100%' }}
                          >
                            {product.code} ({product.name})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="col-md-12">
                    <h6>Items</h6>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover">
                        <thead>
                          {itemTable.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th key={header.id} style={{ fontSize: '13px' }}>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody>
                          {itemTable.getRowModel().rows.length === 0 ? (
                            <tr>
                              <td colSpan={itemColumns.length} className="text-center py-2">
                                No items added
                              </td>
                            </tr>
                          ) : (
                            itemTable.getRowModel().rows.map((row) => (
                              <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} style={{ fontSize: '13px' }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="tfoot active">
                          <tr>
                            <td colSpan="4" style={{ fontSize: '13px' }}>
                              <strong>Total</strong>
                            </td>
                            <td colSpan="3" style={{ fontSize: '13px' }}>
                              <strong>{totalQty.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Note</label>
                      <textarea
                        rows="3"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="form-control"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseAddModal}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Edit Modal */}
    {showEditModal && editingAdjustment && (
      <div
        className="modal"
        style={{
          display: 'block',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
        }}
        onClick={handleCloseEditModal}
      >
        <div
          className="modal-dialog modal-lg"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Adjustment</h4>
              <button
                type="button"
                className="close"
                onClick={handleCloseEditModal}
              >
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Reference</label>
                      <p>
                        <strong>{editingAdjustment.reference_no}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Warehouse *</label>
                      <select
                        required
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="form-control"
                      >
                        <option value="">Select warehouse...</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>Attach Document</label>
                      <input
                        type="file"
                        onChange={(e) => setDocument(e.target.files[0])}
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-12">
                    <label>Select Product</label>
                    <div className="search-box input-group">
                      <button type="button" className="btn btn-secondary btn-lg">
                        <i className="fa fa-barcode"></i>
                      </button>
                      <input
                        type="text"
                        placeholder="Please type product code and select"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="form-control"
                        disabled={!selectedWarehouse}
                      />
                    </div>

                    {filteredProducts.length > 0 && (
                      <div
                        className="dropdown-menu show mt-2"
                        style={{ display: 'block', width: '100%', position: 'relative', maxHeight: '200px', overflowY: 'auto' }}
                      >
                        {filteredProducts.slice(0, 10).map((product) => (
                          <button
                            key={product.code}
                            type="button"
                            className="dropdown-item"
                            onClick={() => handleProductSelect(product)}
                            style={{ textAlign: 'left', width: '100%' }}
                          >
                            {product.code} ({product.name})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row mt-4">
                  <div className="col-md-12">
                    <h6>Items</h6>
                    <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover">
                        <thead>
                          {itemTable.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th key={header.id} style={{ fontSize: '13px' }}>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody>
                          {itemTable.getRowModel().rows.length === 0 ? (
                            <tr>
                              <td colSpan={itemColumns.length} className="text-center py-2">
                                No items added
                              </td>
                            </tr>
                          ) : (
                            itemTable.getRowModel().rows.map((row) => (
                              <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} style={{ fontSize: '13px' }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="tfoot active">
                          <tr>
                            <td colSpan="5" style={{ fontSize: '13px' }}>
                              <strong>Total</strong>
                            </td>
                            <td colSpan="2" style={{ fontSize: '13px' }}>
                              <strong>{totalQty.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label>Note</label>
                      <textarea
                        rows="3"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="form-control"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseEditModal}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Submit'}
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

export default AdjustmentList;
