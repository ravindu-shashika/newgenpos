@extends('backend.layout.main')
@section('content')

<x-success-message key="message" />
<x-error-message key="not_permitted" />

<section>
    <div class="container-fluid">

        <ul class="nav nav-tabs" id="bookingTabs" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" id="calendar-tab" data-toggle="tab" href="#tab-calendar" role="tab">
                    <i class="dripicons-calendar"></i> {{ __('db.Calendar View') }}
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="list-tab" data-toggle="tab" href="#tab-list" role="tab">
                    <i class="dripicons-list"></i> {{ __('db.List View') }}
                </a>
            </li>
        </ul>

        <div class="tab-content">

            {{-- TAB 1: CALENDAR --}}
            <div class="tab-pane fade show active" id="tab-calendar" role="tabpanel">
                <div class="card border-top-0">
                    <div class="card-body p-0">
                        <div class="row no-gutters">

                            {{-- Sidebar --}}
                            <div class="col-auto border-right" style="width:230px;min-height:650px;background:#fafafa;">
                                <div class="p-3 border-bottom">
                                    <button class="btn btn-primary btn-block" data-toggle="modal"
                                            data-target="#booking-modal" id="addBookingBtn">
                                        <i class="dripicons-plus"></i> {{ __('db.Add Booking') }}
                                    </button>
                                </div>
                                <div class="p-3">
                                    <p class="text-muted text-uppercase" style="font-size:11px;font-weight:600;letter-spacing:1px;">{{ __("db.Filters") }}</p>

                                    @if(Auth::user()->role_id <= 2)
                                    <div class="mb-3">
                                        <select id="warehouseFilter" class="selectpicker form-control form-control-sm"
                                                data-live-search="true" title="All Warehouses">
                                            <option value="">{{ __('db.All Warehouses') }}</option>
                                            @foreach($lims_warehouse_list as $wh)
                                                <option value="{{ $wh->id }}">{{ $wh->name }}</option>
                                            @endforeach
                                        </select>
                                    </div>
                                    @endif

                                    <div class="filter-item d-flex align-items-center mb-2 p-2 rounded" style="cursor:pointer;" onclick="toggleFilter('Booked')">
                                        <span style="width:12px;height:12px;border-radius:50%;background:#696cff;flex-shrink:0;margin-right:8px;"></span>
                                        <span>{{ __('db.Booked') }}</span>
                                        <input type="checkbox" class="cal-filter d-none" id="filter-booked" data-value="Booked" checked>
                                        <i class="dripicons-checkmark ml-auto text-primary filter-icon-booked"></i>
                                    </div>
                                    <div class="filter-item d-flex align-items-center mb-2 p-2 rounded" style="cursor:pointer;" onclick="toggleFilter('Waiting')">
                                        <span style="width:12px;height:12px;border-radius:50%;background:#ffab00;flex-shrink:0;margin-right:8px;"></span>
                                        <span>{{ __('db.Waiting') }}</span>
                                        <input type="checkbox" class="cal-filter d-none" id="filter-waiting" data-value="Waiting" checked>
                                        <i class="dripicons-checkmark ml-auto text-warning filter-icon-waiting"></i>
                                    </div>
                                    <div class="filter-item d-flex align-items-center mb-2 p-2 rounded" style="cursor:pointer;" onclick="toggleFilter('Completed')">
                                        <span style="width:12px;height:12px;border-radius:50%;background:#28c76f;flex-shrink:0;margin-right:8px;"></span>
                                        <span>{{ __('db.Completed') }}</span>
                                        <input type="checkbox" class="cal-filter d-none" id="filter-completed" data-value="Completed" checked>
                                        <i class="dripicons-checkmark ml-auto text-success filter-icon-completed"></i>
                                    </div>
                                    <div class="filter-item d-flex align-items-center mb-2 p-2 rounded" style="cursor:pointer;" onclick="toggleFilter('Cancelled')">
                                        <span style="width:12px;height:12px;border-radius:50%;background:#ea5455;flex-shrink:0;margin-right:8px;"></span>
                                        <span>{{ __('db.Cancelled') }}</span>
                                        <input type="checkbox" class="cal-filter d-none" id="filter-cancelled" data-value="Cancelled" checked>
                                        <i class="dripicons-checkmark ml-auto text-danger filter-icon-cancelled"></i>
                                    </div>

                                </div>
                            </div>

                            {{-- Calendar with loader --}}
                            <div class="col p-3 position-relative">
                                {{-- Loader overlay --}}
                                <div id="calendarLoader" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.85);z-index:10;display:flex;align-items:center;justify-content:center;border-radius:4px;">
                                    <div class="text-center">
                                        <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status">
                                            <span class="sr-only">Loading...</span>
                                        </div>
                                        <p class="mt-2 text-muted">Loading calendar...</p>
                                    </div>
                                </div>
                                <div id="calendar"></div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {{-- TAB 2: LIST --}}
            <div class="tab-pane fade" id="tab-list" role="tabpanel">
                <div class="card border-top-0">
                    <div class="card-header mt-2">
                        <h3 class="text-center">{{ __('db.Booking List') }}</h3>
                    </div>
                    <form method="GET" action="{{ route('booking.index') }}" id="listFilterForm">
                        <input type="hidden" name="tab" value="list">
                        <div class="row mb-3 px-3">
                            <div class="col-md-4 mt-3">
                                <div class="d-flex align-items-center">
                                    <label class="mb-0 mr-2 text-nowrap">{{ __('db.date') }}</label>
                                    <div class="input-group">
                                        <input type="text" class="daterangepicker-field form-control" value="{{ $starting_date }} To {{ $ending_date }}" />
                                        <input type="hidden" name="starting_date" value="{{ $starting_date }}" />
                                        <input type="hidden" name="ending_date" value="{{ $ending_date }}" />
                                    </div>
                                </div>
                            </div>
                            @if(Auth::user()->role_id <= 2)
                            <div class="col-md-3 mt-3">
                                <div class="d-flex align-items-center">
                                    <label class="mb-0 mr-2 text-nowrap">{{ __('db.Warehouse') }}</label>
                                    <select name="warehouse_id" class="selectpicker form-control" data-live-search="true">
                                        <option value="0">{{ __('db.All') }}</option>
                                        @foreach($lims_warehouse_list as $wh)
                                            <option value="{{ $wh->id }}" @if($wh->id == $warehouse_id) selected @endif>{{ $wh->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            @endif
                            <div class="col-md-2 mt-3">
                                <div class="d-flex align-items-center">
                                    <label class="mb-0 mr-2">{{ __('db.Status') }}</label>
                                    <select name="status" class="selectpicker form-control">
                                        <option value="0">{{ __('db.All') }}</option>
                                        <option value="Booked"    @if($status=='Booked')    selected @endif>{{ __('db.Booked') }}</option>
                                        <option value="Waiting"   @if($status=='Waiting')   selected @endif>{{ __('db.Waiting') }}</option>
                                        <option value="Completed" @if($status=='Completed') selected @endif>{{ __('db.Completed') }}</option>
                                        <option value="Cancelled" @if($status=='Cancelled') selected @endif>{{ __('db.Cancelled') }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-1 mt-3">
                                <button class="btn btn-primary btn-sm" type="submit">{{ __('db.submit') }}</button>
                            </div>
                        </div>
                    </form>
                    <div class="table-responsive">
                        <table id="booking-table" class="table booking-list">
                            <thead>
                                <tr>
                                    <th class="not-exported"></th>
                                    <th>{{ __('db.date') }}</th>
                                    <th>{{ __('db.Warehouse') }}</th>
                                    <th>{{ __('db.customer') }}</th>
                                    <th>{{ __('db.Employee') }}</th>
                                    <th>Product / Service</th>
                                    <th>Price</th>
                                    <th>{{ __('db.Start') }}</th>
                                    <th>{{ __('db.End') }}</th>
                                    <th>{{ __('db.Status') }}</th>
                                    <th>{{ __('db.Note') }}</th>
                                    <th class="not-exported">{{ __('db.action') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($lims_booking_all as $key => $booking)
                                <tr data-id="{{ $booking->id }}">
                                    <td>{{ $key }}</td>
                                    <td>{{ date('d-m-Y', strtotime($booking->created_at->toDateString())) }}</td>
                                    <td>{{ $booking->warehouse->name ?? '—' }}</td>
                                    <td>{{ $booking->customer->name ?? '—' }}<br><small class="text-muted">{{ $booking->customer->phone_number ?? '' }}</small></td>
                                    <td>{{ $booking->employee->name ?? '—' }}</td>
                                    <td>{{ $booking->product->name ?? '—' }}</td>
                                    <td>{{ $booking->price ?? '—' }}</td>
                                    <td>{{ date('d-m-Y H:i', strtotime($booking->start_date)) }}</td>
                                    <td>{{ date('d-m-Y H:i', strtotime($booking->end_date)) }}</td>
                                    <td>
                                        @if($booking->status == 'Booked') <span class="badge badge-primary">{{ __('db.Booked') }}</span>
                                        @elseif($booking->status == 'Waiting') <span class="badge badge-warning">{{ __('db.Waiting') }}</span>
                                        @elseif($booking->status == 'Completed') <span class="badge badge-success">{{ __('db.Completed') }}</span>
                                        @elseif($booking->status == 'Cancelled') <span class="badge badge-danger">{{ __('db.Cancelled') }}</span>
                                        @endif
                                    </td>
                                    <td>{{ $booking->note }}</td>
                                    <td>
                                        <div class="btn-group">
                                            <button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
                                                {{ __('db.action') }}<span class="caret"></span>
                                            </button>
                                            <ul class="dropdown-menu edit-options dropdown-menu-right dropdown-default">
                                                <li>
                                                    <button type="button" class="btn btn-link edit-booking-btn" data-id="{{ $booking->id }}">
                                                        <i class="dripicons-document-edit"></i> {{ __('db.edit') }}
                                                    </button>
                                                </li>
                                                <li class="divider"></li>
                                                <form action="{{ route('bookings.destroy', $booking->id) }}" method="POST">
                                                    @csrf
                                                    @method('DELETE')
                                                    <li>
                                                        <button type="submit" class="btn btn-link" onclick="return confirmDelete()">
                                                            <i class="dripicons-trash"></i> {{ __('db.delete') }}
                                                        </button>
                                                    </li>
                                                </form>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>

{{-- Booking Modal --}}
<div id="booking-modal" tabindex="-1" role="dialog" aria-labelledby="bookingModalLabel" aria-hidden="true" class="modal fade text-left">
    <div role="document" class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 id="bookingModalLabel" class="modal-title">{{ __("db.Add Booking") }}</h5>
                <button type="button" data-dismiss="modal" aria-label="Close" class="close">
                    <span aria-hidden="true"><i class="dripicons-cross"></i></span>
                </button>
            </div>
            <div class="modal-body">
                <p class="italic"><small>{{ __('db.The field labels marked with * are required input fields') }}.</small></p>
                <form id="bookingForm" method="POST" action="{{ route('bookings.store') }}">
                    @csrf
                    <input type="hidden" id="formMethod" name="_method" value="POST">
                    <div class="row">

                        {{-- Warehouse --}}
                        <div class="col-md-6 form-group">
                            <label>{{ __('db.Warehouse') }} *</label>
                            <select name="warehouse_id" id="b_warehouse_id" class="selectpicker form-control" required
                                    data-live-search="true" title="Select Warehouse...">
                                @foreach($lims_warehouse_list as $wh)
                                    <option value="{{ $wh->id }}">{{ $wh->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Customer --}}
                        <div class="col-md-6 form-group">
                            <label>{{ __('db.customer') }} *</label>
                            <select name="customer_id" id="b_customer_id" class="selectpicker form-control" required
                                    data-live-search="true" title="Select Customer...">
                                @foreach($lims_customer_list as $customer)
                                    <option value="{{ $customer->id }}" data-phone="{{ $customer->phone_number }}">
                                        {{ $customer->name }} ({{ $customer->phone_number }})
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Employee --}}
                        <div class="col-md-6 form-group">
                            <label>{{ __('db.Employee') }}</label>
                            <select name="user_id" id="b_user_id" class="selectpicker form-control"
                                    data-live-search="true" title="Select Employee...">
                                <option value="">— No Employee —</option>
                                @foreach($lims_user_list as $user)
                                    <option value="{{ $user->id }}">{{ $user->name }} @if($user->phone)({{ $user->phone }})@endif</option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Status --}}
                        <div class="col-md-6 form-group">
                            <label>{{ __('db.status') }} *</label>
                            <select name="status" id="b_status" class="selectpicker form-control" required>
                                <option value="Booked" selected>{{ __('db.Booked') }}</option>
                                <option value="Waiting">{{ __('db.Waiting') }}</option>
                                <option value="Completed">{{ __('db.Completed') }}</option>
                                <option value="Cancelled">{{ __('db.Cancelled') }}</option>
                            </select>
                        </div>

                        {{-- Product (service type only) --}}
                        <div class="col-md-6 form-group">
                            <label>Product / Service</label>
                            <select name="product_id" id="b_product_id" class="selectpicker form-control"
                                    data-live-search="true" title="Select Service...">
                                <option value="">— No Product —</option>
                                @foreach($lims_service_products as $product)
                                    <option value="{{ $product->id }}" data-price="{{ $product->price }}">
                                        {{ $product->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        {{-- Price (auto-fill from product) --}}
                        <div class="col-md-6 form-group">
                            <label>Price</label>
                            <input type="number" name="price" id="b_price"
                                   class="form-control" placeholder="0.00" step="any" min="0">
                        </div>

                        {{-- Start Date --}}
                        <div class="col-md-6 form-group">
                            <label>{{ __('db.Start Date') }} *</label>
                            <input type="text" name="start_date" id="b_start_date"
                                   class="form-control date"
                                   placeholder="{{ __('db.Choose date') }}"
                                   value="{{date($general_setting->date_format,strtotime('now'))}}"
                                   required>
                        </div>

                        <div class="col-md-6 form-group">
                            <label>{{ __('db.End Date') }} *</label>
                            <input type="text" name="end_date" id="b_end_date"
                                   class="form-control date"
                                   placeholder="{{ __('db.Choose date') }}"
                                   value="{{ date($general_setting->date_format, strtotime('now')) }}"
                                   required>
                        </div>

                    </div>

                    <div class="form-group">
                        <label>{{ __('db.Note') }}</label>
                        <textarea name="note" id="b_note" rows="3" class="form-control" placeholder="Enter note..."></textarea>
                    </div>
                    {{-- <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="b_send_email" name="send_email" value="1">
                            <label class="form-check-label" for="b_send_email">{{ __('db.Send Email') }}</label>
                        </div>
                    </div> --}}
                    <div class="form-group d-flex justify-content-between">
                        <div>
                            <button type="submit" id="bookingSubmitBtn" class="btn btn-primary">{{ __('db.submit') }}</button>
                            <button type="button" class="btn btn-secondary ml-2" data-dismiss="modal">{{ __('db.Cancel') }}</button>
                        </div>
                        <button type="button" id="bookingDeleteBtn" class="btn btn-danger d-none">
                            <i class="dripicons-trash"></i> {{ __('db.delete') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection

@push('css')
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css">
<style>
    #calendar { min-height: 650px; }
    .fc .fc-button-primary { background-color: #5a8dee !important; border-color: #5a8dee !important; }
    .fc .fc-button-primary:hover,
    .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #4a7de2 !important; border-color: #4a7de2 !important; }
    .fc .fc-daygrid-day.fc-day-today { background: #eff3ff !important; }
    .fc-event { border-radius: 4px !important; font-size: 12px !important; padding: 2px 5px !important; }
    .fc-col-header-cell { background: #f8f9fa; font-weight: 600; }
    .filter-item { transition: background .15s; }
    .filter-item:hover { background: #f0f0f0; }
    .filter-item.inactive { opacity: .4; }
    .nav-tabs { border-bottom: 2px solid #dee2e6; }
    .tab-content > .tab-pane { border: 1px solid #dee2e6; border-top: none; }
</style>
@endpush

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js"></script>
<script>
$(document).ready(function () {

    $("ul#booking").siblings('a').attr('aria-expanded', 'true');
    $("ul#booking").addClass("show");
    $("ul#booking #booking-menu").addClass("active");

    $.ajaxSetup({ headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') } });
    $('.selectpicker').selectpicker({ style: 'btn-link' });

    function confirmDelete() { return confirm("Are you sure want to delete?"); }

    // ── DataTable ─────────────────────────────────────────────────
    var booking_id    = [];
    var user_verified = <?php echo json_encode(env('USER_VERIFIED')) ?>;

    $('#booking-table').DataTable({
        "order": [],
        'language': {
            'lengthMenu': '_MENU_ {{ __("db.records per page") }}',
            "info": '<small>{{ __("db.Showing") }} _START_ - _END_ (_TOTAL_)</small>',
            "search": '{{ __("db.Search") }}',
            'paginate': { 'previous': '<i class="dripicons-chevron-left"></i>', 'next': '<i class="dripicons-chevron-right"></i>' }
        },
        'columnDefs': [
            { "orderable": false, 'targets': [0, 11] },
            { 'checkboxes': { 'selectRow': true }, 'targets': 0 }
        ],
        'select': { style: 'multi', selector: 'td:first-child' },
        'lengthMenu': [[10, 25, 50, -1], [10, 25, 50, "All"]],
        dom: '<"row"lfB>rtip',
        buttons: [
            { extend: 'pdf',    text: '<i class="fa fa-file-pdf-o"></i>',       exportOptions: { columns: ':visible:Not(.not-exported)' }, footer: true },
            { extend: 'excel',  text: '<i class="dripicons-document-new"></i>',  exportOptions: { columns: ':visible:Not(.not-exported)' }, footer: true },
            { extend: 'csv',    text: '<i class="fa fa-file-text-o"></i>',       exportOptions: { columns: ':visible:Not(.not-exported)' }, footer: true },
            { extend: 'print',  text: '<i class="fa fa-print"></i>',             exportOptions: { columns: ':visible:Not(.not-exported)' }, footer: true },
            {
                text: '<i class="dripicons-cross"></i>', className: 'buttons-delete',
                action: function (e, dt) {
                    if (user_verified == '1') {
                        booking_id.length = 0;
                        $(':checkbox:checked').each(function (i) { if (i) booking_id[i-1] = $(this).closest('tr').data('id'); });
                        if (booking_id.length && confirm("Are you sure want to delete?")) {
                            $.ajax({ type:'POST', url:'{{ url("bookings/deletebyselection") }}', data:{ bookingIdArray: booking_id },
                                success: function(data) { alert(data); dt.rows({ page:'current', selected:true }).remove().draw(false); }
                            });
                        } else if (!booking_id.length) alert('Nothing is selected!');
                    } else alert('This feature is disabled for demo!');
                }
            },
            { extend: 'colvis', text: '<i class="fa fa-eye"></i>', columns: ':gt(0)' },
        ],
    });

    // Edit from list
    $(document).on('click', '.edit-booking-btn', function () {
        $.get('{{ url("bookings") }}/' + $(this).data('id'), function (b) { openEditFromData(b); });
    });

    // ── Product → auto-fill price ─────────────────────────────────
    $('#b_product_id').on('change', function () {
        var selected = $(this).find('option:selected');
        var price    = selected.data('price');
        if (price) {
            $('#b_price').val(price);
        } else {
            $('#b_price').val('');
        }
        $('.selectpicker').selectpicker('refresh');
    });

    // ── FullCalendar v5 ───────────────────────────────────────────
    var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        height:       'auto',
        editable:     false,
        selectable:   true,
        navLinks:     true,
        dayMaxEvents: true,
        nowIndicator: true,

        loading: function (isLoading) {
            if (isLoading) {
                $('#calendarLoader').fadeIn(200);
            } else {
                $('#calendarLoader').fadeOut(300);
            }
        },

        events: function (info, successCb, failureCb) {
            var statuses = [];
            $('.cal-filter:checked').each(function () { statuses.push($(this).data('value')); });
            $.get('{{ route("booking.events") }}', {
                start: info.startStr, end: info.endStr,
                status: statuses.join(','),
                warehouse_id: $('#warehouseFilter').val() || ''
            }, successCb).fail(failureCb);
        },

        dateClick:  function (info)  { openAddForm(info.dateStr); },
        eventClick: function (info)  { openEditForm(info.event); },

        eventDidMount: function (info) {
            var p = info.event.extendedProps;
            var tip = 'Customer: ' + (p.customer || '') +
                      '\nStatus: '   + (p.status   || '') +
                      '\nEmployee: ' + (p.employee  || '');
            if (p.note) tip += '\nNote: ' + p.note;
            $(info.el).attr('title', tip).tooltip({ container: 'body', placement: 'top' });
        },
    });

    // ── Tab switch → re-render calendar ──────────────────────────
    $('#calendar-tab').on('shown.bs.tab', function () {
        calendar.render();
        calendar.updateSize();
    });

    // ── Default: Calendar active, List only when ?tab=list ────────
    if ('{{ request("tab") }}' === 'list') {
        $('#list-tab').tab('show');
    } else {
        setTimeout(function () {
            calendar.render();
            calendar.updateSize();
        }, 200);
    }

    $(document).on('change', '.cal-filter, #warehouseFilter', function () {
        calendar.refetchEvents();
    });

    // ── Toggle filter ─────────────────────────────────────────────
    window.toggleFilter = function (status) {
        var cb  = $('#filter-' + status.toLowerCase());
        var row = cb.closest('.filter-item');
        cb.prop('checked', !cb.prop('checked'));
        row.toggleClass('inactive', !cb.prop('checked'));
        calendar.refetchEvents();
    };

    // ── Reset modal ───────────────────────────────────────────────
    function resetModal() {
        $('#bookingForm')[0].reset();
        $('#formMethod').val('POST');
        $('#bookingForm').attr('action', '{{ route("bookings.store") }}');
        $('#b_price').val('');
        $('#bookingDeleteBtn').addClass('d-none');
        $('#bookingSubmitBtn').prop('disabled', false).text('{{ __("db.submit") }}');
        $('#bookingModalLabel').text('Add Booking');
        $('.selectpicker').selectpicker('refresh');
    }

    function openAddForm(dateStr) {
        resetModal();
        if (dateStr) {
            $('#b_start_date').val(dateStr);
            $('#b_end_date').val(dateStr);
        }
        $('#booking-modal').modal('show');
    }

    function openEditForm(event) {
        resetModal();
        $('#bookingModalLabel').text('Edit Booking');
        $('#formMethod').val('PUT');
        $('#bookingForm').attr('action', '{{ url("bookings") }}/' + event.id);
        $('#bookingSubmitBtn').text('{{ __("db.update") }}');
        $('#bookingDeleteBtn').removeClass('d-none');

        var p = event.extendedProps;
        $('#b_warehouse_id').val(p.warehouse_id);
        $('#b_customer_id').val(p.customer_id);
        $('#b_user_id').val(p.user_id || '');
        $('#b_status').val(p.status);
        $('#b_product_id').val(p.product_id || '');
        $('#b_price').val(p.price || '');
        $('#b_note').val(p.note || '');
        $('.selectpicker').selectpicker('refresh');

        $('#b_start_date').val(event.start ? event.start.toISOString().slice(0,10) : '');
        $('#b_end_date').val(event.end ? event.end.toISOString().slice(0,10) : '');
        $('#booking-modal').modal('show');
    }

    function openEditFromData(b) {
        resetModal();
        $('#bookingModalLabel').text('Edit Booking');
        $('#formMethod').val('PUT');
        $('#bookingForm').attr('action', '{{ url("bookings") }}/' + b.id);
        $('#bookingSubmitBtn').text('{{ __("db.update") }}');
        $('#bookingDeleteBtn').removeClass('d-none');

        $('#b_warehouse_id').val(b.warehouse_id);
        $('#b_customer_id').val(b.customer_id);
        $('#b_user_id').val(b.user_id || '');
        $('#b_status').val(b.status);
        $('#b_product_id').val(b.product_id || '');
        $('#b_price').val(b.price || '');
        $('#b_note').val(b.note || '');
        $('.selectpicker').selectpicker('refresh');

        $('#b_start_date').val(b.start_date ? b.start_date.slice(0,10) : '');
        $('#b_end_date').val(b.end_date ? b.end_date.slice(0,10) : '');
        $('#booking-modal').modal('show');
    }

    $('#addBookingBtn').on('click', function () { openAddForm(null); });

    // ── Submit + loading ──────────────────────────────────────────
    $('#bookingForm').on('submit', function (e) {
        if (!$('#b_warehouse_id').val()) { e.preventDefault(); alert('Please select Warehouse!'); return; }
        if (!$('#b_customer_id').val())  { e.preventDefault(); alert('Please select Customer!');  return; }
        if (!$('#b_start_date').val())   { e.preventDefault(); alert('Please select Start Date!'); return; }
        if (!$('#b_end_date').val())     { e.preventDefault(); alert('Please select End Date!');   return; }

        $('#bookingSubmitBtn')
            .prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm mr-1" role="status"></span> Saving...');
    });

    // ── Delete ────────────────────────────────────────────────────
    $('#bookingDeleteBtn').on('click', function () {
        var id = $('#bookingForm').attr('action').split('/').pop();
        if (!id || !confirm('Are you sure want to delete?')) return;
        $.ajax({
            type: 'POST',
            url:  '{{ url("bookings") }}/' + id,
            data: { _token: $('meta[name="csrf-token"]').attr('content'), _method: 'DELETE' },
            success: function (data) {
                if (data.success) { $('#booking-modal').modal('hide'); location.href = '{{ route("booking.index") }}?tab=list'; }
            }
        });
    });

    $('#booking-modal').on('hidden.bs.modal', function () { resetModal(); });

});
$('.start_date').datetimepicker({
    format: 'DD-MM-YYYY',
});
</script>
@endpush
