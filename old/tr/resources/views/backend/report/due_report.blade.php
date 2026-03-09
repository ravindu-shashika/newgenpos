@extends('backend.layout.main')
@section('content')

@push('css')
<style>
.dashboard-counts { color: #333; padding: 10px 0; }
.count-title { border-radius: 10px; box-shadow: rgba(37, 83, 185, 0.1) 0px 2px 6px 0px; display: flex; padding: 20px 10px; overflow: hidden; }
.dashboard-counts .count-title i { font-size: 2em; }
.count-title .icon { width: 70px; text-align: center; }
.dashboard-counts .count-title span { top: 7px; right: 7px; position: absolute; font-size: .8em; color: #aaa; display: block; }
.dashboard-counts strong { font-size: .9em; font-weight: 500; color: #555; }
.dashboard-counts .count-number { display: inline-block; font-size: 1.3em; font-weight: 500; line-height: 0.9; }
.count-title { margin-top: 15px; position: relative; }
.dashboard-counts strong { font-size: 1rem; margin-top: 5px; }

</style>
@endpush

<section class="forms">
    <div class="container-fluid">
        <div class="card">
            <div class="card-header mt-2">
                <h4 class="text-center">{{__('db.Customer Due Report')}}</h4>
            </div>
            <div class="card-body">
                <div class="row justify-content-center align-items-end">

                    {{-- Date Range --}}
                    <div class="col-md-4">
                        <div class="form-group mb-0">
                            <label><strong>{{__('db.Choose Your Date')}}</strong></label>
                            <div class="input-group">
                                <div class="input-group-prepend">
                                    <span class="input-group-text bg-white">
                                        <i class="dripicons-calendar text-primary"></i>
                                    </span>
                                </div>
                                <input type="text" class="daterangepicker-field form-control border-left-0"
                                    value="{{$start_date}} To {{$end_date}}" readonly />
                                <input type="hidden" id="start_date" name="start_date" value="{{$start_date}}" />
                                <input type="hidden" id="end_date" name="end_date" value="{{$end_date}}" />
                            </div>
                        </div>
                    </div>

                    {{-- Customer Filter --}}
                    <div class="col-md-4">
                        <div class="form-group mb-0">
                            <label><strong>{{__('db.customer')}}</strong></label>
                            <select id="customer_filter" class="selectpicker form-control"
                                data-live-search="true">
                                <option value="0">{{__('db.All')}} {{__('db.customer')}}</option>
                                @foreach($lims_customer_list as $customer)
                                    <option value="{{$customer->id}}"
                                        {{ $customer_id == $customer->id ? 'selected' : '' }}>
                                        {{$customer->name}} [{{$customer->phone_number}}]
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    {{-- Summary Cards — Dashboard Style --}}
    <section class="dashboard-counts pt-0">
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12">
                    <div class="row">

                        {{-- Grand Total --}}
                        <div class="col-sm-3">
                            <div class="wrapper count-title">
                                <x-info title="Total Grand Amount of Due Sales" type="info" />
                                <div class="icon">
                                    <i class="dripicons-graph-bar" style="color: #733686"></i>
                                </div>
                                <div>
                                    <div class="count-number" id="summary-grand-total">
                                        {{ number_format(0, $general_setting->decimal, '.', '') }}
                                    </div>
                                    <div class="name">
                                        <strong style="color: #733686">{{__('db.grand total')}}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Returned Amount --}}
                        <div class="col-sm-3">
                            <div class="wrapper count-title">
                                <x-info title="Total Returned Amount" type="info" />
                                <div class="icon">
                                    <i class="dripicons-return" style="color: #ff8952"></i>
                                </div>
                                <div>
                                    <div class="count-number" id="summary-returned">
                                        {{ number_format(0, $general_setting->decimal, '.', '') }}
                                    </div>
                                    <div class="name">
                                        <strong style="color: #ff8952">{{__('db.Returned Amount')}}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Paid --}}
                        <div class="col-sm-3">
                            <div class="wrapper count-title">
                                <x-info title="Total Paid Amount" type="info" />
                                <div class="icon">
                                    <i class="dripicons-checkmark" style="color: #00c689"></i>
                                </div>
                                <div>
                                    <div class="count-number" id="summary-paid">
                                        {{ number_format(0, $general_setting->decimal, '.', '') }}
                                    </div>
                                    <div class="name">
                                        <strong style="color: #00c689">{{__('db.Paid')}}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Due --}}
                        <div class="col-sm-3">
                            <div class="wrapper count-title">
                                <x-info title="Grand Total - Returned - Paid = Due" type="info" />
                                <div class="icon">
                                    <i class="dripicons-document" style="color: #0584a0"></i>
                                </div>
                                <div>
                                    <div class="count-number" id="summary-due">
                                        {{ number_format(0, $general_setting->decimal, '.', '') }}
                                    </div>
                                    <div class="name">
                                        <strong style="color: #0584a0">{{__('db.Due')}}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="table-responsive mb-4">
        <table id="report-table" class="table table-hover" style="width:100%">
            <thead>
                <tr>
                    <th class="not-exported"></th>
                    <th>{{__('db.date')}}</th>
                    <th>{{__('db.reference')}}</th>
                    <th>{{__('db.Customer Details')}}</th>
                    <th>{{__('db.grand total')}}</th>
                    <th>{{__('db.Returned Amount')}}</th>
                    <th>{{__('db.Paid')}}</th>
                    <th>{{__('db.Due')}}</th>
                </tr>
            </thead>
            <tfoot class="tfoot active">
                <th></th>
                <th>{{__('db.Total')}}:</th>
                <th></th>
                <th></th>
                <th>{{number_format(0, $general_setting->decimal, '.', '')}}</th>
                <th>{{number_format(0, $general_setting->decimal, '.', '')}}</th>
                <th>{{number_format(0, $general_setting->decimal, '.', '')}}</th>
                <th>{{number_format(0, $general_setting->decimal, '.', '')}}</th>
            </tfoot>
        </table>
    </div>
