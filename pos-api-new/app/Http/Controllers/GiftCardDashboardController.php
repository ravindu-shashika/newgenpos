<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\GiftCard;
use App\Models\GiftCardRecharge;
use App\Models\User;
use App\Traits\SpaResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Keygen\Keygen;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Models\Role;

class GiftCardDashboardController extends Controller
{
    use SpaResponse;

    protected function userCanAccess(): bool
    {
        return $this->userHasAny(['gift_card', 'gift-cards.view', 'gift-cards-index']);
    }

    protected function userCanMutate(): bool
    {
        return $this->userHasAny(['gift_card', 'gift-cards.create', 'gift-cards.edit', 'gift-cards-index']);
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

    protected function userDisplayName(?User $user): string
    {
        if (!$user) {
            return '—';
        }

        return $user->name ?? $user->username ?? $user->email ?? '—';
    }

    protected function formOptions(): array
    {
        return [
            'customers' => Customer::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'phone_number', 'email']),
            'users' => User::where('is_active', true)
                ->orderBy('username')
                ->get(['id', 'username', 'email']),
        ];
    }

    public function generateCode(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        return $this->spaJson($request, [
            'card_no' => Keygen::numeric(16)->generate(),
        ]);
    }

    public function index(Request $request)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        try {
            $search = trim((string) $request->input('search', ''));

            $query = GiftCard::query()
                ->where('is_active', true)
                ->with(['customer:id,name', 'user:id,username,email', 'creator:id,username,email']);

            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('card_no', 'LIKE', "%{$search}%")
                        ->orWhereHas('customer', function ($c) use ($search) {
                            $c->where('name', 'LIKE', "%{$search}%");
                        })
                        ->orWhereHas('user', function ($u) use ($search) {
                            $u->where('username', 'LIKE', "%{$search}%")
                                ->orWhere('email', 'LIKE', "%{$search}%");
                        });
                });
            }

            $cards = $query->orderBy('id', 'desc')->get();
            $decimals = (int) (config('decimal') ?? 2);
            $today = date('Y-m-d');
            $options = $this->formOptions();

            return $this->spaJson($request, [
                'data' => $cards->map(fn ($card) => $this->formatRow($card, $decimals, $today)),
                'customers' => $options['customers']->map(fn ($c) => [
                    'id' => $c->id,
                    'label' => trim($c->name . ($c->phone_number ? " ({$c->phone_number})" : '')),
                ]),
                'users' => $options['users']->map(fn ($u) => [
                    'id' => $u->id,
                    'label' => trim($this->userDisplayName($u) . ($u->email ? " ({$u->email})" : '')),
                ]),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return $this->spaJson($request, [
                'message' => __('db.Failed to load gift cards'),
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!$this->userCanAccess()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $card = GiftCard::where('is_active', true)->find($id);
        if (!$card) {
            return response()->json(['message' => __('db.Gift card not found')], 404);
        }

        return $this->spaJson($request, [
            'gift_card' => [
                'id' => $card->id,
                'card_no' => $card->card_no,
                'amount' => (float) $card->amount,
                'expense' => (float) $card->expense,
                'customer_id' => $card->customer_id,
                'user_id' => $card->user_id,
                'is_user' => (bool) $card->user_id,
                'expired_date' => $card->expired_date,
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $isUser = $request->boolean('user');

        $validated = $request->validate([
            'card_no' => [
                'required',
                'string',
                'max:255',
                Rule::unique('gift_cards')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'amount' => 'required|numeric|min:0',
            'expired_date' => 'nullable|date',
            'user_id' => $isUser ? 'required|exists:users,id' : 'nullable',
            'customer_id' => !$isUser ? 'required|exists:customers,id' : 'nullable',
        ]);

        $data = [
            'card_no' => $validated['card_no'],
            'amount' => $validated['amount'],
            'expired_date' => $validated['expired_date'] ?? date('Y-m-d'),
            'is_active' => true,
            'created_by' => Auth::id(),
            'expense' => 0,
            'customer_id' => $isUser ? null : $validated['customer_id'],
            'user_id' => $isUser ? $validated['user_id'] : null,
        ];

        GiftCard::create($data);

        $message = $this->sendCreateMail($data);

        return $this->spaJson($request, ['message' => strip_tags($message)]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $card = GiftCard::where('is_active', true)->find($id);
        if (!$card) {
            return response()->json(['message' => __('db.Gift card not found')], 404);
        }

        $isUser = $request->boolean('user');

        $validated = $request->validate([
            'card_no' => [
                'required',
                'string',
                'max:255',
                Rule::unique('gift_cards')->ignore($card->id)->where(fn ($query) => $query->where('is_active', true)),
            ],
            'amount' => 'required|numeric|min:0',
            'expired_date' => 'nullable|date',
            'user_id' => $isUser ? 'required|exists:users,id' : 'nullable',
            'customer_id' => !$isUser ? 'required|exists:customers,id' : 'nullable',
        ]);

        $card->card_no = $validated['card_no'];
        $card->amount = $validated['amount'];
        $card->expired_date = $validated['expired_date'] ?? $card->expired_date;
        if ($isUser) {
            $card->user_id = $validated['user_id'];
            $card->customer_id = null;
        } else {
            $card->user_id = null;
            $card->customer_id = $validated['customer_id'];
        }
        $card->save();

        return $this->spaJson($request, ['message' => __('db.GiftCard updated successfully')]);
    }

    public function recharge(Request $request, $id)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $card = GiftCard::where('is_active', true)->find($id);
        if (!$card) {
            return response()->json(['message' => __('db.Gift card not found')], 404);
        }

        $card->amount += $validated['amount'];
        $card->save();

        GiftCardRecharge::create([
            'gift_card_id' => $card->id,
            'amount' => $validated['amount'],
            'user_id' => Auth::id(),
        ]);

        $message = $this->sendRechargeMail($card, $validated['amount']);

        return $this->spaJson($request, ['message' => strip_tags($message)]);
    }

    public function deleteBySelection(Request $request)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $ids = $request->input('gift_cardIdArray', []);
        if (!is_array($ids) || count($ids) === 0) {
            return response()->json(['message' => 'No gift card is selected!'], 422);
        }

        GiftCard::whereIn('id', $ids)->update(['is_active' => false]);

        return $this->spaJson($request, ['message' => 'Gift Card deleted successfully!']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->userCanMutate()) {
            return response()->json(['message' => __('db.Sorry! You are not allowed to access this module')], 403);
        }

        $card = GiftCard::where('is_active', true)->find($id);
        if (!$card) {
            return response()->json(['message' => __('db.Gift card not found')], 404);
        }

        $card->is_active = false;
        $card->save();

        return $this->spaJson($request, ['message' => __('db.Data deleted successfully')]);
    }

    protected function sendCreateMail(array $data): string
    {
        $message = 'GiftCard created successfully';

        try {
            if (!empty($data['user_id'])) {
                $recipient = User::find($data['user_id']);
            } else {
                $recipient = Customer::find($data['customer_id']);
            }

            if ($recipient && $recipient->email) {
                $mailData = array_merge($data, [
                    'email' => $recipient->email,
                    'name' => $recipient instanceof User
                        ? $this->userDisplayName($recipient)
                        : ($recipient->name ?? ''),
                ]);
                Mail::send('mail.gift_card_create', $mailData, function ($message) use ($mailData) {
                    $message->to($mailData['email'])->subject('GiftCard');
                });
            }
        } catch (\Throwable $e) {
            $message = 'GiftCard created successfully. Please setup your mail setting to send mail.';
        }

        return $message;
    }

    protected function sendRechargeMail(GiftCard $card, float $amount): string
    {
        $message = 'GiftCard recharged successfully';

        try {
            $recipient = $card->customer_id
                ? Customer::find($card->customer_id)
                : User::find($card->user_id);

            if ($recipient && $recipient->email) {
                $mailData = [
                    'email' => $recipient->email,
                    'name' => $recipient instanceof User
                        ? $this->userDisplayName($recipient)
                        : ($recipient->name ?? ''),
                    'card_no' => $card->card_no,
                    'amount' => $amount,
                    'balance' => $card->amount - $card->expense,
                ];
                Mail::send('mail.gift_card_recharge', $mailData, function ($message) use ($mailData) {
                    $message->to($mailData['email'])->subject('GiftCard Recharge Info');
                });
            }
        } catch (\Throwable $e) {
            $message = 'GiftCard recharged successfully. Please setup your mail setting to send mail.';
        }

        return $message;
    }

    private function formatRow(GiftCard $card, int $decimals, string $today): array
    {
        $balance = (float) $card->amount - (float) $card->expense;
        $clientName = $card->customer_id
            ? ($card->customer->name ?? '—')
            : $this->userDisplayName($card->user);

        $expiredDate = $card->expired_date
            ? date(config('date_format') ?: 'd-m-Y', strtotime($card->expired_date))
            : '—';

        return [
            'id' => $card->id,
            'card_no' => $card->card_no,
            'client_name' => $clientName,
            'customer_id' => $card->customer_id,
            'user_id' => $card->user_id,
            'is_user' => (bool) $card->user_id,
            'amount' => round((float) $card->amount, $decimals),
            'expense' => round((float) $card->expense, $decimals),
            'balance' => round($balance, $decimals),
            'created_by' => $this->userDisplayName($card->creator),
            'expired_date' => $expiredDate,
            'expired_raw' => $card->expired_date,
            'is_expired' => $card->expired_date && $card->expired_date < $today,
        ];
    }
}
