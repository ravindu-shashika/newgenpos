import React from 'react';

export function formatMoney(value, decimal = 2) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        return (0).toLocaleString('en-US', {
            minimumFractionDigits: decimal,
            maximumFractionDigits: decimal,
        });
    }
    return n.toLocaleString('en-US', {
        minimumFractionDigits: decimal,
        maximumFractionDigits: decimal,
    });
}

export function sumRows(rows, key) {
    return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

export function parseFormattedNumber(value) {
    if (value == null || value === '') return 0;
    return parseFloat(String(value).replace(/,/g, '')) || 0;
}

export function HtmlCell({ html }) {
    if (!html) return '—';
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
