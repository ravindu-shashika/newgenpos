<template>
    <section class="p-4">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Customers</h2>
            <div class="flex gap-2">
                <router-link to="/customers/create" class="p-button p-button-info">Add Customer</router-link>
                <button class="p-button p-button-primary" @click.prevent="showImport = true">Import</button>
                <button class="p-button p-button-danger" @click="deleteSelected" :disabled="!selectedCustomers.length">Delete</button>
            </div>
        </div>

        <DataTable :value="customers" selectionMode="multiple" v-model:selection="selectedCustomers" dataKey="id" paginator rows="10" :rowsPerPageOptions="[10,25,50]">
            <Column selectionMode="multiple" style="width:3rem"></Column>
            <Column field="customer_group" header="Group"></Column>
            <Column header="Customer Details" :body="customerDetails"></Column>
            <Column field="discount_plan" header="Discount Plan"></Column>
            <Column field="reward_point" header="Reward Points"></Column>
            <Column field="deposited_balance" header="Deposited Balance"></Column>
            <Column field="total_due" header="Total Due"></Column>
            <Column header="Actions" :body="actionBody" style="width:10rem"></Column>
        </DataTable>

        <Dialog header="Import Customers" v-model:visible="showImport" modal>
            <form @submit.prevent="submitImport">
                <div class="p-fluid">
                    <label for="file">Upload CSV</label>
                    <input id="file" type="file" @change="onFileChange" accept=".csv" required />
                </div>
                <div class="mt-4 flex justify-end gap-2">
                    <button type="button" class="p-button" @click="showImport = false">Cancel</button>
                    <button type="submit" class="p-button p-button-primary">Upload</button>
                </div>
            </form>
        </Dialog>
    </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import api from '@/service/api'

const toast = useToast()
const customers = ref([])
const selectedCustomers = ref([])
const showImport = ref(false)
const file = ref(null)

function fetchCustomers() {
    api.get('customers').then(res => {
        customers.value = res.data || []
    }).catch(() => {
        toast.add({severity:'error', summary:'Error', detail:'Unable to load customers', life:3000})
    })
}

function customerDetails(row) {
    return (
        <div>
            <div class="font-semibold">{row.name}</div>
            <div class="text-sm text-muted">{row.company_name}</div>
            <div class="text-sm">{row.phone_number}</div>
        </div>
    )
}

function actionBody(row) {
    return (
        <div class="flex gap-2">
            <router-link to={`/customers/${row.id}`} class="p-button p-button-text">View</router-link>
            <router-link to={`/customers/${row.id}/edit`} class="p-button p-button-warning">Edit</router-link>
            <button class="p-button p-button-danger" onClick={() => confirmDelete(row.id)}>Delete</button>
        </div>
    )
}

function confirmDelete(id) {
    if (!confirm('Are you sure want to delete?')) return
    api.delete(`customers/${id}`).then(() => {
        toast.add({severity:'success', summary:'Deleted', detail:'Customer deleted', life:3000})
        fetchCustomers()
    }).catch(() => toast.add({severity:'error', summary:'Error', detail:'Delete failed', life:3000}))
}

function deleteSelected() {
    if (!selectedCustomers.value.length) return toast.add({severity:'warn', summary:'No selection', detail:'Select customers first', life:2000})
    if (!confirm('Are you sure want to delete selected customers?')) return
    const ids = selectedCustomers.value.map(c => c.id)
    api.post('customer/deletebyselection', { customerIdArray: ids }).then(() => {
        toast.add({severity:'success', summary:'Deleted', detail:'Selected customers deleted', life:3000})
        selectedCustomers.value = []
        fetchCustomers()
    }).catch(() => toast.add({severity:'error', summary:'Error', detail:'Bulk delete failed', life:3000}))
}

function onFileChange(e) {
    file.value = e.target.files[0]
}

