<?php

return [

    /*
    |--------------------------------------------------------------------------
    | POS offline sale sync
    |--------------------------------------------------------------------------
    |
    | When true and QUEUE_CONNECTION is database/redis, sales are queued — run:
    |   php artisan queue:work --queue=pos-sales
    | When QUEUE_CONNECTION=sync, sales always process inline regardless.
    | When false, POST /pos/sales/sync creates each sale inline (can timeout).
    |
    */
    'sale_sync_use_queue' => env('POS_SALE_SYNC_USE_QUEUE', true),

    'sale_sync_queue' => env('POS_SALE_SYNC_QUEUE', 'pos-sales'),

];
