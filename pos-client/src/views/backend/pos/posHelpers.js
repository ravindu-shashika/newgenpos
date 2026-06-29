/** Map POS setting payment_options strings → paid_by_id (legacy SaleController). */
export const PAYMENT_METHOD_MAP = {
    cash: { id: '1', label: 'Cash', className: 'cash' },
    card: { id: '3', label: 'Card', className: 'card' },
    credit: { id: 'credit', label: 'Credit Sale', className: 'credit' },
    cheque: { id: '4', label: 'Cheque', className: 'cheque' },
    gift_card: { id: '2', label: 'Gift Card', className: 'gift' },
    deposit: { id: '6', label: 'Deposit', className: 'deposit' },
    paypal: { id: '5', label: 'PayPal', className: 'paypal' },
    pesapal: { id: 'pesapal', label: 'Pesapal', className: 'pesapal' },
    razorpay: { id: 'razorpay', label: 'Razorpay', className: 'razorpay' },
    installment: { id: 'installment', label: 'Installment', className: 'installment' },
    points: { id: '7', label: 'Points', className: 'points' },
};

/** Standard gateways shown as main buttons on legacy pos.blade.php */
const PRIMARY_KEYS = new Set([
    'cash',
    'card',
    'credit',
    'cheque',
    'gift_card',
    'deposit',
    'points',
    'razorpay',
    'pesapal',
    'installment',
]);

export function resolvePaymentButtons(paymentOptions) {
    const opts = paymentOptions?.length ? paymentOptions : ['cash', 'card', 'cheque', 'deposit'];
    const primary = [];
    const more = [];

    opts.forEach((raw) => {
        const key = String(raw).trim().toLowerCase();
        const def = PAYMENT_METHOD_MAP[key] || {
            id: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            className: 'custom',
        };
        const btn = { ...def, key };
        if (PRIMARY_KEYS.has(key)) primary.push(btn);
        else more.push(btn);
    });

    return { primary, more };
}

/** Apply coupon like legacy pos.blade.php couponDiscount(). */
export function applyCoupon(couponCode, coupons, grandTotalBeforeCoupon, exchangeRate = 1) {
    const code = String(couponCode || '').trim();
    if (!code) return { ok: false, message: 'Enter a coupon code.' };

    const coupon = (coupons || []).find((c) => String(c.code).toLowerCase() === code.toLowerCase());
    if (!coupon) return { ok: false, message: 'Invalid coupon code!' };

    const today = new Date().toISOString().slice(0, 10);
    if (coupon.expired_date && today > String(coupon.expired_date).slice(0, 10)) {
        return { ok: false, message: 'This coupon has expired!' };
    }
    if (coupon.quantity != null && coupon.used != null && parseFloat(coupon.quantity) <= parseFloat(coupon.used)) {
        return { ok: false, message: 'This coupon is no longer available.' };
    }

    const minAmount = parseFloat(coupon.minimum_amount) || 0;
    if (grandTotalBeforeCoupon < minAmount) {
        return { ok: false, message: `Grand total must be at least ${minAmount} for this coupon.` };
    }

    const rate = parseFloat(exchangeRate) || 1;
    const amount = parseFloat(coupon.value ?? coupon.amount) || 0;
    let discount = 0;

    if (String(coupon.type).toLowerCase() === 'fixed') {
        discount = amount * rate;
    } else {
        discount = grandTotalBeforeCoupon * (amount / 100);
    }

    return {
        ok: true,
        coupon_id: coupon.id,
        coupon_discount: discount,
        message: String(coupon.type).toLowerCase() === 'fixed'
            ? `Coupon applied: ${(amount * rate).toFixed(2)} off`
            : `Coupon applied: ${amount}% off`,
    };
}

export function brandImageUrl(meta, image) {
    const base = meta?.brand_image_base || '';
    const fallback = meta?.default_brand_image || '';
    if (!image) return fallback;
    if (String(image).startsWith('http')) return image;
    return `${base}/${image}`;
}

export function categoryImageUrl(meta, image) {
    const base = meta?.category_image_base || '';
    const fallback = meta?.default_category_image || '';
    if (!image) return fallback;
    if (String(image).startsWith('http')) return image;
    return `${base}/${image}`;
}
