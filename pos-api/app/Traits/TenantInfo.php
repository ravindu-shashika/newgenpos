<?php

namespace App\Traits;

trait TenantInfo
{
    /**
     * Get tenant ID from configuration
     *
     * @return mixed
     */
    public function getTenantId()
    {
        // If you have a multi-tenant system, implement this
        // For now, return null or a default value
        return config('app.tenant_id', null);
    }

    /**
     * Check if running in multi-tenant mode
     *
     * @return bool
     */
    public function isMultiTenant()
    {
        return config('database.connections.saleprosaas_landlord') !== null;
    }
}
