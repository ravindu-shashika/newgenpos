<?php

namespace App\Services;

use App\Models\Printer;

/**
 * Stub for receipt printer connector validation.
 * Replace with real implementation (e.g. escpos-connector) if needed.
 */
class PrinterService
{
    /**
     * Validate that a connector can be created for the given printer.
     * Does not actually connect; override in a full implementation.
     */
    public function getConnector(Printer $printer): void
    {
        // Optional: validate connection_type and required fields (ip/port vs path)
        $type = $printer->connection_type ?? 'network';
        if ($type === 'network') {
            if (empty($printer->ip_address) || empty($printer->port)) {
                throw new \InvalidArgumentException(__('db.IP Address and Port are required for network printers'));
            }
        } elseif (in_array($type, ['windows', 'linux'])) {
            if (empty($printer->path)) {
                throw new \InvalidArgumentException(__('db.Path is required for this connection type'));
            }
        }
    }
}
