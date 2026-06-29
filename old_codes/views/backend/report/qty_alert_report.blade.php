@extends('backend.layout.main') @section('content')

<section class="forms">
   <div class="container-fluid d-flex justify-content-between align-items-center mb-3">
            <h4 class="m-0">{{ __('db.Product Quantity Alert') }}</h4>
            <form method="GET" action="{{ route('report.qtyAlert') }}" class="d-flex align-items-end mb-3">
                <div class="form-group me-2">
                    <label class="mb-1">{{ __('db.Warehouse') }}</label>
                    <select id="warehouse_id" name="warehouse_id" class="selectpicker form-control" data-live-search="true"
                        data-live-search-style="begins">
                        <option value="0" {{ request('warehouse_id') == 0 ? 'selected' : '' }}>
                            {{ __('db.All Warehouse') }}</option>
                        @foreach ($lims_warehouse_list as $warehouse)
                            <option value="{{ $warehouse->id }}"
                                {{ request('warehouse_id') == $warehouse->id ? 'selected' : '' }}>
                                {{ $warehouse->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
            </form>
        </div>
    <div id="table-container">
        @include('backend.report.partials.qty_alert_table')
    </div>
</section>

@endsection

@push('scripts')
<script type="text/javascript">
    $("ul#report").siblings('a').attr('aria-expanded','true');
    $("ul#report").addClass("show");
    $("ul#report #qtyAlert-report-menu").addClass("active");

    function initializeQtyAlertTable() {
        $('#report-table').DataTable( {
            "destroy": true,
            "order": [],
            'language': {
                'lengthMenu': '_MENU_ {{__("db.records per page")}}',
                 "info":      '<small>{{__("db.Showing")}} _START_ - _END_ (_TOTAL_)</small>',
                "search":  '{{__("db.Search")}}',
                'paginate': {
                        'previous': '<i class="dripicons-chevron-left"></i>',
                        'next': '<i class="dripicons-chevron-right"></i>'
                }
            },
            'columnDefs': [
                {
                    "orderable": false,
                    'targets': 0
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
            buttons: [
                {
                    extend: 'pdf',
                    text: '<i title="export to pdf" class="fa fa-file-pdf-o"></i>',
                    exportOptions: {
                        columns: ':visible:Not(.not-exported)',
                        rows: ':visible'
                    },
                },
                {
                    extend: 'excel',
                    text: '<i title="export to excel" class="dripicons-document-new"></i>',
                    exportOptions: {
                        columns: ':visible:Not(.not-exported)',
                        rows: ':visible'
                    },
                },
                {
                    extend: 'csv',
                    text: '<i title="export to csv" class="fa fa-file-text-o"></i>',
                    exportOptions: {
                        columns: ':visible:Not(.not-exported)',
                        rows: ':visible'
                    },
                },
                {
                    extend: 'print',
                    text: '<i title="print" class="fa fa-print"></i>',
                    exportOptions: {
                        columns: ':visible:Not(.not-exported)',
                        rows: ':visible'
                    },
                },
                {
                    extend: 'colvis',
                    text: '<i title="column visibility" class="fa fa-eye"></i>',
                    columns: ':gt(0)'
                }
            ],
        } );
    }

    initializeQtyAlertTable();

    function reloadQtyAlertTable() {
        var warehouse_id = $('#warehouse_id').val();
        $.ajax({
            url: "{{ route('report.qtyAlert') }}",
            type: "GET",
            data: {
                warehouse_id: warehouse_id
            },
            beforeSend: function () {
                $('.table-responsive').addClass('opacity-50');
            },
            success: function (data) {
                $('#table-container').html(data);
                initializeQtyAlertTable();
                $('.table-responsive').removeClass('opacity-50');
            }
        });
    }

    $('#warehouse_id').on('changed.bs.select', function () {
        reloadQtyAlertTable();
    });

</script>
@endpush
