/** Default label content options for barcode templates. */
export const DEFAULT_BARCODE_PRINT_OPTIONS = {
    layout: 'zebra',
    business_name: true,
    business_name_size: 13,
    name: true,
    name_size: 12,
    brand_name: false,
    brand_name_size: 12,
    price: true,
    price_size: 12,
    promo_price: false,
    promo_price_size: 15,
};

/** Zebra 80mm roll — 38mm × 25mm, 2 labels per row (values in inches). */
export const ZEBRA_80MM_PRESET = {
    name: 'Zebra 80mm (2-up)',
    description: '80mm continuous roll — 38mm × 25mm labels, 2 per row, 2mm column gap',
    is_continuous: true,
    is_default: false,
    width: 1.496,
    height: 0.984,
    paper_width: 3.15,
    paper_height: 0,
    top_margin: 0,
    left_margin: 0,
    stickers_in_one_row: 2,
    stickers_in_one_sheet: 28,
    row_distance: 0,
    col_distance: 0.079,
    print_options: { ...DEFAULT_BARCODE_PRINT_OPTIONS },
};

export function normalizeBarcodePrintOptions(raw) {
    if (!raw || typeof raw !== 'object') {
        return { ...DEFAULT_BARCODE_PRINT_OPTIONS };
    }
    return { ...DEFAULT_BARCODE_PRINT_OPTIONS, ...raw };
}
