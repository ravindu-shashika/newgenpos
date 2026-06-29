<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class BookingDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        return $this->userHasAny(['booking']);
    }

    protected function userHasAny(array $names): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id && $user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);
        foreach ($names as $permission) {
            try {
                if ($role && $role->hasPermissionTo($permission)) {
                    return true;
                }
            } catch (PermissionDoesNotExist $e) {
            }
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    protected function baseQuery()
    {
        $query = Booking::with(['warehouse', 'customer', 'employee', 'product'])
            ->whereNull('deleted_at');

        $user = Auth::user();
        if ($user && $user->role_id > 2 && config('staff_access') === 'own') {
            $query->where('created_by', $user->id);
        } elseif ($user && $user->role_id > 2 && config('staff_access') === 'warehouse') {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        return $query;
    }

    public function bootstrap(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $user = Auth::user();

        return $this->spaJson($request, [
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'customers' => Customer::where('is_active', true)->orderBy('name')->get(['id', 'name', 'phone_number', 'email']),
            'employees' => User::where('is_active', true)
                ->orderBy('username')
                ->get(['id', 'username as name', 'phone']),
            'service_products' => Product::where('is_active', true)
                ->where('type', 'service')
                ->orderBy('name')
                ->get(['id', 'name', 'price']),
            'status_options' => [
                ['value' => 'Booked', 'label' => 'Booked', 'color' => '#696cff'],
                ['value' => 'Waiting', 'label' => 'Waiting', 'color' => '#ffab00'],
                ['value' => 'Completed', 'label' => 'Completed', 'color' => '#28c76f'],
                ['value' => 'Cancelled', 'label' => 'Cancelled', 'color' => '#ea5455'],
            ],
            'show_warehouse_filter' => $user && $user->role_id <= 2,
            'lock_warehouse_id' => $user && $user->role_id > 2 && $user->warehouse_id ? $user->warehouse_id : null,
        ]);
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $query = $this->baseQuery();

        if ($request->filled('warehouse_id') && (int) $request->warehouse_id !== 0) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status') && $request->status !== '0' && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $startingDate = $request->input('starting_date', date('Y-m-d', strtotime('-1 year')));
        $endingDate = $request->input('ending_date', date('Y-m-d'));

        $query->whereDate('start_date', '>=', $startingDate)
            ->whereDate('start_date', '<=', $endingDate);

        $bookings = $query->orderByDesc('start_date')->get();

        return $this->spaJson($request, [
            'data' => $bookings->map(fn ($b) => $this->formatRow($b)),
            'filters' => [
                'warehouse_id' => (int) $request->input('warehouse_id', 0),
                'status' => $request->input('status', '0'),
                'starting_date' => $startingDate,
                'ending_date' => $endingDate,
            ],
        ]);
    }

    public function events(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return app(BookingController::class)->getEvents($request);
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $booking = Booking::with(['warehouse', 'customer', 'employee', 'product'])->findOrFail($id);

        return $this->spaJson($request, $this->formatDetail($booking));
    }

    public function store(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $request->headers->set('X-Requested-With', 'XMLHttpRequest');

        return app(BookingController::class)->store($request);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $request->headers->set('X-Requested-With', 'XMLHttpRequest');

        return app(BookingController::class)->update($request, $id);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return app(BookingController::class)->destroy($id);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $ids = $request->input('bookingIdArray', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No bookings selected.'], 422);
        }

        Booking::whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => 'Deleted successfully']);
    }

    protected function formatRow(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'created_at' => $booking->created_at?->format('d-m-Y') ?? '—',
            'warehouse_id' => $booking->warehouse_id,
            'warehouse_name' => $booking->warehouse->name ?? '—',
            'customer_id' => $booking->customer_id,
            'customer_name' => $booking->customer->name ?? '—',
            'customer_phone' => $booking->customer->phone_number ?? '',
            'user_id' => $booking->user_id,
            'employee_name' => $booking->employee->username ?? $booking->employee->name ?? '—',
            'product_id' => $booking->product_id,
            'product_name' => $booking->product->name ?? '—',
            'price' => (float) ($booking->price ?? 0),
            'start_date' => $booking->start_date?->format('Y-m-d H:i:s'),
            'end_date' => $booking->end_date?->format('Y-m-d H:i:s'),
            'start_display' => $booking->start_date?->format('d-m-Y H:i') ?? '—',
            'end_display' => $booking->end_date?->format('d-m-Y H:i') ?? '—',
            'status' => $booking->status,
            'note' => $booking->note ?? '',
            'calendar_color' => $booking->calendar_color,
        ];
    }

    protected function formatDetail(Booking $booking): array
    {
        return array_merge($this->formatRow($booking), [
            'start_date_input' => $booking->start_date?->format('Y-m-d\TH:i'),
            'end_date_input' => $booking->end_date?->format('Y-m-d\TH:i'),
        ]);
    }
}
