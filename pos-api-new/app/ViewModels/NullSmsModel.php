<?php

namespace App\ViewModels;

/** No-op SMS for POS / API contexts without SMS templates configured. */
class NullSmsModel implements ISmsModel
{
    public function initialize($data): void
    {
    }
}
