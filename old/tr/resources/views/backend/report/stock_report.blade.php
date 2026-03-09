@extends('backend.layout.main')

@section('content')
<style type="text/css">
    .top-fields{margin-top:10px;position: relative;}
    .top-fields label {font-size:11px;font-weight:600;margin-left:10px;padding:0 3px;position:absolute;top:-8px;z-index:9;}
    .top-fields input{font-size:13px;height:45px}
    .dt-buttons{width: 100%}
</style>
<section class="forms">
    <div class="container-fluid">

        <div class="card">
            <div class="card-header mt-2">
                <h3 class="text-center">{{ __('db.Stock Report') }}</h3>
            </div>

            <div class="card-body">
                <div class="row mb-3 product-report-filter">

                    {{-- Date --}}
                    <div class="col-md-3 mt-3">
                        <div class="form-group top-fields">
                            <label>
                                {{__('db.Choose Your Date')}}
                            </label>
                            <input type="text"
                                class="daterangepicker-field form-control"
                                value="{{$start_date}} To {{$end_date}}"
                                required />

                            <input type="hidden"
                                id="start_date"
                                name="start_date"
                                value="{{$start_date}}" />

                            <input type="hidden"
                                id="end_date"
                                name="end_date"
                                value="{{$end_date}}" />
                        </div>
                    </div>

                    {{-- Warehouse --}}
                    <div class="col-md-3 mt-3">
                        <div class="form-group top-fields">
                            <label>
                                {{ __('db.Choose Warehouse') }}
                            </label>
                            <select id="warehouse_id"
                                    class="selectpicker form-control"
                                    data-live-search="true">
                                <option value="0">{{ __('db.All Warehouse') }}</option>
                                @foreach($warehouses as $warehouse)
                                    <option value="{{ $warehouse->id }}"
                                        {{ $warehouse_id == $warehouse->id ? 'selected' : '' }}>
                                        {{ $warehouse->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    {{-- Category --}}
                    <div class="col-md-3 mt-3">
                        <div class="form-group top-fields">
                            <label>
                                {{ __('db.category') }}
                            </label>
                            <select id="category_id"
                                    class="selectpicker form-control"
                                    data-live-search="true">
                                <option value="0">{{ __('db.Select Category') }}</option>
                                @foreach($categories as $category)
                                    <option value="{{ $category->id }}">
                                        {{ $category->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    {{-- Stock Status --}}
                    <div class="col-md-3 mt-3">
                        <div class="form-group top-fields">
                            <label>
                                {{ __('db.status') }}
                            </label>
                            <select id="stock_status"
                                    class="selectpicker form-control">
                                <option value="">{{ __('db.All') }}</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    {{-- Table --}}
    <div class="table-responsive mt-3">
        <table id="stock-table" class="table table-hover" style="width:100%">
            <thead>
                <tr>
                    <th>{{ __('db.date') }}</th>
                    <th>{{ __('db.Code') }}</th>
                    <th>{{ __('db.Product') }}</th>
                    <th>{{ __('db.Variant') }}</th>
                    <th>{{ __('db.category') }}</th>
                    <th>{{ __('db.Warehouse') }}</th>
                    <th>{{ __('db.Cost') }}</th>
                    <th>{{ __('db.Price') }}</th>
                    <th>{{ __('db.stock') }}</th>
                    <th>{{ __('db.Cost') }}</th>
                    <th>{{ __('db.Price') }}</th>
                    <th>{{ __('db.profit') }}</th>
                </tr>
            </thead>

            <tfoot class="tfoot active">
                <tr>
                    <th colspan="8" class="text-right">
                        {{ __('db.Total') }}:
                    </th>
                    <th id="total_qty"></th>
                    <th id="total_cost_value"></th>
                    <th id="total_price_value"></th>
                    <th id="total_profit"></th>
                </tr>
            </tfoot>
        </table>
    </div>
</section>

@endsection

@push('scripts')
<script>
$(document).ready(function(){

    // Initialize DataTable first
    var stockTable = $('#stock-table').DataTable({
        processing: true,
        serverSide: true,
        dom: '<"row align-items-center"' +
            '<"col-md-4"l>' +
            '<"col-md-4 text-center"f>' +
            '<"col-md-4 text-end"B>' +
        '>rtip',
        ajax: {
            url: "{{ route('report.stock-data') }}",
            type: "POST",
            data: function(d){
                d._token = "{{ csrf_token() }}";
                d.start_date = $('#start_date').val();
                d.end_date   = $('#end_date').val();
                d.warehouse_id = parseInt($('#warehouse_id').val());
                d.category_id = parseInt($('#category_id').val());
                d.stock_status = $('#stock_status').val();
            }
        },
        lengthMenu: [
            [10, 25, 50, 100, -1],
            [10, 25, 50, 100, "All"]
        ],
        columns: [
            {
                data: 'date',
                render: function(data, type, row) {
                    if (type === 'display') {
                        return moment(data).format('DD-MM-YYYY hh:mm:ss A');
                    }
                    return data; // raw value for sorting
                }
            },
            { data: 'code' },
            { data: 'name' },
            { data: 'variant' },
            { data: 'category' },
            { data: 'warehouse' },
            { data: 'cost' },
            { data: 'price' },
            { data: 'qty' },
            { data: 'stock_cost' },
            { data: 'stock_price' },
            { data: 'profit' }
        ],
        drawCallback: function(settings){
            if(settings.json && settings.json.footer){
                $('#total_qty').html(settings.json.footer.total_qty);
                $('#total_cost_value').html(settings.json.footer.total_cost_value);
                $('#total_price_value').html(settings.json.footer.total_price_value);
                $('#total_profit').html(settings.json.footer.total_profit);
            }
        },
        order: [[0, 'desc']],
        'columnDefs': [
            {
                "orderable": false,
                'targets': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            }
        ],
        buttons: [
            {
                extend: "pdfHtml5",
                text: '<i class="fa fa-file-pdf-o"></i>',
                footer: true,
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: {
                    columns: ":visible:not(.not-exported)"
                }
            },
            {
                extend: "csvHtml5",
                text: '<i class="fa fa-file-text-o"></i>',
                footer: true,
                exportOptions: {
                    columns: ":visible:not(.not-exported)"
                }
            },
            {
                extend: 'colvis',
                text: '<i title="column visibility" class="fa fa-eye"></i>',
                columns: ':gt(0)'
            },
        ],
    });

    // Initialize Date Range Picker
    $('.daterangepicker-field').on('apply.daterangepicker', function(ev, picker) {
        $('input[name=start_date]').val(picker.startDate.format('YYYY-MM-DD'));
        $('input[name=end_date]').val(picker.endDate.format('YYYY-MM-DD'));
        stockTable.ajax.reload();
    });

    // Reload DataTable on other filter changes
    $('#warehouse_id, #category_id, #stock_status').on('change', function(){
        stockTable.ajax.reload();
    });

});
</script>
@endpush