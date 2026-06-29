import React, { useState, useEffect } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-bs4';
import 'datatables.net-buttons-bs4';
import 'datatables.net-buttons/js/buttons.print.js';
import 'datatables.net-buttons/js/buttons.html5.js';
import 'datatables.net-select-bs4';

DataTable.use(DT);

const DiscountPlanList = ({ discountPlans = [], onEdit, onDelete }) => {
    const [tableData, setTableData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
        setTableData(discountPlans);
    }, [discountPlans]);

    const handleEdit = (id) => {
        onEdit(id);
    };

    const handleConfirmDelete = () => {
        return window.confirm('Are you sure you want to delete?');
    };

    const formatCustomers = (customers) => {
        return customers.map((customer, index) => (
            <span key={customer.id}>
                {index > 0 && ', '}
                {customer.name}
            </span>
        ));
    };

    const columns = [
        {
            data: null,
            render: (data, type, row, meta) => {
                if (type === 'display') {
                    return (
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                className="dt-checkboxes"
                                onChange={(e) => handleRowSelect(e, row.id)}
                            />
                            <label></label>
                        </div>
                    );
                }
                return data;
            },
            orderable: false,
            className: 'select-checkbox',
        },
        {
            data: 'name',
            title: 'Name',
        },
        {
            data: 'customers',
            title: 'Customer',
            render: (data) => formatCustomers(data),
            orderable: false,
        },
        {
            data: 'type',
            title: 'Type',
            render: (data) => data.charAt(0).toUpperCase() + data.slice(1),
            orderable: false,
        },
        {
            data: 'is_active',
            title: 'Status',
            render: (data) => (data ? 'Active' : 'Inactive'),
        },
        {
            data: null,
            title: 'Action',
            render: (data, type, row) => (
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
                        <span className="sr-only">Toggle Dropdown</span>
                    </button>
                    <ul className="dropdown-menu edit-options dropdown-menu-right dropdown-default">
                        <li>
                            <button
                                className="btn btn-link"
                                onClick={() => handleEdit(row.id)}
                            >
                                <i className="dripicons-document-edit"></i> Edit
                            </button>
                        </li>
                    </ul>
                </div>
            ),
            orderable: false,
            className: 'not-exported',
        },
    ];

    const handleRowSelect = (e, rowId) => {
        if (e.target.checked) {
            setSelectedRows([...selectedRows, rowId]);
        } else {
            setSelectedRows(selectedRows.filter((id) => id !== rowId));
        }
    };

    return (
        <section>
            <div className="container-fluid mb-3">
                <a href="/discount-plans/create" className="btn btn-info">
                    <i className="dripicons-plus"></i> Create Discount Plan
                </a>
            </div>

            <div className="table-responsive">
                <DataTable
                    className="table"
                    data={tableData}
                    columns={columns}
                    options={{
                        order: [],
                        language: {
                            lengthMenu: '_MENU_ records per page',
                            info: '<small>Showing _START_ - _END_ (_TOTAL_)</small>',
                            search: 'Search',
                            paginate: {
                                previous: '<i class="dripicons-chevron-left"></i>',
                                next: '<i class="dripicons-chevron-right"></i>',
                            },
                        },
                        columnDefs: [
                            {
                                orderable: false,
                                targets: [0, 2, 3, 4],
                            },
                        ],
                        select: {
                            style: 'multi',
                            selector: 'td:first-child',
                        },
                        lengthMenu: [
                            [10, 25, 50, -1],
                            [10, 25, 50, 'All'],
                        ],
                        dom: '<"row"lfB>rtip',
                        buttons: [
                            {
                                extend: 'pdf',
                                text: '<i title="export to pdf" class="fa fa-file-pdf-o"></i>',
                                exportOptions: {
                                    columns: ':visible:Not(.not-exported)',
                                    rows: ':visible',
                                    stripHtml: false,
                                },
                            },
                            {
                                extend: 'excel',
                                text: '<i title="export to excel" class="dripicons-document-new"></i>',
                                exportOptions: {
                                    columns: ':visible:Not(.not-exported)',
                                    rows: ':visible',
                                },
                            },
                            {
                                extend: 'csv',
                                text: '<i title="export to csv" class="fa fa-file-text-o"></i>',
                                exportOptions: {
                                    columns: ':visible:Not(.not-exported)',
                                    rows: ':visible',
                                },
                            },
                            {
                                extend: 'print',
                                text: '<i title="print" class="fa fa-print"></i>',
                                exportOptions: {
                                    columns: ':visible:Not(.not-exported)',
                                    rows: ':visible',
                                    stripHtml: false,
                                },
                            },
                            {
                                extend: 'colvis',
                                text: '<i title="column visibility" class="fa fa-eye"></i>',
                                columns: ':gt(0)',
                            },
                        ],
                    }}
                />
            </div>
        </section>
    );
};

export default DiscountPlanList;
