<?php

use Carbon\Carbon;

if (!function_exists('normalize_to_sql_datetime')) {
    function normalize_to_sql_datetime($input, $useCurrentTime = false)
    {
        if (empty($input)) {
            return Carbon::now()->format('Y-m-d H:i:s');
        }

        $input = trim($input);

        // Replace multiple possible separators with "-"
        $normalized = preg_replace('/[\/\.\s]+/', '-', $input);

        // Formats to test (you can add more if needed)
        $formats = [
            'd-m-Y',
            'd/m/Y',
            'd.m.Y',
            'm-d-Y',
            'm/d/Y',
            'm.d.Y',
            'Y-m-d',
            'Y/m/d',
            'Y.m.d',
        ];

        foreach ($formats as $fmt) {
            try {
                $date = Carbon::createFromFormat($fmt, $normalized);

                if ($date !== false) {
                    if ($useCurrentTime) {
                        // inject current time if only date provided
                        $date->setTimeFrom(Carbon::now());
                    }
                    return $date->format('Y-m-d H:i:s');
                }
            } catch (\Exception $e) {
                // just continue to next format
            }
        }

        // fallback: try Carbon::parse (loose parsing)
        try {
            $date = Carbon::parse($input);
            if ($useCurrentTime) {
                $date->setTimeFrom(Carbon::now());
            }
            return $date->format('Y-m-d').' '.date('H:i:s');
        } catch (\Exception $e) {
            // totally failed → return current datetime
            return Carbon::now()->format('Y-m-d H:i:s');
        }
    }
}

if (!function_exists('humanize_db_message')) {
    /**
     * Render db.* translation keys as plain English when no lang files are loaded.
     */
    function humanize_db_message(string $key): string
    {
        if (!str_starts_with($key, 'db.')) {
            return $key;
        }

        $text = substr($key, 3);
        if ($text === '') {
            return $key;
        }

        if (str_contains($text, '_') && !str_contains($text, ' ')) {
            return ucfirst(str_replace('_', ' ', $text));
        }

        return $text;
    }
}

if (!function_exists('format_currency')) {
    function format_currency($amount, $currency = null, $position = null, $decimal = null, $mask = false)
    {
        if ($mask) {
            return '****';
        }

        $currency = $currency ?? config('currency');
        $position = $position ?? config('currency_position');
        $decimal  = $decimal ?? config('decimal');

        $formatted = number_format((float) $amount, $decimal, '.', '');

        if ($position == 'prefix') {
            return $currency . ' ' . $formatted;
        }

        return $formatted . ' ' . $currency;
    }
}