function submitImport() {
    if (!file.value) return
    const form = new FormData()
    form.append('file', file.value)
    api.post('customer/import', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(() => {
        toast.add({severity:'success', summary:'Imported', detail:'Customers imported', life:3000})
        showImport.value = false
        fetchCustomers()
    }).catch(() => toast.add({severity:'error', summary:'Error', detail:'Import failed', life:3000}))
}

onMounted(fetchCustomers)
</script>

<style scoped>
.text-muted { color: #6b7280 }
</style>
            $('input[name="paying_amount"]').closest('.col-md-6').show();
            $('.change').closest('.col-md-6').show();
        }

        $('input[name="cheque_no"]').attr('required', false);
        $('#clearDueModal select[name="gift_card_id"]').attr('required', false);
        $(".clear-due-form").off("submit");
        // console.log($('select[name="paid_by_id"]').val(), id);
        if(id == 2){
            $(".gift-card").show();
            $(".card-element").hide();
            $("#cheque").hide();
            $('#clearDueModal select[name="gift_card_id"]').attr('required', true);
        }
        else if (id == 3) {
            @if($lims_pos_setting_data && (strlen($lims_pos_setting_data->stripe_public_key)>0) && (strlen($lims_pos_setting_data->stripe_secret_key )>0))
                $.getScript( "vendor/stripe/checkout.js" );
                $(".card-element").show();
            @endif
            $(".gift-card").hide();
            $("#cheque").hide();
        } else if (id == 4) {
            $("#cheque").show();
            $(".gift-card").hide();
            $(".card-element").hide();
            $('input[name="cheque_no"]').attr('required', true);
        } else if (id == 5) {
            $(".card-element").hide();
            $(".gift-card").hide();
            $("#cheque").hide();
        } else {
            $(".card-element").hide();
            $(".gift-card").hide();
            $("#cheque").hide();
            if(id == 6){
                if($('#p_amount').val() > parseFloat(deposit))
                    alert('Amount exceeds customer deposit! Customer deposit : ' + deposit);
            }
            else if(id==7) {
                pointCalculation($('#p_amount').val());
            }
        }
    });

    $(document).ready(function() {
        $('select[name="paid_by_id"]').trigger("change");
    });

    $('input#p_amount').on("input", function () {
        var paidBy = $('select[name="paid_by_id"]').val(); // Get the selected payment method
        if (paidBy != 1) { // Check if paid_by_id is NOT 1 (Cash)
            $('input[name="paying_amount"]').val($(this).val());
        }
    });



    $('#clearDueModal select[name="gift_card_id"]').on("change", function() {
        var id = $(this).val();
        if(expired_date[id] < current_date)
            alert('This card is expired!');
        else if($('#clearDueModal input[name="amount"]').val() > balance[id]){
            alert('Amount exceeds card balance! Gift Card balance: '+ balance[id]);
        }
    });

    $('input[name="paying_amount"]').on("input", function() {
        $(".change").text(parseFloat( $(this).val() - $('input[name="amount"]').val() ).toFixed({{$general_setting->decimal}}));
    });

    $('#p_amount').on("input", function() {
        if( $(this).val() > parseFloat($('input[name="paying_amount"]').val()) ) {
            alert('Paying amount cannot be bigger than recieved amount');
            $(this).val('');
        }
        else if( $(this).val() > parseFloat($('input[name="balance"]').val()) ) {
            alert('Paying amount cannot be bigger than due amount');
            $(this).val('');
        }
        $(".change").text(parseFloat($('input[name="paying_amount"]').val() - $(this).val()).toFixed({{$general_setting->decimal}}));
        var id = $('#clearDueModal select[name="paid_by_id"]').val();
        var amount = $(this).val();
        if(id == 2){
            id = $('#clearDueModal select[name="gift_card_id"]').val();
            if(amount > balance[id])
                alert('Amount exceeds card balance! Gift Card balance: '+ balance[id]);
        }
        else if(id == 6){
            if(amount > parseFloat(deposit))
                alert('Amount exceeds customer deposit! Customer deposit : ' + deposit);
        }
        else if(id==7) {
            pointCalculation(amount);
        }
    });

    function pointCalculation(amount) {
        availablePoints = $('table.customer-list tbody tr:nth-child(' + (rowindex + 1) + ')').find('.points').val();
        required_point = Math.ceil(amount / reward_point_setting['per_point_amount']);
        if(required_point > availablePoints) {
          alert('Customer does not have sufficient points. Available points: '+availablePoints+'. Required points: '+required_point);
        }
    }

    $(document).on('submit', '.clear-due-form', function(e) {
        if( $('input[name="paying_amount"]').val() < parseFloat($('#amount').val()) ) {
            alert('Paying amount cannot be bigger than recieved amount');
            $('#p_amount').val('');
            $(".change").text(parseFloat( $('input[name="paying_amount"]').val() - $('#p_amount').val() ).toFixed({{$general_setting->decimal}}));
            e.preventDefault();
        }
        else if( $('input[name="edit_paying_amount"]').val() < parseFloat($('input[name="edit_amount"]').val()) ) {
            alert('Paying amount cannot be bigger than recieved amount');
            $('input[name="edit_amount"]').val('');
            $(".change").text(parseFloat( $('input[name="edit_paying_amount"]').val() - $('input[name="edit_amount"]').val() ).toFixed({{$general_setting->decimal}}));
            e.preventDefault();
        }

        $('#edit-payment select[name="edit_paid_by_id"]').prop('disabled', false);
    });

  $(document).on("click", ".getDeposit", function() {
        var id = $(this).data('id').toString();
        $.get('customer/getDeposit/' + id, function(data) {
            $(".deposit-list tbody").remove();
            var newBody = $("<tbody>");
            $.each(data[0], function(index){
                var newRow = $("<tr>");
                var cols = '';

                cols += '<td>' + data[1][index] + '</td>';
                cols += '<td>' + data[2][index] + '</td>';
                if(data[3][index])
                    cols += '<td>' + data[3][index] + '</td>';
                else
                    cols += '<td>N/A</td>';
                cols += '<td>' + data[4][index] + '<br>' + data[5][index] + '</td>';
                cols += '<td><div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{__("db.action")}}<span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu"><li><button type="button" class="btn btn-link edit-btn" data-id="' + data[0][index] +'" data-toggle="modal" data-target="#edit-deposit"><i class="dripicons-document-edit"></i> {{__("db.edit")}}</button></li><li class="divider"></li>{{ Form::open(['route' => 'customer.deleteDeposit', 'method' => 'post'] ) }}<li><input type="hidden" name="id" value="' + data[0][index] + '" /> <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> {{__("db.delete")}}</button></li>{{ Form::close() }}</ul></div></td>'
                newRow.append(cols);
                newBody.append(newRow);
                $("table.deposit-list").append(newBody);
            });
            $("#view-deposit").modal('show');
        });
  });

  $(document).on("click", ".getPoints", function() {
        var id = $(this).data('id').toString();
        $.get('customer/getPoints/' + id, function(data) {
            $(".points-list tbody").remove();
            var newBody = $("<tbody>");
            $.each(data[0], function(index){
                var newRow = $("<tr>");
                var cols = '';

                cols += '<td>' + data[1][index] + '</td>';
                cols += '<td>' + data[2][index] + '</td>';
                cols += '<td>' + data[7][index] + '</td>';
                if(data[3][index])
                    cols += '<td>' + data[3][index] + '</td>';
                else
                    cols += '<td>N/A</td>';
                cols += '<td>' + data[4][index] + '<br>' + data[5][index] + '</td>';
                cols += '<td>' + data[6][index] + '</td>';

                cols += '<td><div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{{__("db.action")}}<span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default" user="menu"><li><button type="button" class="btn btn-link edit-btn" data-id="' + data[0][index] +'" data-toggle="modal" data-target="#edit-point"><i class="dripicons-document-edit"></i> {{__("db.edit")}}</button></li><li class="divider"></li>{{ Form::open(['route' => 'customer.deletePoints', 'method' => 'post'] ) }}<li><input type="hidden" name="id" value="' + data[0][index] + '" /> <button type="submit" class="btn btn-link" onclick="return confirmDelete()"><i class="dripicons-trash"></i> {{__("db.delete")}}</button></li>{{ Form::close() }}</ul></div></td>'
                newRow.append(cols);
                newBody.append(newRow);
                $("table.points-list").append(newBody);
            });
            $("#view-points").modal('show');
        });
  });

  $(document).on("click", "table.deposit-list .edit-btn", function(event) {
        var id = $(this).data('id');
        var rowindex = $(this).closest('tr').index();
        var amount = $('table.deposit-list tbody tr:nth-child(' + (rowindex + 1) + ')').find('td:nth-child(2)').text();
        var note = $('table.deposit-list tbody tr:nth-child(' + (rowindex + 1) + ')').find('td:nth-child(3)').text();
        if(note == 'N/A')
            note = '';

        $('#edit-deposit input[name="deposit_id"]').val(id);
        $('#edit-deposit input[name="amount"]').val(amount);
        $('#edit-deposit textarea[name="note"]').val(note);
        $('#view-deposit').modal('hide');
    });

     $(document).on("click", "table.points-list .edit-btn", function(event) {
        var id = $(this).data('id');
        var rowindex = $(this).closest('tr').index();
        var amount = $('table.points-list tbody tr:nth-child(' + (rowindex + 1) + ')').find('td:nth-child(2)').text();
        var note = $('table.points-list tbody tr:nth-child(' + (rowindex + 1) + ')').find('td:nth-child(3)').text();
        if(note == 'N/A')
            note = '';

        $('#edit-point input[name="point_id"]').val(id);
        $('#edit-point input[name="points"]').val(amount);
        $('#edit-point textarea[name="note"]').val(note);
        $('#view-points').modal('hide');
    });

    var columns = [{"data": "key"}, {"data": "customer_group"}, {"data": "customer_details"}, {"data": "discount_plan"}, {"data": "reward_point"}, {"data": "deposited_balance"}, {"data": "total_due"}];
    var field_name = <?php echo json_encode($field_name) ?>;
    for(i = 0; i < field_name.length; i++) {
        columns.push({"data": field_name[i]});
    }
    columns.push({"data": "options"});

    let buttons = [];

    @can('customer_export')
        buttons.push([
            {
                extend: 'pdf',
                text: '<i title="export to pdf" class="fa fa-file-pdf-o"></i>',
                exportOptions: {
                    columns: ':visible:Not(.not-exported)',
                    rows: ':visible'
                }
            },
            {
                extend: 'excel',
                text: '<i title="export to excel" class="dripicons-document-new"></i>',
                exportOptions: {
                    columns: ':visible:Not(.not-exported)',
                    rows: ':visible'
                }
            },
            {
                extend: 'csv',
                text: '<i title="export to csv" class="fa fa-file-text-o"></i>',
                exportOptions: {
                    columns: ':visible:Not(.not-exported)',
                    rows: ':visible'
                }
            },
            {
                extend: 'print',
                text: '<i title="print" class="fa fa-print"></i>',
                exportOptions: {
                    columns: ':visible:Not(.not-exported)',
                    rows: ':visible'
                }
            },
        ]);
    @endcan

    buttons.push([
        {
            text: '<i title="delete" class="dripicons-cross"></i>',
            className: 'buttons-delete',
            action: function ( e, dt, node, config ) {
                if(user_verified == '1') {
                    customer_id.length = 0;
                    $(':checkbox:checked').each(function(i){
                        if(i){
                            customer_id[i-1] = $(this).closest('tr').data('customer');
                        }
                    });
                    if(customer_id.length && confirm("Are you sure want to delete?")) {
                        $.ajax({
                            type:'POST',
                            url:'customer/deletebyselection',
                            data:{
                                customerIdArray: customer_id
                            },
                            success:function(data){
                                alert(data);
                            }
                        });
                        dt.rows({ page: 'current', selected: true }).remove().draw(false);
                    }
                    else if(!customer_id.length)
                        alert('No customer is selected!');
                }
                else
                    alert('This feature is disable for demo!');
            }
        },
        {
            extend: 'colvis',
            text: '<i title="column visibility" class="fa fa-eye"></i>',
            columns: ':gt(0)'
        },
    ]);

    $('#customer-table').DataTable( {
        "processing": true,
        "serverSide": true,
        "ajax":{
            url:"{{ url('customers/customer-data')}}",
            data:{
                all_permission: all_permission,
            },
            dataType: "json",
            type:"post"
        },
         "createdRow": function( row, data, dataIndex ) {
             $(row).attr('data-customer', data['id']);
            //  console.log(data);
        },
        "columns": columns,
        'language': {

            'lengthMenu': '_MENU_ {{__("db.records per page")}}',
             "info":      '<small>{{__("db.Showing")}} _START_ - _END_ (_TOTAL_)</small>',
            "search":  '{{__("db.Search")}}',
            'paginate': {
                    'previous': '<i class="dripicons-chevron-left"></i>',
                    'next': '<i class="dripicons-chevron-right"></i>'
            }
        },
        order:[['1', 'desc']],
        'columnDefs': [
            {
                "orderable": false,
                'targets': [0, 2, 3, 4, 5, 6, 7 ]
            },
            {
                'render': function(data, type, row, meta){
                    if(type === 'display'){
                        data = '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>';
                    }

                   return data;
                },
                'checkboxes': {
                   'selectRow': true,
                   'selectAllRender': '<div class="checkbox"><input type="checkbox" class="dt-checkboxes"><label></label></div>'
                },
                'targets': [0]
            }
        ],
        'select': { style: 'multi',  selector: 'td:first-child'},
        'lengthMenu': [[10, 25, 50, -1], [10, 25, 50, "All"]],
        dom: '<"row"lfB>rtip',
        rowId: 'ObjectID',
        buttons: buttons
    } );

  $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

  if(all_permission.indexOf("customers-delete") == -1)
        $('.buttons-delete').addClass('d-none');
</script>
@endpush
