/** Helpers for product variant rows backed by master variant types. */

export function masterValueList(master) {
    if (!master?.values?.length) return [];
    return master.values.map((v) => (typeof v === 'string' ? v : v.value)).filter(Boolean);
}

export function normalizeProductVariantRow(row, masters = []) {
    const legacyValues = String(row?.values ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const selectedValues = Array.isArray(row?.selectedValues) && row.selectedValues.length
        ? [...row.selectedValues]
        : legacyValues;

    const master = masters.find(
        (m) => (row?.master_id && Number(m.id) === Number(row.master_id))
            || (row?.name && m.name?.toLowerCase() === String(row.name).toLowerCase()),
    );

    const availableFromMaster = master ? masterValueList(master) : [];
    const availableValues = Array.isArray(row?.availableValues) && row.availableValues.length
        ? [...row.availableValues]
        : availableFromMaster;

    const mergedAvailable = Array.from(new Set([...availableValues, ...selectedValues]));

    return {
        master_id: master?.id ?? row?.master_id ?? null,
        name: row?.name || master?.name || '',
        selectedValues,
        availableValues: mergedAvailable,
    };
}

export function normalizeProductVariantRows(rows, masters = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((row) => normalizeProductVariantRow(row, masters));
}

/** Ensure saved product_variants appear as checked attribute chips on edit. */
export function mergeVariantSelectionsFromCombinations(variantRows, combinations = []) {
    if (!Array.isArray(variantRows) || variantRows.length === 0) return variantRows;
    if (!Array.isArray(combinations) || combinations.length === 0) return variantRows;

    if (variantRows.length === 1) {
        const comboNames = combinations.map((c) => String(c?.name ?? '').trim()).filter(Boolean);
        const row = variantRows[0];
        const selectedValues = Array.from(new Set([...(row.selectedValues || []), ...comboNames]));
        return [{
            ...row,
            selectedValues,
            availableValues: Array.from(new Set([...(row.availableValues || []), ...selectedValues])),
        }];
    }

    return variantRows.map((row, index) => {
        const selected = new Set(row.selectedValues || []);
        combinations.forEach((combo) => {
            const parts = String(combo?.name ?? '')
                .split('/')
                .map((s) => s.trim())
                .filter(Boolean);
            if (parts[index]) selected.add(parts[index]);
        });
        const selectedValues = Array.from(selected);
        return {
            ...row,
            selectedValues,
            availableValues: Array.from(new Set([...(row.availableValues || []), ...selectedValues])),
        };
    });
}

export function parseValuesInput(text) {
    return String(text ?? '')
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
}
