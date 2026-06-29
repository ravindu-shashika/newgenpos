@extends('backend.layout.main')
@section('content')

@push('css')
    @if (!config('database.connections.saleprosaas_landlord'))
        <link rel="preload" href="<?php echo asset('vendor/jquery-timepicker/jquery.timepicker.min.css'); ?>" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript>
            <link href="<?php echo asset('vendor/jquery-timepicker/jquery.timepicker.min.css'); ?>" rel="stylesheet">
        </noscript>
    @else
        <link rel="preload" href="<?php echo asset('../../vendor/jquery-timepicker/jquery.timepicker.min.css'); ?>" as="style"
            onload="this.onload=null;this.rel='stylesheet'">
        <noscript>
            <link href="<?php echo asset('../../vendor/jquery-timepicker/jquery.timepicker.min.css'); ?>" rel="stylesheet">
        </noscript>
    @endif
@endpush


<x-success-message key="message" />
<x-error-message key="not_permitted" />

<section class="forms">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header d-flex align-items-center">
                        <h4>{{__('db.HRM Setting')}}</h4>
                    </div>
                    <div class="card-body">
                        <p class="italic"><small>{{__('db.The field labels marked with * are required input fields')}}.</small></p>
                        <form action="{{ route('setting.hrmStore') }}" method="POST" enctype="multipart/form-data">
                            @csrf
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>{{__('db.Default CheckIn')}} *</label>
                                        <input type="text" name="checkin" id="checkin" class="form-control" value="@if($lims_hrm_setting_data){{$lims_hrm_setting_data->checkin}}@endif" required />
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>{{__('db.Default CheckOut')}}</label>
                                        <input type="text" name="checkout" id="checkout" class="form-control" value="@if($lims_hrm_setting_data){{$lims_hrm_setting_data->checkout}}@endif" required />
                                    </div>
                                </div>
                                <div class="col-md-6 form-group">
                                    <button type="submit" class="btn btn-primary">{{__('db.submit')}}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

@endsection

@push('scripts')
    @if (!config('database.connections.saleprosaas_landlord'))
        <script type="text/javascript" src="<?php echo asset('vendor/jquery/jquery.timepicker.min.js'); ?>"></script>
    @else
        <script type="text/javascript" src="<?php echo asset('../../vendor/jquery/jquery.timepicker.min.js'); ?>"></script>
    @endif
    <script type="text/javascript">
        $("ul#setting").siblings('a').attr('aria-expanded','true');
        $("ul#setting").addClass("show");
        $("ul#setting #hrm-setting-menu").addClass("active");

        $('#checkin, #checkout').timepicker({
            'step': 15,

        });
    </script>
@endpush
