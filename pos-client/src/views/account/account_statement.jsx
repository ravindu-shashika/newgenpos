import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';

const AccountStatement = ({ 
  accountData, 
  initialBalance, 
  transactionArray, 
  generalSettings
}) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});

  // Format date helper
  const formatDate = (dateString, format = 'DD/MM/YYYY') => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return format.replace('DD', day).replace('MM', month).replace('YYYY', year);
  };

  // Format currency helper
  const formatCurrency = (value, decimals = 2) => {
    return parseFloat(value || 0).toFixed(decimals);
  };

  // Prepare transaction data
  const data = useMemo(() => {
    const rows = [];
    
    if (!transactionArray || transactionArray.length === 0) {
      if (initialBalance && initialBalance.initial_balance !== 0) {
        return [{
          id: 'initial-balance',
          date: initialBalance.created_at,
          referenceNo: '-',
          relatedTransaction: 'Initial Balance',
          credit: initialBalance.initial_balance,
          debit: 0,
          balance: initialBalance.initial_balance
        }];
      }
      return [];
    }

    const reversed = [...transactionArray].reverse();
    
    reversed.forEach((data, index) => {
      rows.push({
        id: `transaction-${index}`,
        date: data[0],
        referenceNo: data[1],
        relatedTransaction: data[2],
        credit: data[3],
        debit: data[4],
        balance: data[5]
      });
    });

    if (initialBalance) {
      rows.push({
        id: 'initial-balance-end',
        date: initialBalance.created_at,
        referenceNo: '-',
        relatedTransaction: 'Initial Balance',
        credit: initialBalance.initial_balance,
        debit: 0,
        balance: initialBalance.initial_balance
      });
    }

    return rows;
  }, [transactionArray, initialBalance]);

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
        cell: ({ row }) => formatDate(row.getValue('date'), generalSettings?.date_format || 'DD/MM/YYYY'),
      },
      {
        accessorKey: 'referenceNo',
        header: 'Reference No',
      },
      {
        accessorKey: 'relatedTransaction',
        header: 'Related Transaction',
      },
      {
        accessorKey: 'credit',
        header: 'Credit',
        cell: ({ row }) => formatCurrency(row.getValue('credit'), generalSettings?.decimal || 2),
      },
      {
        accessorKey: 'debit',
        header: 'Debit',
        cell: ({ row }) => formatCurrency(row.getValue('debit'), generalSettings?.decimal || 2),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => formatCurrency(row.getValue('balance'), generalSettings?.decimal || 2),
      },
    ],
    [generalSettings]
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

  // Export handlers
  const handleExportCSV = () => {
    const headers = columns.map(col => col.header).join(',');
    const rows = table.getRowModel().rows.map(row =>
      row.getVisibleCells().map(cell => {
        const value = flexRender(cell.column.columnDef.cell, cell.getContext());
        return `"${value}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-statement.csv';
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="forms">
      <div className="container-fluid">
        <h3>Account Statement</h3>
        <strong>Account:</strong> {accountData?.name} [{accountData?.account_no}]
      </div>

      <div className="mb-3">
        <div className="row">
          <div className="col-md-6">
            <input
              placeholder="Search..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="col-md-6 text-right">
            <button onClick={handleExportCSV} className="btn btn-sm btn-info" title="Export to CSV">
              <i className="fa fa-file-text-o"></i> CSV
            </button>
            <button onClick={handlePrint} className="btn btn-sm btn-secondary ml-2" title="Print">
              <i className="fa fa-print"></i> Print
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive mb-4">
        <table className="table table-hover">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={row.getIsSelected() ? 'selected' : ''}>
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
  );
};

export default AccountStatement;
