/** Helpers for product variant rows backed by master variant types. */

export function masterValueList(master) {
    if (!master?.values?.length) return [];
    return master.values.map((v) => (typeof v === 'string' ? v : v.value)).filter(Boolean);
}

function valueInList(value, list = []) {
    const needle = String(value ?? '').trim().toLowerCase();
    if (!needle) return false;
    return list.some((v) => String(v).trim().toLowerCase() === needle);
}

/** Prefer master catalog chips; never bleed selected values from another type into available. */
export function normalizeProductVariantRow(row, masters = []) {
    const legacyValues = String(row?.values ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const selectedRaw = Array.isArray(row?.selectedValues) && row.selectedValues.length
        ? [...row.selectedValues]
        : legacyValues;

    const master = masters.find(
        (m) => (row?.master_id && Number(m.id) === Number(row.master_id))
            || (row?.name && m.name?.toLowerCase() === String(row.name).toLowerCase()),
    );

    const availableFromMaster = master ? masterValueList(master) : [];
    const availableValues = availableFromMaster.length
        ? availableFromMaster
        : (Array.isArray(row?.availableValues) && row.availableValues.length
            ? [...row.availableValues]
            : []);

    const selectedValues = availableValues.length
        ? selectedRaw.filter((v) => valueInList(v, availableValues))
        : selectedRaw;

    return {
        master_id: master?.id ?? row?.master_id ?? null,
        name: master?.name || row?.name || '',
        selectedValues,
        availableValues,
    };
}

export function normalizeProductVariantRows(rows, masters = []) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((row) => normalizeProductVariantRow(row, masters));
}

/**
 * Ensure saved product_variants appear as checked attribute chips on edit.
 * Assigns each combo attribute to the row whose availableValues contains it
 * (so "28" lands on Numeric Size, not Size).
 */
export function mergeVariantSelectionsFromCombinations(variantRows, combinations = []) {
    if (!Array.isArray(variantRows) || variantRows.length === 0) return variantRows;
    if (!Array.isArray(combinations) || combinations.length === 0) return variantRows;

    const rows = variantRows.map((row) => ({
        ...row,
        selectedValues: [...(row.selectedValues || [])],
        availableValues: [...(row.availableValues || [])],
    }));

    const addToBestRow = (part) => {
        const value = String(part ?? '').trim();
        if (!value) return;

        const byAvailable = rows.findIndex((row) => valueInList(value, row.availableValues));
        if (byAvailable >= 0) {
            const set = new Set(rows[byAvailable].selectedValues);
            set.add(value);
            rows[byAvailable].selectedValues = Array.from(set);
            return;
        }

        // Single-type products: only row — still avoid inventing chips outside catalog.
        if (rows.length === 1) {
            const set = new Set(rows[0].selectedValues);
            set.add(value);
            rows[0].selectedValues = Array.from(set);
            if (!rows[0].availableValues.length) {
                rows[0].availableValues = Array.from(set);
            }
        }
    };

    combinations.forEach((combo) => {
        const name = String(combo?.name ?? '').trim();
        if (!name) return;
        const parts = name.includes('/')
            ? name.split('/').map((s) => s.trim()).filter(Boolean)
            : [name];
        parts.forEach(addToBestRow);
    });

    return rows;
}

export function parseValuesInput(text) {
    return String(text ?? '')
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);
}
