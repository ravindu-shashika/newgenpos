<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PosStockUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public int $warehouseId,
        public string $reason,
        public ?string $reference,
        public array $stock,
        public array $batches = [],
        public string $syncVersion = '',
    ) {
        if ($this->syncVersion === '') {
            $this->syncVersion = now()->toIso8601String();
        }
    }

    /**
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('pos.warehouse.'.$this->warehouseId),
            new PrivateChannel('admin.warehouse.'.$this->warehouseId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'pos.stock.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'warehouse_id' => $this->warehouseId,
            'reason' => $this->reason,
            'reference' => $this->reference,
            'stock' => $this->stock,
            'batches' => $this->batches,
            'sync_version' => $this->syncVersion,
        ];
    }
}
