<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin.warehouse.{warehouseId}', function ($user, $warehouseId) {
    if (!$user) {
        return false;
    }

    if (method_exists($user, 'hasRole') && $user->hasRole('Admin')) {
        return true;
    }

    if (isset($user->warehouse_id) && (int) $user->warehouse_id === (int) $warehouseId) {
        return ['id' => $user->id, 'name' => $user->name ?? 'User'];
    }

    return Auth::check();
});

Broadcast::channel('pos.warehouse.{warehouseId}', function () {
    return false;
});