</section>

@endsection

@push('scripts')
<script type="text/javascript">

    $("ul#report").siblings('a').attr('aria-expanded','true');
    $("ul#report").addClass("show");
    $("ul#report #due-report-menu").addClass("active");

    var start_date  = <?php echo json_encode($start_date); ?>;
    var end_date    = <?php echo json_encode($end_date); ?>;
    var customer_id = <?php echo json_encode($customer_id ?? 0); ?>;

    $.ajaxSetup({
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        }
    });

    var reportTable = $('#report-table').DataTable({
        "processing": true,
        "serverSide": true,
        "ajax": {
            url: "customer-due-report-data",
            data: function(d) {
                d.start_date  = $('#start_date').val();
                d.end_date    = $('#end_date').val();
                d.customer_id = $('#customer_filter').val();
            },
            dataType: "json",
            type: "post"
        },
        "columns": [
            {"data": "key"},
            {"data": "date"},
            {"data": "reference_no"},
            {"data": "customer"},
            {"data": "grand_total"},
            {"data": "returned_amount"},
            {"data": "paid"},
            {"data": "due"}
        ],
        'language': {
            'lengthMenu': '_MENU_ {{__("db.records per page")}}',
            "info": '<small>{{__("db.Showing")}} _START_ - _END_ (_TOTAL_)</small>',
            "search": '{{__("db.Search")}}',
            'paginate': {
                'previous': '<i class="dripicons-chevron-left"></i>',
                'next': '<i class="dripicons-chevron-right"></i>'
            }
        },
        order: [['1', 'desc']],
        'columnDefs': [
            {
                "orderable": false,
                'targets': [0, 2, 3]
            },
            {
                'render': function(data, type, row, meta) {
                    if (type === 'display') {
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
        'select': { style: 'multi', selector: 'td:first-child' },
        'lengthMenu': [[10, 25, 50, -1], [10, 25, 50, "All"]],
        dom: '<"row"lfB>rtip',
        rowId: 'ObjectID',
        buttons: [
            {
                extend: 'pdf',
                text: '<i title="export to pdf" class="fa fa-file-pdf-o"></i>',
                exportOptions: { columns: ':visible:Not(.not-exported)', rows: ':visible' },
                action: function(e, dt, button, config) {
                    datatable_sum_due(dt, true);
                    $.fn.dataTable.ext.buttons.pdfHtml5.action.call(this, e, dt, button, config);
                    datatable_sum_due(dt, false);
                },
                footer: true
            },
            {
                extend: 'excel',
                text: '<i title="export to excel" class="dripicons-document-new"></i>',
                exportOptions: { columns: ':visible:Not(.not-exported)', rows: ':visible' },
                action: function(e, dt, button, config) {
                    datatable_sum_due(dt, true);
                    $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                    datatable_sum_due(dt, false);
                },
                footer: true
            },
            {
                extend: 'csv',
                text: '<i title="export to csv" class="fa fa-file-text-o"></i>',
                exportOptions: { columns: ':visible:Not(.not-exported)', rows: ':visible' },
                action: function(e, dt, button, config) {
                    datatable_sum_due(dt, true);
                    $.fn.dataTable.ext.buttons.csvHtml5.action.call(this, e, dt, button, config);
                    datatable_sum_due(dt, false);
                },
                footer: true
            },
            {
                extend: 'print',
                text: '<i title="print" class="fa fa-print"></i>',
                exportOptions: { columns: ':visible:Not(.not-exported)', rows: ':visible' },
                action: function(e, dt, button, config) {
                    datatable_sum_due(dt, true);
                    $.fn.dataTable.ext.buttons.print.action.call(this, e, dt, button, config);
                    datatable_sum_due(dt, false);
                },
                footer: true
            },
            {
                extend: 'colvis',
                text: '<i title="column visibility" class="fa fa-eye"></i>',
                columns: ':gt(0)'
            },
        ],
        drawCallback: function() {
            var api = this.api();
            datatable_sum_due(api, false);
        }
    });

    reportTable.on('xhr.dt', function(e, settings, json) {
        if (json) {
            $('#summary-grand-total').hide().html(json.total_grand).show(500);
            $('#summary-returned').hide().html(json.total_returned).show(500);
            $('#summary-paid').hide().html(json.total_paid).show(500);
            $('#summary-due').hide().html(json.total_due).show(500);
        }
    });

    $('.daterangepicker-field').on('apply.daterangepicker', function(ev, picker) {
        $('#start_date').val(picker.startDate.format('YYYY-MM-DD'));
        $('#end_date').val(picker.endDate.format('YYYY-MM-DD'));
        reportTable.ajax.reload();
    });

    $('#customer_filter').on('change', function() {
        reportTable.ajax.reload();
    });


    function cleanSum(data) {
        return data.map(function(val) {
            return parseFloat(String(val).replace(/,/g, '')) || 0;
        }).sum();
    }

    function datatable_sum_due(dt_selector, is_calling_first) {
        if (dt_selector.rows('.selected').any() && is_calling_first) {
            var rows = dt_selector.rows('.selected').indexes();
            $(dt_selector.column(4).footer()).html(cleanSum(dt_selector.cells(rows, 4, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(5).footer()).html(cleanSum(dt_selector.cells(rows, 5, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(6).footer()).html(cleanSum(dt_selector.cells(rows, 6, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(7).footer()).html(cleanSum(dt_selector.cells(rows, 7, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
        } else {
            $(dt_selector.column(4).footer()).html(cleanSum(dt_selector.column(4, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(5).footer()).html(cleanSum(dt_selector.column(5, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(6).footer()).html(cleanSum(dt_selector.column(6, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
            $(dt_selector.column(7).footer()).html(cleanSum(dt_selector.column(7, { page: 'current' }).data()).toFixed({{$general_setting->decimal}}));
        }
    }

</script>
@endpush
