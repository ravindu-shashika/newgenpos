<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Support\Permissions;
use App\Traits\SpaResponse;
use Auth;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use SpaResponse;

    protected function userCanView(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('all_notification');
    }

    protected function userCanSend(): bool
    {
        if (Permissions::bypassed()) {
            return true;
        }

        $user = Auth::user();
        if (!$user) {
            return false;
        }

        if ($user->role_id <= 2) {
            return true;
        }

        $role = Role::find($user->role_id);

        return $role && $role->hasPermissionTo('send_notification');
    }

    protected function formatNotificationRow(object $notification, array $userNames): array
    {
        $data = json_decode($notification->data, true) ?? [];
        $senderId = $data['sender_id'] ?? null;
        $receiverId = $data['receiver_id'] ?? null;
        $documentName = $data['document_name'] ?? null;

        return [
            'id' => $notification->id,
            'created_at' => $notification->created_at,
            'date_label' => $notification->created_at
                ? Carbon::parse($notification->created_at)->format('d-m-Y')
                : null,
            'from_user_id' => $senderId,
            'from_user_name' => $userNames[$senderId] ?? 'N/A',
            'to_user_id' => $receiverId,
            'to_user_name' => $userNames[$receiverId] ?? 'N/A',
            'document_name' => $documentName,
            'document_url' => $documentName
                ? url('documents/notification/' . $documentName)
                : null,
            'message' => $data['message'] ?? '',
            'reminder_date' => $data['reminder_date'] ?? null,
            'reminder_date_label' => !empty($data['reminder_date'])
                ? Carbon::parse($data['reminder_date'])->format('d-m-Y')
                : null,
            'is_read' => !empty($notification->read_at),
            'read_at' => $notification->read_at,
        ];
    }

    public function index(Request $request)
    {
        if (!$this->userCanView()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $lims_notification_all = DB::table('notifications')
            ->orderByDesc('created_at')
            ->get();

        if ($this->wantsSpaResponse($request)) {
            $userIds = $lims_notification_all
                ->flatMap(function ($notification) {
                    $data = json_decode($notification->data, true) ?? [];

                    return array_filter([
                        $data['sender_id'] ?? null,
                        $data['receiver_id'] ?? null,
                    ]);
                })
                ->unique()
                ->values()
                ->all();

            $userNames = User::whereIn('id', $userIds)->pluck('username', 'id')->all();

            return $this->spaJson($request, [
                'data' => $lims_notification_all->map(
                    fn ($notification) => $this->formatNotificationRow($notification, $userNames)
                )->values(),
            ]);
        }

        return view('backend.notification.index', compact('lims_notification_all'));
    }

    public function store(Request $request)
    {
        // Legacy send flow — kept for modal / send-notification page.
        if (!$this->userCanSend()) {
            if ($this->wantsSpaResponse($request)) {
                return $this->spaJson($request, [
                    'message' => __('db.Sorry! You are not allowed to access this module'),
                ], 403);
            }

            return redirect()->back()->with('not_permitted', __('db.Sorry! You are not allowed to access this module'));
        }

        $document = $request->document;
        if ($document) {
            $request->validate([
                'document' => 'file|mimes:jpg,jpeg,png,gif,pdf,csv,docx,xlsx,txt|max:2048',
            ]);

            $documentName = date('Ymdhis') . '.' . $document->getClientOriginalExtension();
            $document->move(public_path('documents/notification'), $documentName);
            $request->merge(['document_name' => $documentName]);
        }

        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
            'reminder_date' => 'nullable|date',
        ]);

        $user = User::findOrFail($request->receiver_id);
        $request->merge(['sender_id' => Auth::id()]);
        $user->notify(new \App\Notifications\SendNotification($request));

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Notification send successfully'),
            ], 201);
        }

        return redirect()->back()->with('message', __('db.Notification send successfully'));
    }

    public function markAsRead(Request $request)
    {
        Auth::user()->unreadNotifications
            ->where('data.reminder_date', date('Y-m-d'))
            ->markAsRead();

        if ($this->wantsSpaResponse($request)) {
            return $this->spaJson($request, [
                'message' => __('db.Notifications marked as read'),
            ]);
        }

        return response()->noContent();
    }
}
