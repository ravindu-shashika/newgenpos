<?php

namespace App\Http\Controllers;

use App\Models\Terminal;
use Illuminate\Http\Request;
use Pusher\Pusher;

class PosBroadcastingController extends Controller
{
    public function auth(Request $request)
    {
        /** @var Terminal|null $terminal */
        $terminal = $request->attributes->get('pos_terminal');
        if (!$terminal) {
            return response()->json(['message' => 'Invalid POS token.'], 401);
        }

        $channelName = (string) $request->input('channel_name', '');
        $socketId = (string) $request->input('socket_id', '');

        if ($channelName === '' || $socketId === '') {
            return response()->json(['message' => 'channel_name and socket_id are required.'], 422);
        }

        if (!preg_match('/^private-pos\.warehouse\.(\d+)$/', $channelName, $matches)) {
            return response()->json(['message' => 'Channel not allowed.'], 403);
        }

        $warehouseId = (int) $matches[1];
        if ($terminal->warehouse_id === null || (int) $terminal->warehouse_id !== $warehouseId) {
            return response()->json(['message' => 'Terminal warehouse mismatch.'], 403);
        }

        $connection = config('broadcasting.connections.reverb');
        if (!$connection) {
            return response()->json(['message' => 'Broadcasting is not configured.'], 503);
        }

        $pusher = new Pusher(
            $connection['key'],
            $connection['secret'],
            $connection['app_id'],
            $connection['options'] ?? [],
        );

        $auth = $pusher->authorizeChannel($channelName, $socketId);

        return response()->json(json_decode($auth, true, 512, JSON_THROW_ON_ERROR));
    }
}
