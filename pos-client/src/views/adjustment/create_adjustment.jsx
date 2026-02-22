import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { api } from '../../services';

const CreateAdjustment = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [products, setProducts] = useState([]);
  const [adjustmentItems, setAdjustmentItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [document, setDocument] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch warehouses on mount
  useEffect(() => {
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
      const response = await api.get(`getproduct/${warehouseId}`);
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

  const handleProductSelect = (product) => {
    const existingIndex = adjustmentItems.findIndex((item) => item.code === product.code);
    
    if (existingIndex > -1) {
      // Product exists, increment quantity
      const updated = [...adjustmentItems];
      updated[existingIndex].adjustment_qty = (parseFloat(updated[existingIndex].adjustment_qty) || 0) + 1;
      setAdjustmentItems(updated);
    } else {
      // Add new product
      setAdjustmentItems([
        ...adjustmentItems,
        {
          ...product,
          adjustment_qty: 1,
          action: '-',
          id: Math.random(),
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
    const updated = adjustmentItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setAdjustmentItems(updated);
  };

  const totalQty = useMemo(() => {
    return adjustmentItems.reduce((sum, item) => sum + (parseFloat(item.adjustment_qty) || 0), 0);
  }, [adjustmentItems]);

  const columns = useMemo(
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
            value={row.original.action}
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

  const table = useReactTable({
    data: adjustmentItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleSubmit = async (e) => {
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

      // Add adjustment items
      adjustmentItems.forEach((item, index) => {
        formData.append(`items[${index}][product_code]`, item.code);
        formData.append(`items[${index}][product_id]`, item.id);
        formData.append(`items[${index}][qty]`, item.adjustment_qty);
        formData.append(`items[${index}][action]`, item.action);
        formData.append(`items[${index}][unit_cost]`, item.unit_cost);
      });

      const response = await api.postFormData('adjustments').values(formData);

      if (response.data?.status === 200) {
        alert(response.data.message || 'Adjustment created successfully');
        // Reset form
        setSelectedWarehouse('');
        setAdjustmentItems([]);
        setDocument(null);
        setNote('');
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

  return (
    <section className="forms">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <h4>Add Adjustment</h4>
              </div>
              <div className="card-body">
                <p className="italic">
                  <small>The field labels marked with * are required input fields.</small>
                </p>

                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <div className="row">
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
                        <div className="dropdown-menu show mt-2" style={{ display: 'block', width: '100%', position: 'relative' }}>
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

                  <div className="row mt-5">
                    <div className="col-md-12">
                      <h5>Order Table *</h5>
                      <div className="table-responsive mt-3">
                        <table className="table table-hover">
                          <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                  <th key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                  </th>
                                ))}
                              </tr>
                            ))}
                          </thead>
                          <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                              <tr>
                                <td colSpan={columns.length} className="text-center py-4">
                                  No items added
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
                              <td colSpan="4">
                                <strong>Total</strong>
                              </td>
                              <td colSpan="3">
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
                          rows="5"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="form-control"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateAdjustment;
