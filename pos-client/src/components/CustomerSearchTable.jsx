import React, { useState, useEffect } from 'react';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { PencilIcon } from 'primereact/icons/pencil';
import { TrashIcon } from 'primereact/icons/trash';
import { FilterSlashIcon } from 'primereact/icons/filterslash';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css';
import './Styles.css';
import SystemButton from './SystemButton';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import SafeFontAwesomeIcon from './SafeFontAwesomeIcon';

export default function CustomerSearchTable({
  showEditButton,
  showDeleteButton, 
  loadingState,
  columns,
  dataList,
  edit,
  deleteRow,
  rowKey,
}) {
  const [customers, setCustomers] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [representatives] = useState([
    { name: 'Amy Elsner', image: 'amyelsner.png' },
    { name: 'Anna Fali', image: 'annafali.png' },
    { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
    { name: 'Bernardo Dominic', image: 'bernardodominic.png' },
    { name: 'Elwin Sharvill', image: 'elwinsharvill.png' },
    { name: 'Ioni Bowcher', image: 'ionibowcher.png' },
    { name: 'Ivan Magalhaes', image: 'ivanmagalhaes.png' },
    { name: 'Onyama Limba', image: 'onyamalimba.png' },
    { name: 'Stephen Shaw', image: 'stephenshaw.png' },
    { name: 'XuXue Feng', image: 'xuxuefeng.png' },
  ]);
  const [statuses] = useState([
    'unqualified',
    'qualified',
    'new',
    'negotiation',
    'renewal',
  ]);

  const getSeverity = (status) => {
    switch (status) {
      case 'unqualified':
        return 'danger';

      case 'qualified':
        return 'success';

      case 'new':
        return 'info';

      case 'negotiation':
        return 'warning';

      case 'renewal':
        return null;
    }
  };

  useEffect(() => {
    // CustomerService.getCustomersMedium().then((data) => {
    // setCustomers(getCustomers(data));
    let customer = [];
    setCustomers(customer);
    setLoading(false);
    // });
    initFilters();
  }, []);

  const getCustomers = (data) => {
    return [...(data || [])].map((d) => {
      d.date = new Date(d.date);
      return d;
    });
  };

  const formatDate = (value) => {
    return value.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const clearFilter = () => {
    initFilters();
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };

    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
      },
      'country.name': {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
      },
      representative: { value: null, matchMode: FilterMatchMode.IN },
      date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
      },
      balance: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      status: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
      },
      activity: { value: null, matchMode: FilterMatchMode.BETWEEN },
      verified: { value: null, matchMode: FilterMatchMode.EQUALS },
    });
    setGlobalFilterValue('');
  };

  const renderHeader = () => {
    return (
      <div className="flex gap-2 flex-wrap text-right">
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Keyword Search"
          className="p-inputtext-sm"
          style={{ minWidth: '12rem' }}
        />
        <Button
          type="button"
          size="small"
          icon={<FilterSlashIcon />}
          label="Clear"
          outlined
          onClick={clearFilter}
        />
      </div>
    );
  };

  


  const activityBodyTemplate = (rowData) => {
    return (
      <ProgressBar
        value={rowData.activity}
        showValue={false}
        style={{ height: '6px' }}
      ></ProgressBar>
    );
  };





  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-1 justify-content-center">
        {showEditButton && (
         <button
         type="button"
         className="btn btn-sm btn-outline-info"
         style={{ padding: '1px 5px 1px 5px' }}
         onClick={() => edit(rowData)}
       >
         <span>
           <SafeFontAwesomeIcon icon={faEdit} size="xs" />
         </span>
       </button>
        )}
          &nbsp;
        {showDeleteButton && (
        <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        style={{ padding: '1px 5px 1px 5px' }}
        onClick={() => (onDelete ? onDelete(rowData) : edit(rowData))}
      >
        <span>
          <SafeFontAwesomeIcon icon={faTrash} size="sm" />
        </span>
      </button>
        )}
      </div>
    );
  };

  const header = renderHeader();

  return (
    <div className="card ">
      <DataTable
        value={dataList}
        size="small"
        paginator
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        rows={10}
        rowsPerPageOptions={[10, 25, 50, 75]}
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        showGridlines
        stripedRows
        loading={loading}
        dataKey={rowKey || 'id'}
        filters={filters}
        globalFilterFields={columns.map((column) => column.name)}
        header={header}
        emptyMessage="No results found."
        tableStyle={{ minWidth: '50rem' }}
        pt={{
          paginator: { className: 'p-paginator-sm' },
        }}
      >
        {columns.map((column) => (
          <Column key={column.name} field={column.name} header={column.title} />
        ))}
        {/* <Column field="bill_type_id" header="Id" />
        <Column field="des" header="Name" />
        <Column field="loan_period" header="Loan Period" />
        <Column field="gold_rate" header="Gold Rate" />
        <Column field="int_rate" header="Interest Rate Template" />
        <Column field="branch_code" header="Branch Code" />
        <Column field="branch" header="Branch" />
        <Column field="bill_count" header="Bill Count" />
        <Column field="state" header="State" />
        <Column field="user" header="User" />
        <Column
          field="created_at"
          sortable
          // style={{ width: '25%' }}
          header="Created At"
        /> */}
        {showDeleteButton ? (
        <Column
          field="Action"
            header="Action"
            body={actionBodyTemplate}
            headerStyle={{ width: '10%', minWidth: '8rem' }}
            bodyStyle={{ textAlign: 'center' }}
          ></Column>
        ) : null}
      </DataTable>
    </div>
  );
}
