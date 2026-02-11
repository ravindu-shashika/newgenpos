<?php

namespace App\Http\Controllers;

use App\Models\Barcode;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class LabelsController extends Controller
{
    /**
     * Display labels
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        $barcode_settings = Barcode::select(DB::raw('CONCAT(name, ", ", COALESCE(description, "")) as name, id, is_default'))->get();
        $default = $barcode_settings->where('is_default', 1)->first();
        $barcode_settings = $barcode_settings->pluck('name', 'id');

        return view('backend.labels.show',compact('barcode_settings'));
    }

    public function printLabel(Request $request)
    {
        try {
            $html = $this->generateLabelHtml(
                $request->get('products', []),
                $request->get('print', []),
                (int) $request->get('barcode_setting')
            );

            return response($html);
        } catch (\Exception $e) {
            \Log::emergency('File:' . $e->getFile() . ' Line:' . $e->getLine() . ' Message:' . $e->getMessage());
            abort(500, __('lang_v1.barcode_label_error'));
        }
    }

    public function printLabelApi(Request $request)
    {
        $data = $request->validate([
            'barcode_setting' => 'required|exists:barcodes,id',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|integer',
            'products.*.product_name' => 'required|string',
            'products.*.sub_sku' => 'required|string',
            'products.*.quantity' => 'required|integer|min:1|max:500',
            'products.*.product_price' => 'nullable|numeric',
            'products.*.default_price' => 'nullable|numeric',
            'products.*.product_promo_price' => 'nullable|numeric',
            'products.*.currency' => 'nullable|string',
            'products.*.currency_position' => 'nullable|string',
            'products.*.brand_name' => 'nullable|string',
            'products.*.alt_code' => 'nullable|string',
            'print' => 'required|array',
        ]);

        try {
            $html = $this->generateLabelHtml(
                $data['products'],
                $data['print'],
                (int) $data['barcode_setting']
            );

            return response()->json([
                'success' => true,
                'html' => $html,
            ]);
        } catch (\Exception $e) {
            \Log::error('Label preview error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json([
                'success' => false,
                'message' => __('lang_v1.barcode_label_error'),
            ], 500);
        }
    }

    private function generateLabelHtml(array $products, array $print, int $barcodeSettingId): string
    {
        $barcodeDetails = Barcode::findOrFail($barcodeSettingId);
        $barcodeDetails->stickers_in_one_sheet = $barcodeDetails->is_continuous ? $barcodeDetails->stickers_in_one_row : $barcodeDetails->stickers_in_one_sheet;
        $barcodeDetails->paper_height = $barcodeDetails->is_continuous ? $barcodeDetails->height : $barcodeDetails->paper_height;

        if ($barcodeDetails->stickers_in_one_row == 1) {
            $barcodeDetails->col_distance = 0;
            $barcodeDetails->row_distance = 0;
        }

        $generalSetting = Cache::remember('general_setting', 60 * 60 * 24 * 365, function () {
            return DB::table('general_settings')->latest()->first();
        });

        $businessName = $generalSetting->company_name ?? config('app.name', 'Business');

        $productDetailsPerPage = [];
        $totalQty = 0;
        foreach ($products as $value) {
            $details = [
                'product_name' => $value['product_name'],
                'product_actual_name' => $value['product_name'],
                'product_price' => $value['product_price'] ?? $value['default_price'] ?? 0,
                'product_promo_price' => $value['product_promo_price'] ?? null,
                'currency' => $value['currency'] ?? config('currency'),
                'currency_position' => $value['currency_position'] ?? config('currency_position'),
                'product_id' => $value['product_id'],
                'brand_name' => $value['brand_name'] ?? null,
                'product_type' => 'standard',
                'sub_sku' => $value['sub_sku'],
                'alt_code' => $value['alt_code'] ?? null,
                'barcode_type' => 'C128',
                'unit' => 1,
            ];

            $quantity = (int) ($value['quantity'] ?? 1);

            for ($i = 0; $i < $quantity; $i++) {
                $page = intdiv($totalQty, max(1, $barcodeDetails->stickers_in_one_sheet));
                if ($totalQty % max(1, $barcodeDetails->stickers_in_one_sheet) === 0) {
                    $productDetailsPerPage[$page] = [];
                }
                $productDetailsPerPage[$page][] = $details;
                $totalQty++;
            }
        }

        $marginTop = $barcodeDetails->is_continuous ? 0 : $barcodeDetails->top_margin;
        $marginLeft = $barcodeDetails->is_continuous ? 0 : $barcodeDetails->left_margin;
        $paperWidth = $barcodeDetails->paper_width;
        $paperHeight = $barcodeDetails->paper_height;

        $factor = (($barcodeDetails->width / $barcodeDetails->height)) / ($barcodeDetails->is_continuous ? 2 : 4);

        $html = '';
        $pages = array_values($productDetailsPerPage);
        $lastIndex = count($pages) - 1;

        foreach ($pages as $index => $pageProducts) {
            $isFirst = $index === 0;
            $isLast = $index === $lastIndex;

            $html .= view('backend.labels.print_label')->with([
                'print' => $print,
                'page_products' => $pageProducts,
                'business_name' => $businessName,
                'barcode_details' => $barcodeDetails,
                'margin_top' => $marginTop,
                'margin_left' => $marginLeft,
                'paper_width' => $paperWidth,
                'paper_height' => $paperHeight,
                'is_first' => $isFirst,
                'is_last' => $isLast,
                'factor' => $factor,
            ])->render();
        }

        $html .= '<script>window.print();</script>';

        return $html;
    }
}
