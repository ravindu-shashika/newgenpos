        <ul id="side-main-menu" class="side-menu list-unstyled d-print-none">
            <li><a href="{{url('/dashboard')}}"> <i class="dripicons-meter"></i><span>{{__('db.dashboard')}}</span></a></li>

            @can('sidebar_product')
                @can('categories-index')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('brand')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('unit')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('products-index')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('products-add')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('print_barcode')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('adjustment')
                    @php $showProductMenu = true; @endphp
                @endcan
                @can('stock_count')
                    @php $showProductMenu = true; @endphp
                @endcan
                @isset($showProductMenu)
                    <li>
                        <a href="#product" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-list"></i><span>{{__('db.product')}}</span><span></a>

                        <ul id="product" class="collapse list-unstyled ">
                            @can('categories-index')
                                <li id="category-menu"><a href="{{route('category.index')}}">{{__('db.category')}}</a></li>
                            @endcan
                            @can('brand')
                                <li id="brand-menu"><a href="{{route('brand.index')}}">{{__('db.Brand')}}</a></li>
                            @endcan
                            @can('unit')
                                <li id="unit-menu"><a href="{{route('unit.index')}}">{{__('db.Unit')}}</a></li>
                            @endcan
                            @can('products-index')
                                <li id="product-list-menu"><a href="{{route('products.index')}}">{{__('db.product_list')}}</a></li>
                            @endcan
                            @can('products-add')
                                <li id="product-create-menu"><a href="{{route('products.create')}}">{{__('db.add_product')}}</a></li>
                            @endcan
                            @can('print_barcode')
                                <li id="printBarcode-menu"><a href="{{route('product.printBarcode')}}">{{__('db.print_barcode')}}</a></li>
                            @endcan
                            @can('adjustment')
                                <li id="adjustment-list-menu"><a href="{{route('qty_adjustment.index')}}">{{__('db.Adjustment List')}}</a></li>
                                <li id="adjustment-create-menu"><a href="{{route('qty_adjustment.create')}}">{{__('db.Add Adjustment')}}</a></li>
                            @endcan
                            @can('stock_count')
                                <li id="stock-count-menu"><a href="{{route('stock-count.index')}}">{{__('db.Stock Count')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_purchase')
                @can('purchases-index')
                    @php $showPurchaseMenu = true; @endphp
                @endcan
                @can('purchases-add')
                    @php $showPurchaseMenu = true; @endphp
                @endcan
                @can('purchases-import')
                    @php $showPurchaseMenu = true; @endphp
                @endcan
                @can('purchase-return-index')
                    @php $showPurchaseMenu = true; @endphp
                @endcan
                @if($showPurchaseMenu)
                    <li>
                        <a href="#purchase" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-card"></i><span>{{__('db.Purchase')}}</span></a>

                        <ul id="purchase" class="collapse list-unstyled ">
                            @can('purchases-index')
                                <li id="purchase-list-menu"><a href="{{route('purchases.index')}}">{{__('db.Purchase List')}}</a></li>
                            @endcan
                            @can('purchases-add')
                                <li id="purchase-create-menu"><a href="{{route('purchases.create')}}">{{__('db.Add Purchase')}}</a></li>
                            @endcan
                            @can('purchases-import')
                                <li id="purchase-import-menu"><a href="{{url('purchases/purchase_by_csv')}}">{{__('db.Import Purchase By CSV')}}</a></li>
                            @endcan
                            @can('purchase-return-index')
                                <li id="purchase-return-menu"><a href="{{route('return-purchase.index')}}">{{__('db.Purchase Return')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endif
            @endcan

            @can('sidebar_sale')
                @can('sales-index')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('sales-add')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('sales-import')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('packing_slip_challan')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('delivery')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('gift_card')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('coupon')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @can('returns-index')
                    @php $showSaleMenu = true; @endphp
                @endcan
                @isset($showSaleMenu)
                    <li>
                        <a href="#sale" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-cart"></i><span>{{__('db.Sale')}}</span></a>

                        <ul id="sale" class="collapse list-unstyled ">
                            @can('sales-index')
                                <li id="sale-list-menu"><a href="{{route('sales.index')}}">{{__('db.Sale List')}}</a></li>
                            @endcan
                            @can('sales-add')
                                <li><a href="{{route('sale.pos')}}">POS</a></li>
                                <li id="sale-create-menu"><a href="{{route('sales.create')}}">{{__('db.Add Sale')}}</a></li>
                            @endcan
                            @can('sales-import')
                                <li id="sale-import-menu"><a href="{{url('sales/sale_by_csv')}}">{{__('db.Import Sale By CSV')}}</a></li>
                            @endcan
                            @can('packing_slip_challan')
                                <li id="packing-list-menu"><a href="{{route('packingSlip.index')}}">{{__('db.Packing Slip List')}}</a></li>
                                <li id="challan-list-menu"><a href="{{route('challan.index')}}">{{__('db.Challan List')}}</a></li>
                            @endcan
                            @can('delivery')
                                <li id="delivery-menu"><a href="{{route('delivery.index')}}">{{__('db.Delivery List')}}</a></li>
                            @endcan
                            @can('gift_card')
                                <li id="gift-card-menu"><a href="{{route('gift_cards.index')}}">{{__('db.Gift Card List')}}</a> </li>
                            @endcan
                            @can('coupon')
                                <li id="coupon-menu"><a href="{{route('coupons.index')}}">{{__('db.Coupon List')}}</a> </li>
                            @endcan
                                <li id="courier-menu"><a href="{{route('couriers.index')}}">{{__('db.Courier List')}}</a> </li>
                            @can('returns-index')
                                <li id="sale-return-menu"><a href="{{route('return-sale.index')}}">{{__('db.Sale Return')}}</a></li>
                            @endcan
                            @can('exchange-index')
                                <li id="exchange-menu"><a href="{{route('exchange.index')}}">{{__('db.Sale Exchange')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_quotation')
                @can('quotes-index')
                    @php $showQuotationMenu = true; @endphp
                @endcan
                @can('quotes-add')
                    @php $showQuotationMenu = true; @endphp
                @endcan
                @isset($showQuotationMenu)
                    <li>
                        <a href="#quotation" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-document"></i><span>{{__('db.Quotation')}}</span><span></a>

                        <ul id="quotation" class="collapse list-unstyled ">
                            @can('quotes-index')
                                <li id="quotation-list-menu"><a href="{{route('quotations.index')}}">{{__('db.Quotation List')}}</a></li>
                            @endcan
                            @can('quotes-add')
                                <li id="quotation-create-menu"><a href="{{route('quotations.create')}}">{{__('db.Add Quotation')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_transfer')
                @can('transfers-index')
                    @php $showTransferMenu = true; @endphp
                @endcan
                @can('transfers-add')
                    @php $showTransferMenu = true; @endphp
                @endcan
                @can('transfers-import')
                    @php $showTransferMenu = true; @endphp
                @endcan
                @isset($showTransferMenu)
                    <li>
                        <a href="#transfer" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-export"></i><span>{{__('db.Transfer')}}</span></a>
                        <ul id="transfer" class="collapse list-unstyled ">
                            @can('transfers-index')
                                <li id="transfer-list-menu"><a href="{{route('transfers.index')}}">{{__('db.Transfer List')}}</a></li>
                            @endcan
                            @can('transfers-add')
                                <li id="transfer-create-menu"><a href="{{route('transfers.create')}}">{{__('db.Add Transfer')}}</a></li>
                            @endcan
                            @can('transfers-import')
                                <li id="transfer-import-menu"><a href="{{url('transfers/transfer_by_csv')}}">{{__('db.Import Transfer By CSV')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_expense')
                @can('expense-categories')
                    @php $showExpenseMenu = true; @endphp
                @endcan
                @can('expenses-index')
                    @php $showExpenseMenu = true; @endphp
                @endcan
                @can('expenses-add')
                    @php $showExpenseMenu = true; @endphp
                @endcan
                @isset($showExpenseMenu)
                    <li>
                        <a href="#expense" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-wallet"></i><span>{{__('db.Expense')}}</span></a>

                        <ul id="expense" class="collapse list-unstyled ">
                            @can('expense-categories')
                                <li id="exp-cat-menu"><a href="{{route('expense_categories.index')}}">{{__('db.Expense Category')}}</a></li>
                            @endcan
                            @can('expenses-index')
                                <li id="exp-list-menu"><a href="{{route('expenses.index')}}">{{__('db.Expense List')}}</a></li>
                            @endcan
                            @can('expenses-add')
                                <li><a id="add-expense" href=""> {{__('db.Add Expense')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_income')
                @can('income-categories')
                    @php $showIncomeMenu = true; @endphp
                @endcan
                @can('incomes-index')
                    @php $showIncomeMenu = true; @endphp
                @endcan
                @can('incomes-add')
                    @php $showIncomeMenu = true; @endphp
                @endcan
                @isset($showIncomeMenu)
                    <li>
                        <a href="#income" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-rocket"></i><span>{{__('db.Income')}}</span></a>
                        <ul id="income" class="collapse list-unstyled ">
                            @can('income-categories')
                                <li id="income-cat-menu"><a href="{{route('income_categories.index')}}">{{__('db.Income Category')}}</a></li>
                            @endcan
                            @can('incomes-index')
                                <li id="income-list-menu"><a href="{{route('incomes.index')}}">{{__('db.Income List')}}</a></li>
                            @endcan
                            @can('incomes-add')
                                <li><a id="add-income" href=""> {{__('db.Add Income')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_people')
                @can('customers-index')
                    @php $showPeopleMenu = true; @endphp
                @endcan
                @can('suppliers-index')
                    @php $showPeopleMenu = true; @endphp
                @endcan
                @can('users-index')
                    @php $showPeopleMenu = true; @endphp
                @endcan
                @can('sale-agents')
                    @php $showPeopleMenu = true; @endphp
                @endcan
                @can('billers-index')
                    @php $showPeopleMenu = true; @endphp
                @endcan
                @isset($showPeopleMenu)
                    <li>
                        <a href="#people" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-user"></i><span>{{__('db.People')}}</span></a>

                        <ul id="people" class="collapse list-unstyled ">
                            @can('customers-index')
                                <li id="customer-list-menu"><a href="{{route('customer.index')}}">{{__('db.Customer List')}}</a></li>
                            @endcan
                            @can('suppliers-index')
                                <li id="supplier-list-menu"><a href="{{route('supplier.index')}}">{{__('db.Supplier List')}}</a></li>
                            @endcan
                            @can('users-index')
                                <li id="user-list-menu"><a href="{{route('user.index')}}">{{__('db.User List')}}</a></li>
                            @endcan
                            @can('sale-agents')
                            <li id="sale-agent-menu"><a href="{{route('sale-agents.index')}}">{{__('db.Sale Agents')}}</a></li>
                            @endcan
                            @can('billers-index')
                                <li id="biller-list-menu"><a href="{{route('biller.index')}}">{{__('db.Biller List')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_accounting')
                @can('account-index')
                    @php $showAccountingMenu = true; @endphp
                @endcan
                @can('money-transfer')
                    @php $showAccountingMenu = true; @endphp
                @endcan
                @can('balance-sheet')
                    @php $showAccountingMenu = true; @endphp
                @endcan
                @can('account-statement')
                    @php $showAccountingMenu = true; @endphp
                @endcan
                @isset($showAccountingMenu)
                    <li class="">
                        <a href="#account" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-briefcase"></i><span>{{__('db.Accounting')}}</span></a>

                        <ul id="account" class="collapse list-unstyled ">
                            @can('account-index')
                                <li id="account-list-menu"><a href="{{route('accounts.index')}}">{{__('db.Account List')}}</a></li>
                                <li><a id="add-account" href="">{{__('db.Add Account')}}</a></li>
                            @endcan
                            @can('money-transfer')
                                <li id="money-transfer-menu"><a href="{{route('money-transfers.index')}}">{{__('db.Money Transfer')}}</a></li>
                            @endcan
                            @can('balance-sheet')
                                <li id="balance-sheet-menu"><a href="{{route('accounts.balancesheet')}}">{{__('db.Balance Sheet')}}</a></li>
                            @endcan
                            @can('account-statement')
                                <li id="account-statement-menu"><a id="account-statement" href="">{{__('db.Account Statement')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            @endcan

            @can('sidebar_hrm')
                @can('department')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('designations')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('shift')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('employees-index')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('attendance')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('holiday')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('overtime')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('leave-type')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('leave')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @can('payroll')
                    @php $showHrmMenu = true; @endphp
                @endcan
                @if($showHrmMenu)
                    <li class="">
                        <a href="#hrm" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-user-group"></i><span>{{__('db.HRM')}}</span></a>

                        <ul id="hrm" class="collapse list-unstyled ">
                            @can('department')
                                <li id="dept-menu"><a href="{{route('departments.index')}}">{{__('db.Department')}}</a></li>
                            @endcan
                            @can('designations')
                                <li id="designations-menu"><a href="{{route('designations.index')}}">{{__('db.Designation')}}</a>
                            @endcan
                            @can('shift')
                                <li id="shift-menu"><a href="{{route('shift.index')}}">{{__('db.Shift')}}</a></li>
                            @endcan
                            @can('employees-index')
                                <li id="employee-menu"><a href="{{route('employees.index')}}">{{__('db.Employee')}}</a></li>
                            @endcan
                            @can('attendance')
                                <li id="attendance-menu"><a href="{{route('attendance.index')}}">{{__('db.Attendance')}}</a></li>
                            @endcan
                            @can('holiday')
                                <li id="holiday-menu"><a href="{{route('holidays.index')}}">{{__('db.Holiday')}}</a></li>
                            @endcan
                            @can('overtime')
                                <li id="overtime-menu"><a href="{{route('overtime.index')}}">{{__('db.Overtime')}}</a></li>
                            @endcan
                            @can('leave-type')
                                <li id="overtime-menu"><a href="{{route('leave-type.index')}}">{{__('db.Leave Type')}}</a></li>
                            @endcan
                            @can('leave')
                                <li id="overtime-menu"><a href="{{route('leave.index')}}">{{__('db.Leaves')}}</a></li>
                            @endcan
                            @can('payroll')
                                <li id="payroll-menu"><a href="{{route('payroll.index')}}">{{__('db.Payroll')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endif
            @endcan

            @if(in_array('manufacturing', explode(',', $general_setting->modules)))

                @can('sidebar_manufacturing')

                    @can('production-view')
                        @php $showManufacturingMenu = true; @endphp
                    @endcan

                    @can('production-add')
                        @php $showManufacturingMenu = true; @endphp
                    @endcan

                    @can('recipe-view')
                        @php $showManufacturingMenu = true; @endphp
                    @endcan

                    @isset($showManufacturingMenu)
                        <li>
                            <a href="#manufacturing" aria-expanded="false" data-toggle="collapse">
                                <i class="fa fa-industry"></i>
                                <span>{{ __('db.Manufacturing') }}</span>
                            </a>

                            <ul id="manufacturing" class="collapse list-unstyled">

                                @can('production-view')
                                    <li id="production-list-menu">
                                        <a href="{{ route('productions.index') }}">
                                            {{ __('db.Production List') }}
                                        </a>
                                    </li>
                                @endcan

                                @can('production-add')
                                    <li id="production-create-menu">
                                        <a href="{{ route('productions.create') }}">
                                            {{ __('db.Add Production') }}
                                        </a>
                                    </li>
                                @endcan

                                @can('recipe-view')
                                    <li id="recipe-list-menu">
                                        <a href="{{ route('recipes.index') }}">
                                            {{ __('db.Recipe') }}
                                        </a>
                                    </li>
                                @endcan

                            </ul>
                        </li>
                    @endisset

                @endcan
            @endif

            @can('sidebar_whatsapp')

                @can('whatsapp-view')
                    @php $showWhatsappMenu = true; @endphp
                @endcan

                @can('whatsapp-add')
                    @php $showWhatsappMenu = true; @endphp
                @endcan

                @can('whatsapp-edit')
                    @php $showWhatsappMenu = true; @endphp
                @endcan

                @isset($showWhatsappMenu)
                    <li class="">
                        <a href="#whatsapp" aria-expanded="false" data-toggle="collapse">
                            <i class="dripicons-message"></i>
                            <span>{{ __('db.whatsapp') }}</span>
                        </a>

                        <ul id="whatsapp" class="collapse list-unstyled">

                            @can('whatsapp-edit')
                                <li id="whatsapp-settings-menu">
                                    <a href="{{ route('whatsapp.settings') }}">
                                        {{ __('db.whatsapp_settings') }}
                                    </a>
                                </li>
                            @endcan

                            @can('whatsapp-view')
                                <li id="whatsapp-templates-menu">
                                    <a href="{{ route('whatsapp.templates') }}">
                                        {{ __('db.message_templates') }}
                                    </a>
                                </li>
                            @endcan

                            @can('whatsapp-add')
                                <li id="whatsapp-send-menu">
                                    <a href="{{ route('whatsapp.send.page') }}">
                                        {{ __('db.send_message') }}
                                    </a>
                                </li>
                            @endcan

                        </ul>
                    </li>
                @endisset
            @endcan
            @php
                $showReportMenu = false;
            @endphp
            @can('sidebar_reports')
                @can('profit-loss')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('best-seller')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('product-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('daily-sale')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('monthly-sale')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('daily-purchase')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('monthly-purchase')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('sale-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('sale-report-chart')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('payment-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('purchase-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('customer-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('due-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('supplier-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('supplier-due-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('warehouse-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('warehouse-stock-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('product-expiry-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('product-qty-alert')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('dso-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('user-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @can('biller-report')
                    @php $showReportMenu = true; @endphp
                @endcan
                @if($showReportMenu)
                    <li>
                        <a href="#report" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-document-remove"></i><span>{{__('db.Reports')}}</span></a>

                        <ul id="report" class="collapse list-unstyled ">
                            @if($role->id <= 2)
                                <li id="activity-log-menu"><a href="{{route('setting.activityLog')}}">{{__('db.Activity Log')}}</a></li>
                            @endif
                            @can('profit-loss')
                                <li id="profit-loss-report-menu">
                                    {!! Form::open(['route' => 'report.profitLoss', 'method' => 'post', 'id' => 'profitLoss-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <a id="profitLoss-link" href="">{{__('db.Summary Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('best-seller')
                                <li id="best-seller-report-menu">
                                    <a href="{{url('report/best_seller')}}">{{__('db.Best Seller')}}</a>
                                </li>
                            @endcan
                            @can('product-report')
                                <li id="product-report-menu">
                                    {!! Form::open(['route' => 'report.product', 'method' => 'get', 'id' => 'product-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <input type="hidden" name="warehouse_id" value="0" />
                                        <a id="report-link" href="">{{__('db.Product Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('daily-sale')
                                <li id="daily-sale-report-menu">
                                    <a href="{{url('report/daily_sale/'.date('Y').'/'.date('m'))}}">{{__('db.Daily Sale')}}</a>
                                </li>
                            @endcan
                            @can('monthly-sale')
                                <li id="monthly-sale-report-menu">
                                    <a href="{{url('report/monthly_sale/'.date('Y'))}}">{{__('db.Monthly Sale')}}</a>
                                </li>
                            @endcan
                            @can('daily-purchase')
                                <li id="daily-purchase-report-menu">
                                    <a href="{{url('report/daily_purchase/'.date('Y').'/'.date('m'))}}">{{__('db.Daily Purchase')}}</a>
                                </li>
                            @endcan
                            @can('monthly-purchase')
                                <li id="monthly-purchase-report-menu">
                                    <a href="{{url('report/monthly_purchase/'.date('Y'))}}">{{__('db.Monthly Purchase')}}</a>
                                </li>
                            @endcan
                            @can('sale-report')
                                <li id="sale-report-menu">
                                    {!! Form::open(['route' => 'report.sale', 'method' => 'post', 'id' => 'sale-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <input type="hidden" name="warehouse_id" value="0" />
                                        <a id="sale-report-link" href="">{{__('db.Sale Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            <li id="challan-report-menu">
                                <a href="{{route('report.challan')}}"> {{__('db.Challan Report')}}</a>
                            </li>
                            @can('sale-report-chart')
                                <li id="sale-report-chart-menu">
                                    {!! Form::open(['route' => 'report.saleChart', 'method' => 'post', 'id' => 'sale-report-chart-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <input type="hidden" name="warehouse_id" value="0" />
                                        <input type="hidden" name="time_period" value="weekly" />
                                        <a id="sale-report-chart-link" href="">{{__('db.Sale Report Chart')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('payment-report')
                                <li id="payment-report-menu">
                                    {!! Form::open(['route' => 'report.paymentByDate', 'method' => 'post', 'id' => 'payment-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <a id="payment-report-link" href="">{{__('db.Payment Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('purchase-report')
                                <li id="purchase-report-menu">
                                    {!! Form::open(['route' => 'report.purchase', 'method' => 'post', 'id' => 'purchase-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m').'-'.'01'}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <input type="hidden" name="warehouse_id" value="0" />
                                        <a id="purchase-report-link" href="">{{__('db.Purchase Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('customer-report')
                                <li id="customer-report-menu">
                                    <a id="customer-report-link" href="">{{__('db.Customer Report')}}</a>
                                </li>
                            @endcan
                            @can('customer-report')
                                <li id="customer-report-menu">
                                    <a id="customer-group-report-link" href="">{{__('db.Customer Group Report')}}</a>
                                </li>
                            @endcan
                            @can('due-report')
                                <li id="due-report-menu">
                                    {!! Form::open(['route' => 'report.customerDueByDate', 'method' => 'post', 'id' => 'customer-due-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m-d', strtotime('-1 year'))}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <a id="due-report-link" href="">{{__('db.Customer Due Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('supplier-report')
                                <li id="supplier-report-menu">
                                    <a id="supplier-report-link" href="">{{__('db.Supplier Report')}}</a>
                                </li>
                            @endcan
                            @can('supplier-due-report')
                                <li id="supplier-due-report-menu">
                                    {!! Form::open(['route' => 'report.supplierDueByDate', 'method' => 'post', 'id' => 'supplier-due-report-form']) !!}
                                        <input type="hidden" name="start_date" value="{{date('Y-m-d', strtotime('-1 year'))}}" />
                                        <input type="hidden" name="end_date" value="{{date('Y-m-d')}}" />
                                        <a id="supplier-due-report-link" href="">{{__('db.Supplier Due Report')}}</a>
                                    {!! Form::close() !!}
                                </li>
                            @endcan
                            @can('warehouse-report')
                                <li id="warehouse-report-menu">
                                    <a id="warehouse-report-link" href="">{{__('db.Warehouse Report')}}</a>
                                </li>
                            @endcan
                            @can('warehouse-stock-report')
                                <li id="warehouse-stock-report-menu">
                                    <a href="{{route('report.warehouseStock')}}">{{__('db.Warehouse Stock Chart')}}</a>
                                </li>
                            @endcan
                            @can('product-expiry-report')
                                <li id="productExpiry-report-menu">
                                    <a href="{{route('report.productExpiry')}}">{{__('db.Product Expiry Report')}}</a>
                                </li>
                            @endcan
                            @can('product-qty-alert')
                                <li id="qtyAlert-report-menu">
                                    <a href="{{route('report.qtyAlert')}}">{{__('db.Product Quantity Alert')}}</a>
                                </li>
                            @endcan
                            @can('dso-report')
                            <li id="daily-sale-objective-menu">
                                <a href="{{route('report.dailySaleObjective')}}">{{__('db.Daily Sale Objective Report')}}</a>
                            </li>
                            @endcan
                            @can('user-report')
                            <li id="user-report-menu">
                            <a id="user-report-link" href="">{{__('db.User Report')}}</a>
                            </li>
                            @endcan
                            @can('biller-report')
                            <li id="biller-report-menu">
                                <a id="biller-report-link" href="">{{__('db.Biller Report')}}</a>
                            </li>
                            @endcan
                            <li id="cash-register-report-menu">
                                <a href="{{route('cashRegister.index')}}">{{__('db.Cash Register')}}</a>
                            </li>
                        </ul>
                    </li>
                @endif
            @endcan

            {{--@can('sidebar_settings')--}}
                @if(\Auth::user()->role_id <= 2)
                    @php $showSettingsMenu = true; @endphp
                @endif
                @can('invoice_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('role_permission')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('custom_field')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('discount_plan')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('discount')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('all_notification')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('send_notification')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('warehouse')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @if(\Auth::user()->role_id <= 2)
                    @php $showSettingsMenu = true; @endphp
                @endif
                @can('customer_group')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('currency')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('tax')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('create_sms')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('backup_database')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('general_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('mail_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('reward_point_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('sms_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('payment_gateway_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('pos_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('hrm_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('barcode_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @can('language_setting')
                    @php $showSettingsMenu = true; @endphp
                @endcan
                @isset($showSettingsMenu)
                    <li>
                        <a href="#setting" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-gear"></i><span>{{__('db.settings')}}</span></a>

                        <ul id="setting" class="collapse list-unstyled ">
                            @if(\Auth::user()->role_id <= 2)
                                <li id="printer-menu"><a href="{{route('printers.index')}}">{{__('db.Receipt Printers')}}</a></li>
                            @endif
                            @can ('invoice_setting')
                                <li id="invoice-menu"><a href="{{route('settings.invoice.index')}}">{{__('db.Invoice Settings')}}</a></li>
                            @endcan
                            @can('role_permission')
                                <li id="role-menu"><a href="{{route('role.index')}}">{{__('db.Role Permission')}}</a></li>
                                <li><a href="{{route('smstemplates.index')}}">{{__('db.SMS Template')}}</a></li>
                            @endcan
                            @can('custom_field')
                                <li id="custom-field-list-menu"><a href="{{route('custom-fields.index')}}">{{__('db.Custom Field List')}}</a></li>
                            @endcan
                            @can('discount_plan')
                                <li id="discount-plan-list-menu"><a href="{{route('discount-plans.index')}}">{{__('db.Discount Plan')}}</a></li>
                            @endcan
                            @can('discount')
                                <li id="discount-list-menu"><a href="{{route('discounts.index')}}">{{__('db.Discount')}}</a></li>
                            @endcan
                            @can('all_notification')
                                <li id="notification-list-menu">
                                    <a href="{{route('notifications.index')}}">{{__('db.All Notification')}}</a>
                                </li>
                            @endcan
                            @can('send_notification')
                                <li id="notification-menu">
                                    <a href="" id="send-notification">{{__('db.Send Notification')}}</a>
                                </li>
                            @endcan
                            @can('warehouse')
                                <li id="warehouse-menu"><a href="{{route('warehouse.index')}}">{{__('db.Warehouse')}}</a></li>
                            @endcan
                            @if(\Auth::user()->role_id <= 2)
                                <li id="table-menu"><a href="{{route('tables.index')}}">{{__('db.Tables')}}</a></li>
                            @endif
                            @can('customer_group')
                                <li id="customer-group-menu"><a href="{{route('customer_group.index')}}">{{__('db.Customer Group')}}</a></li>
                            @endcan
                            @can('currency')
                                <li id="currency-menu"><a href="{{route('currency.index')}}">{{__('db.Currency')}}</a></li>
                            @endcan
                            @can('tax')
                                <li id="tax-menu"><a href="{{route('tax.index')}}">{{__('db.Tax')}}</a></li>
                            @endcan
                                <li id="user-menu"><a href="{{route('user.profile', ['id' => Auth::id()])}}">{{__('db.User Profile')}}</a></li>
                            @can('create_sms')
                                <li id="create-sms-menu"><a href="{{route('setting.createSms')}}">{{__('db.Create SMS')}}</a></li>
                            @endcan
                            @can('backup_database')
                                <li><a href="{{route('setting.backup')}}">{{__('db.Backup Database')}}</a></li>
                            @endcan
                            @can('general_setting')
                                <li id="theme-settings-menu"><a href="{{ route('setting.themeSettings.index') }}">{{__('db.Theme Settings')}}</a></li>
                                <li id="general-setting-menu"><a href="{{route('setting.general')}}">{{__('db.General Setting')}}</a></li>
                            @endcan
                            @can('mail_setting')
                                <li id="mail-setting-menu"><a href="{{route('setting.mail')}}">{{__('db.Mail Setting')}}</a></li>
                            @endcan
                            @can('reward_point_setting')
                                <li id="reward-point-setting-menu"><a href="{{route('setting.rewardPoint')}}">{{__('db.Reward Point Setting')}}</a></li>
                            @endcan
                            @can('sms_setting')
                                <li id="sms-setting-menu"><a href="{{route('setting.sms')}}">{{__('db.SMS Setting')}}</a></li>
                            @endcan

                            @can('payment_gateway_setting')
                                <li id="payment-gateway-setting-menu"><a href="{{route('setting.gateway')}}">{{__('db.Payment Gateways')}}</a></li>
                            @endcan

                            @can('pos_setting')
                                <li id="pos-setting-menu"><a href="{{route('setting.pos')}}">POS {{__('db.settings')}}</a></li>
                            @endcan
                            @can('hrm_setting')
                                <li id="hrm-setting-menu"><a href="{{route('setting.hrm')}}"> {{__('db.HRM Setting')}}</a></li>
                            @endcan
                            @can('barcode_setting')
                                <li id="barcode-setting-menu"><a href="{{route('barcodes.index')}}"> {{__('db.Barcode Settings')}}</a></li>
                            @endcan

                            @can('language_setting')
                                <li id="languages"><a href="{{route('languages')}}"> {{__('db.Languages')}}</a></li>
                            @endcan
                        </ul>
                    </li>
                @endisset
            {{--@endcan--}}

            @if(config('database.connections.saleprosaas_landlord'))
                @php
                    tenancy()->central(function () use (&$disable_tenant_support_tickets) {
                        $disable_tenant_support_tickets = DB::table('general_settings')->latest()
                                                        ->first()->disable_tenant_support_tickets;
                    });
                @endphp
                @if(!$disable_tenant_support_tickets)
                    <li><a href="{{route('tickets.index')}}"><i class="dripicons-ticket"></i> {{__('db.support_tickets')}}</a></li>
                @endif
            @endif

            @if (in_array('api',explode(',',$general_setting->modules)))
                <li><a href="{{route('setting.app')}}"> <i class="fa fa-mobile"></i><span>{{__('db.App Setting')}}</span></a></li>
            @endif
            @can ('addons')
                @if(\Auth::user()->role_id != 5)
                    @if(!config('database.connections.saleprosaas_landlord'))
                        <li><a href="{{url('addon-list')}}" id="addon-list"> <i class="dripicons-flag"></i><span>{{__('db.Addons')}}</span></a></li>
                    @endif
                    @if (in_array('woocommerce',explode(',',$general_setting->modules)))
                        <li><a href="{{route('woocommerce.index')}}"> <i class="fa fa-wordpress"></i><span>WooCommerce</span></a></li>
                    @endif
                    @if(in_array('ecommerce',explode(',',$general_setting->modules)))
                        <li>
                            <a href="#ecommerce" aria-expanded="false" data-toggle="collapse"> <i class="dripicons-shopping-bag"></i><span>eCommerce</span></a>
                            <ul id="ecommerce" class="collapse list-unstyled ">
                                @include('ecommerce::backend.layout.sidebar-menu')
                            </ul>
                        </li>
                    @endif
                    @if(in_array('project',explode(',',$general_setting->modules)))
                        @include('project::backend.layout.sidebar-menu')
                    @endif
                    @if(in_array('restaurant',explode(',',$general_setting->modules)))
                        @include('restaurant::backend.layout.sidebar-menu')
                    @endif
                @endif
            @endcan
        </ul>
