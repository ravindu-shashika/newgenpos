import React, { useState, useEffect, useRef, useCallback } from 'react';
import { faTimes, faPlus, faCheck, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../../services';
import { FormModal, ListView, SystemButton, SafeFontAwesomeIcon } from '../../../components';

const BARCODE_OPTIONS = [
  { value: 'C128', label: 'Code 128' },
  { value: 'C39', label: 'Code 39' },
  { value: 'UPCA', label: 'UPC-A' },
  { value: 'UPCE', label: 'UPC-E' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'EAN13', label: 'EAN-13' },
];

const PRODUCT_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'combo', label: 'Combo' },
  { value: 'digital', label: 'Digital' },
  { value: 'service', label: 'Service' },
];

/** Nanoid-style: 10 chars from 0-9A-Z (same as Vue customAlphabet) */
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function nanoidProductCode(length = 10) {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

const defaultProduct = {
  type: 'standard',
  name: '',
  code: '',
  alt_code: '',
  barcode_symbology: 'C128',
  brand_id: '',
  category_id: '',
  unit_id: '',
  sale_unit_id: '',
  purchase_unit_id: '',
  cost: '',
  profit_margin_type: 'percentage',
  profit_margin: '25',
  price: '',
  wholesale_price: '',
  alert_quantity: '',
  tax_id: '',
  tax_method: '1',
  warranty: '',
  warranty_type: 'months',
  guarantee: '',
  guarantee_type: 'months',
  daily_sale_objective: '',
  featured: false,
  is_embeded: false,
  is_variant: false,
  is_diffPrice: false,
  is_batch: false,
  is_imei: false,
  promotion: false,
  promotion_price: '',
  starting_date: '',
  ending_date: '',
  is_initial_stock: false,
  product_details: '',
};

const Items = () => {
  const moduleName = 'Products';

  const [entities, setEntities] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [baseUnits, setBaseUnits] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [saleUnits, setSaleUnits] = useState([]);
  const [taxList, setTaxList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState(null);
  const [product, setProduct] = useState({ ...defaultProduct });
  const [showModalState, setShowModalState] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Combo products (type === 'combo')
  const [comboProducts, setComboProducts] = useState([]);
  const [comboSearchQuery, setComboSearchQuery] = useState('');
  const [comboSearchResults, setComboSearchResults] = useState([]);
  const [comboSearching, setComboSearching] = useState(false);

  // Variants (is_variant)
  const [variantOptions, setVariantOptions] = useState([{ option: '', value: '' }]);
  const [variantTable, setVariantTable] = useState([]);

  // Initial stock (is_initial_stock): warehouses with qty
  const [initialStocks, setInitialStocks] = useState([]);

  // Diff price (is_diffPrice): warehouses with price
  const [diffPrices, setDiffPrices] = useState([]);

  const dataColumns = [
    { title: 'Code', name: 'code', searchable: true },
    { title: 'Name', name: 'name', searchable: true },
    { title: 'Category', name: 'category_name', searchable: false },
    { title: 'Cost', name: 'cost', searchable: false },
    { title: 'Price', name: 'price', searchable: false },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModalState && !isEdit) {
      fetchFormData();
    }
  }, [showModalState, isEdit]);

  useEffect(() => {
    if (!product.unit_id || !allUnits.length) {
      if (!product.unit_id) setSaleUnits([]);
      return;
    }
    const related = allUnits.filter(
      (u) => String(u.id) === String(product.unit_id) || String(u.base_unit) === String(product.unit_id) || String(u.base_unit_id) === String(product.unit_id)
    );
    setSaleUnits(related.map((u) => ({
      value: u.id,
      label: `${u.unit_name ?? u.name} (${u.unit_code ?? u.id})`,
    })));
  }, [product.unit_id, allUnits]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('products');
      const data = response?.data?.data ?? response?.data ?? response;
      const list = Array.isArray(data) ? data : [];
      setEntities(
        list.map((p) => ({
          id: p.id,
          code: p.code ?? p.item_code,
          name: p.name ?? p.title,
          category_name: p.category?.name ?? p.category_name ?? '—',
          cost: p.cost ?? '',
          price: p.price ?? '',
        }))
      );
    } catch (err) {
      msg.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const formRes = await api.get('products/form-data').catch(() => null);
      const fd = formRes?.data;

      if (fd?.categories?.length) {
        setCategories(fd.categories.map((c) => ({ id: c.id, name: c.name })));
      } else {
        const categoriesRes = await api.get('categories').catch(() => null);
        const catData = categoriesRes?.data?.data ?? categoriesRes?.data ?? [];
        setCategories(Array.isArray(catData) ? catData : []);
      }

      if (fd?.brands?.length) {
        setBrands(fd.brands.map((b) => ({ id: b.id, title: b.title ?? b.name })));
      } else {
        const brandsRes = await api.get('brands').catch(() => null);
        const brandData = brandsRes?.data?.data ?? brandsRes?.data ?? [];
        setBrands(Array.isArray(brandData) ? brandData : []);
      }

      const unitsRes = await api.get('units').catch(() => api.get('units/base'));
      const unitData = unitsRes?.data?.data ?? unitsRes?.data ?? [];
      const all = Array.isArray(unitData) ? unitData : [];
      setAllUnits(all);
      const base = all.filter((u) => !u.base_unit && !u.base_unit_id);
      setBaseUnits(base);

      if (fd?.taxes?.length) {
        setTaxList(fd.taxes);
      } else {
        setTaxList(fd?.lims_tax_list ?? fd?.taxes ?? []);
      }

      if (fd?.warehouses?.length) {
        const whList = fd.warehouses.map((w) => ({ id: w.id, name: w.name, qty: 0, diff_price: 0 }));
        setWarehouses(whList);
        setInitialStocks(whList.map((w) => ({ warehouse_id: w.id, name: w.name, stock: 0 })));
        setDiffPrices(whList.map((w) => ({ warehouse_id: w.id, name: w.name, price: '' })));
      } else {
        setWarehouses([]);
        setInitialStocks([]);
        setDiffPrices([]);
      }

      if (fd) setFormData(fd);
    } catch (e) {
      console.error(e);
    }
  };

  const openNew = () => {
    setProduct({
      ...defaultProduct,
      code: nanoidProductCode(),
      alt_code: nanoidProductCode(),
    });
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setSaleUnits([]);
    setComboProducts([]);
    setComboSearchQuery('');
    setComboSearchResults([]);
    setVariantOptions([{ option: '', value: '' }]);
    setVariantTable([]);
    setInitialStocks([]);
    setDiffPrices([]);
    setShowModalState(true);
  };

  const hideDialog = () => {
    setShowModalState(false);
    setProduct({ ...defaultProduct });
    setSubmitted(false);
    setIsEdit(false);
    setSelectedId(null);
    setComboProducts([]);
    setComboSearchQuery('');
    setComboSearchResults([]);
    setVariantOptions([{ option: '', value: '' }]);
    setVariantTable([]);
    setInitialStocks([]);
    setDiffPrices([]);
    setSaleUnits([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let next = { ...product, [name]: type === 'checkbox' ? checked : value };

    if (name === 'type') {
      if (value === 'combo') {
        next.is_variant = false;
        next.is_diffPrice = false;
        next.is_initial_stock = false;
      } else if (value === 'digital') {
        next.is_variant = false;
        next.is_diffPrice = false;
        next.is_batch = false;
      } else if (value === 'service') {
        next.is_variant = false;
        next.is_diffPrice = false;
        next.is_batch = false;
        next.is_imei = false;
      }
    }
    if (name === 'is_variant' && checked) {
      next.is_initial_stock = false;
      next.is_batch = false;
      next.featured = false;
    }
    if (name === 'is_batch' && checked) {
      next.is_initial_stock = false;
      next.is_variant = false;
      next.featured = false;
    }
    if (name === 'is_imei' && checked) {
      next.is_initial_stock = false;
      next.featured = false;
    }
    if (name === 'is_initial_stock' && checked) {
      next.is_variant = false;
    }

    if (name === 'unit_id') {
      next.sale_unit_id = '';
      next.purchase_unit_id = '';
    }
    if (['cost', 'profit_margin', 'profit_margin_type'].includes(name)) {
      next.price = recalcPriceFromCostMargin(
        next.cost,
        next.profit_margin,
        next.profit_margin_type
      );
    }
    if (name === 'price') {
      next.profit_margin = recalcMarginFromPrice(next.cost, value, next.profit_margin_type);
    }
    setProduct(next);
  };

  const recalcMarginFromPrice = (costVal, priceVal, marginType) => {
    const cost = parseFloat(costVal) || 0;
    const price = parseFloat(priceVal) || 0;
    if (!cost || !price) return product.profit_margin;
    const margin = marginType === 'percentage'
      ? ((price - cost) / cost * 100).toFixed(2)
      : (price - cost).toFixed(2);
    return margin;
  };

  const generateCode = async () => {
    try {
      const res = await api.get('generate-code');
      const code = res?.data?.code ?? res?.data ?? null;
      if (code) setProduct((p) => ({ ...p, code: String(code) }));
      else setProduct((p) => ({ ...p, code: nanoidProductCode() }));
    } catch {
      setProduct((p) => ({ ...p, code: nanoidProductCode() }));
    }
  };

  const generateAltCode = () => {
    setProduct((p) => ({ ...p, alt_code: nanoidProductCode() }));
  };

  // Combo: search products
  const comboSearch = useCallback(async (query) => {
    const q = (query || '').trim();
    if (q.length < 2) {
      setComboSearchResults([]);
      return;
    }
    setComboSearching(true);
    try {
      const res = await api.get(`products/search?query=${encodeURIComponent(q)}&limit=15`);
      const results = res?.data?.results ?? [];
      setComboSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setComboSearchResults([]);
    } finally {
      setComboSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!comboSearchQuery.trim()) {
      setComboSearchResults([]);
      return;
    }
    const t = setTimeout(() => comboSearch(comboSearchQuery), 300);
    return () => clearTimeout(t);
  }, [comboSearchQuery, comboSearch]);

  const addComboProduct = async (item) => {
    if (comboProducts.some((c) => c.product_id === item.product_id && (c.variant_id || null) === (item.variant_id || null))) {
      msg.error('Duplicate product/variant');
      return;
    }
    try {
      const res = await api.get(`product/${item.product_id}`);
      const prod = res?.data?.product ?? res?.data ?? res;
      const price = parseFloat(prod?.price) ?? 0;
      const cost = parseFloat(prod?.cost) ?? 0;
      const unit_id = prod?.unit_id ?? product.unit_id ?? '';
      const variant_id = item.variant_id ?? (prod?.product_variants?.[0]?.variant_id ?? null);
      const item_code = item.is_variant && prod?.product_variants?.[0] ? prod.product_variants[0].item_code : (prod?.code ?? item.code);
      setComboProducts((prev) => [
        ...prev,
        {
          product_id: item.product_id,
          variant_id: variant_id ?? '',
          name: prod?.name ?? item.label,
          code: item_code,
          wastage_percent: 0,
          qty: 1,
          unit_cost: cost,
          unit_price: price,
          subtotal: price,
          combo_unit_id: unit_id,
        },
      ]);
      setComboSearchQuery('');
      setComboSearchResults([]);
    } catch {
      msg.error('Failed to load product details');
    }
  };

  const removeComboProduct = (index) => {
    setComboProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateComboProduct = (index, field, value) => {
    setComboProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'qty' || field === 'unit_price') {
        const qty = parseFloat(field === 'qty' ? value : next[index].qty) || 0;
        const up = parseFloat(field === 'unit_price' ? value : next[index].unit_price) || 0;
        next[index].subtotal = (qty * up).toFixed(2);
      }
      return next;
    });
  };

  // Variant: add/remove option row
  const addVariantOption = () => {
    setVariantOptions((prev) => [...prev, { option: '', value: '' }]);
  };

  const removeVariantOption = (index) => {
    if (variantOptions.length <= 1) return;
    setVariantOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantOption = (index, field, value) => {
    setVariantOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const buildVariantTable = () => {
    const options = variantOptions.filter((o) => (o.option || '').trim() && (o.value || '').trim());
    if (options.length === 0) {
      setVariantTable([]);
      return;
    }
    const valueLists = options.map((o) => o.value.split(/[,;]/).map((v) => v.trim()).filter(Boolean));
    if (valueLists.some((arr) => arr.length === 0)) {
      setVariantTable([]);
      return;
    }
    const names = [];
    const combine = (idx, parts) => {
      if (idx === valueLists.length) {
        names.push(parts.join('/'));
        return;
      }
      valueLists[idx].forEach((v) => combine(idx + 1, [...parts, v]));
    };
    combine(0, []);
    const code = (product.code || '').trim() || 'code';
    setVariantTable(
      names.map((variant_name) => ({
        variant_name,
        item_code: `${variant_name}-${code}`,
        additional_cost: 0,
        additional_price: 0,
      }))
    );
  };

  useEffect(() => {
    if (!product.is_variant) {
      setVariantTable([]);
      return;
    }
    // When editing, variant table is already set from API in editRow; don't overwrite with zeros
    if (isEdit) return;
    buildVariantTable();
  }, [product.is_variant, variantOptions, product.code, isEdit]);

  const updateVariantRow = (index, field, value) => {
    setVariantTable((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateInitialStock = (index, value) => {
    setInitialStocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], stock: value };
      return next;
    });
  };

  const updateDiffPrice = (index, value) => {
    setDiffPrices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], price: value };
      return next;
    });
  };

  const recalcPriceFromCostMargin = (costVal, marginVal, marginType) => {
    const cost = parseFloat(costVal) || 0;
    const margin = parseFloat(marginVal) || 0;
    const type = marginType || product.profit_margin_type;
    const price = type === 'percentage' ? cost + (cost * margin) / 100 : cost + margin;
    return price ? price.toFixed(2) : '';
  };

  const editRow = async (row) => {
    const id = row.id;
    setSelectedId(id);
    setIsEdit(true);
    setSubmitted(false);
    try {
      const [formRes, productRes] = await Promise.all([
        api.get('products/form-data'),
        api.get(`product/${id}`),
      ]);
      const fd = formRes?.data;
      const p = productRes?.data?.product ?? productRes?.data ?? productRes;
      if (!p) {
        msg.error('Product not found');
        return;
      }

      if (fd?.categories?.length) {
        setCategories(fd.categories.map((c) => ({ id: c.id, name: c.name })));
      }
      if (fd?.brands?.length) {
        setBrands(fd.brands.map((b) => ({ id: b.id, title: b.title ?? b.name })));
      }
      if (fd?.units?.length) {
        const all = fd.units;
        setAllUnits(all);
        setBaseUnits(all.filter((u) => !u.base_unit && !u.base_unit_id));
      }
      if (fd?.taxes?.length) {
        setTaxList(fd.taxes);
      }
      if (fd?.warehouses?.length) {
        const whList = fd.warehouses.map((w) => ({ id: w.id, name: w.name, qty: 0, diff_price: 0 }));
        setWarehouses(whList);
      }

      setProduct({
        ...defaultProduct,
        type: p.type ?? 'standard',
        name: (p.name ?? '').replace(/<br\s*\/?>/gi, '\n'),
        code: p.code ?? '',
        alt_code: p.alt_code ?? p.code ?? '',
        barcode_symbology: p.barcode_symbology ?? 'C128',
        brand_id: p.brand_id ?? '',
        category_id: p.category_id ?? '',
        unit_id: p.unit_id ?? '',
        sale_unit_id: p.sale_unit_id ?? p.unit_id ?? '',
        purchase_unit_id: p.purchase_unit_id ?? p.unit_id ?? '',
        cost: p.cost ?? '',
        profit_margin_type: p.profit_margin_type ?? 'percentage',
        profit_margin: p.profit_margin ?? '0',
        price: p.price ?? '',
        wholesale_price: p.wholesale_price ?? '',
        alert_quantity: p.alert_quantity ?? '',
        tax_id: p.tax_id ?? '',
        tax_method: String(p.tax_method ?? '1'),
        warranty: p.warranty ?? '',
        warranty_type: p.warranty_type ?? 'months',
        guarantee: p.guarantee ?? '',
        guarantee_type: p.guarantee_type ?? 'months',
        daily_sale_objective: p.daily_sale_objective ?? '',
        featured: !!p.featured,
        is_embeded: !!p.is_embeded,
        is_variant: !!p.is_variant,
        is_diffPrice: !!p.is_diffPrice,
        is_batch: !!p.is_batch,
        is_imei: !!p.is_imei,
        promotion: !!p.promotion,
        promotion_price: p.promotion_price ?? '',
        starting_date: p.starting_date ? p.starting_date.split(' ')[0] : '',
        ending_date: p.last_date ? p.last_date.split(' ')[0] : '',
        is_initial_stock: !!(p.initial_stock_warehouses && p.initial_stock_warehouses.length > 0),
        product_details: (p.product_details ?? '').replace(/@/g, '"'),
      });

      if (p.type === 'combo' && Array.isArray(p.combo_items)) {
        setComboProducts(
          p.combo_items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id ?? '',
            name: item.name ?? '',
            code: item.code ?? '',
            wastage_percent: item.wastage_percent ?? 0,
            qty: item.qty ?? 1,
            unit_cost: item.unit_cost ?? 0,
            unit_price: item.unit_price ?? 0,
            subtotal: item.subtotal ?? item.unit_price ?? 0,
            combo_unit_id: item.combo_unit_id ?? '',
          }))
        );
      } else {
        setComboProducts([]);
      }

      if (p.is_variant && p.variant_options_array && Array.isArray(p.variant_options_array)) {
        const opts = p.variant_options_array.map((opt, i) => {
          const val = p.variant_values_array && p.variant_values_array[i];
          const valueStr = val == null ? '' : (Array.isArray(val) ? val.join(', ') : String(val));
          return { option: opt ?? '', value: valueStr };
        });
        setVariantOptions(opts.length ? opts : [{ option: '', value: '' }]);
      } else {
        setVariantOptions([{ option: '', value: '' }]);
      }

      const productVariants = p.product_variants || p.productVariants || [];
      if (p.is_variant && productVariants.length) {
        setVariantTable(
          productVariants.map((pv) => {
            const cost = pv.additional_cost ?? pv.additionalCost ?? 0;
            const price = pv.additional_price ?? pv.additionalPrice ?? 0;
            return {
              variant_name: pv.variant?.name ?? pv.name ?? '',
              item_code: pv.item_code ?? '',
              additional_cost: typeof cost === 'number' ? cost : parseFloat(cost) || 0,
              additional_price: typeof price === 'number' ? price : parseFloat(price) || 0,
            };
          })
        );
      } else {
        setVariantTable([]);
      }

      const whList = fd?.warehouses ?? [];
      const whStock = p.warehouse_stock || [];
      setDiffPrices(
        whList.length
          ? whList.map((w) => ({
              warehouse_id: w.id,
              name: w.name ?? '',
              price: whStock.find((pw) => String(pw.warehouse_id) === String(w.id))?.price ?? '',
            }))
          : whStock.map((pw) => ({
              warehouse_id: pw.warehouse_id,
              name: '',
              price: pw.price ?? '',
            }))
      );

      if (whList.length) {
        const initialStockList = p.initial_stock_warehouses || [];
        setInitialStocks(
          whList.map((w) => ({
            warehouse_id: w.id,
            name: w.name ?? '',
            stock: initialStockList.find((pw) => String(pw.warehouse_id) === String(w.id))?.qty ?? 0,
          }))
        );
      }

      setShowModalState(true);
    } catch (err) {
      msg.error('Failed to load product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!product.name?.trim()) {
      msg.error('Product Name is required');
      return;
    }
    if (!product.code?.trim()) {
      msg.error('Product Code is required');
      return;
    }
    if (!product.category_id) {
      msg.error('Category is required');
      return;
    }
    if (product.type === 'standard' && !product.unit_id) {
      msg.error('Product Unit is required');
      return;
    }
    if (['standard', 'combo'].includes(product.type) && (product.cost === '' || product.price === '')) {
      msg.error('Cost and Price are required');
      return;
    }

    if (product.type === 'combo' && comboProducts.length === 0) {
      msg.error('Add at least one product to the combo');
      return;
    }
    if (product.is_variant && variantTable.length === 0) {
      msg.error('Add at least one variant row');
      return;
    }

    const payload = {
      type: product.type,
      name: product.name.trim(),
      code: product.code.trim(),
      alt_code: product.alt_code?.trim() || product.code.trim(),
      barcode_symbology: product.barcode_symbology,
      brand_id: product.brand_id || null,
      category_id: product.category_id,
      unit_id: product.unit_id || null,
      sale_unit_id: product.sale_unit_id || product.unit_id || null,
      purchase_unit_id: product.purchase_unit_id || product.unit_id || null,
      cost: product.type !== 'digital' && product.type !== 'service' ? parseFloat(product.cost) || 0 : 0,
      profit_margin_type: product.profit_margin_type,
      profit_margin: parseFloat(product.profit_margin) || 0,
      price: parseFloat(product.price) || 0,
      wholesale_price: product.wholesale_price ? parseFloat(product.wholesale_price) : null,
      alert_quantity: product.alert_quantity ? parseFloat(product.alert_quantity) : null,
      tax_id: product.tax_id || null,
      tax_method: product.tax_method,
      warranty: product.warranty ? parseInt(product.warranty, 10) : null,
      warranty_type: product.warranty_type,
      guarantee: product.guarantee ? parseInt(product.guarantee, 10) : null,
      guarantee_type: product.guarantee_type,
      daily_sale_objective: product.daily_sale_objective ? parseFloat(product.daily_sale_objective) : null,
      featured: product.featured ? 1 : 0,
      is_embeded: product.is_embeded ? 1 : 0,
      is_variant: product.is_variant ? 1 : 0,
      is_diffPrice: product.is_diffPrice ? 1 : 0,
      is_batch: product.is_batch ? 1 : 0,
      is_imei: product.is_imei ? 1 : 0,
      promotion: product.promotion ? 1 : 0,
      is_initial_stock: product.is_initial_stock ? 1 : 0,
      product_details: product.product_details?.trim() || null,
      promotion_price: product.promotion ? (product.promotion_price ? parseFloat(product.promotion_price) : null) : null,
      starting_date: product.promotion && product.starting_date ? product.starting_date : null,
      last_date: product.promotion && product.ending_date ? product.ending_date : null,
    };
    if (isEdit && selectedId) payload.id = selectedId;

    try {
      const formDataToSend = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v != null && v !== '') formDataToSend.append(k, v);
      });

      if (product.type === 'combo' && comboProducts.length) {
        comboProducts.forEach((row) => {
          formDataToSend.append('product_id[]', row.product_id);
          formDataToSend.append('variant_id[]', row.variant_id ?? '');
          formDataToSend.append('product_qty[]', row.qty);
          formDataToSend.append('unit_price[]', row.unit_price);
          formDataToSend.append('wastage_percent[]', row.wastage_percent ?? 0);
          formDataToSend.append('combo_unit_id[]', row.combo_unit_id ?? '');
        });
      }

      if (product.is_variant && variantTable.length) {
        const opts = variantOptions.filter((o) => (o.option || '').trim() && (o.value || '').trim());
        opts.forEach((o) => {
          formDataToSend.append('variant_option[]', o.option.trim());
          formDataToSend.append('variant_value[]', o.value.trim());
        });
        variantTable.forEach((row) => {
          formDataToSend.append('variant_name[]', row.variant_name);
          formDataToSend.append('item_code[]', row.item_code);
          formDataToSend.append('additional_cost[]', row.additional_cost ?? 0);
          formDataToSend.append('additional_price[]', row.additional_price ?? 0);
        });
      }

      if (product.is_initial_stock) {
        const stockRows = initialStocks.length
          ? initialStocks
          : (warehouses || []).map((w) => ({ warehouse_id: w.id, name: w.name, stock: 0 }));
        stockRows.forEach((row) => {
          formDataToSend.append('stock_warehouse_id[]', row.warehouse_id);
          formDataToSend.append('stock[]', row.stock ?? 0);
        });
      }

      if (product.is_diffPrice && diffPrices.length) {
        diffPrices.forEach((row) => {
          formDataToSend.append('warehouse_id[]', row.warehouse_id);
          formDataToSend.append('diff_price[]', row.price ?? '');
        });
      }

      const file = imageInputRef.current?.files?.[0];
      if (file) formDataToSend.append('images[]', file);
      const digitalFile = fileInputRef.current?.files?.[0];
      if (digitalFile && product.type === 'digital') formDataToSend.append('file', digitalFile);

      const response = await api.postFormData('save-product').values(formDataToSend);
      const data = response?.data ?? response;
      const ok = response?.status === 200 && (data?.success === true || data?.status === 200 || data?.id);
      if (ok) {
        msg.success(data?.message ?? 'Product saved');
        hideDialog();
        fetchData();
      } else {
        msg.error(data?.message ?? data?.error ?? 'Failed to save product');
      }
    } catch (err) {
      msg.error(err?.response?.data?.message ?? 'Failed to save product');
    }
  };

  const isStandardOnly = product.type === 'standard';
  const showCostPrice = product.type !== 'digital' && product.type !== 'service';

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton type="add-new" method={openNew} showText btnText="Add Product" />
        </div>
      </div>

      <FormModal
        moduleName={isEdit ? 'Edit Product' : 'Add Product'}
        modalState={showModalState}
        toggleFormModal={hideDialog}
        width="90%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
           

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Product Type <span className="text-danger">*</span></label>
                <select name="type" value={product.type} onChange={handleChange} className="form-control" required>
                  {PRODUCT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Product Name <span className="text-danger">*</span></label>
                <input type="text" name="name" className="form-control" value={product.name} onChange={handleChange} required />
              </div>
              <div className="col-md-4 form-group">
                <label>Product Code <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input type="text" name="code" className="form-control" value={product.code} onChange={handleChange} required />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={generateCode} title="Generate">
                      <SafeFontAwesomeIcon icon={faSyncAlt} size="sm" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 form-group">
                <label>Alt Product Code <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input type="text" name="alt_code" className="form-control" value={product.alt_code} onChange={handleChange} required />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={generateAltCode} title="Generate">
                      <SafeFontAwesomeIcon icon={faSyncAlt} size="sm" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 form-group">
                <label>Barcode Symbology <span className="text-danger">*</span></label>
                <select name="barcode_symbology" value={product.barcode_symbology} onChange={handleChange} className="form-control" required>
                  {BARCODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {product.type === 'digital' && (
                <div className="col-md-4 form-group">
                  <label>Attach File</label>
                  <input type="file" name="file" className="form-control" ref={fileInputRef} />
                </div>
              )}
            </div>

            {product.type === 'combo' && (
              <div className="row col-md-12 mb-2">
                <div className="col-md-6 form-group">
                  <label>Add product to combo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type product code or name..."
                    value={comboSearchQuery}
                    onChange={(e) => setComboSearchQuery(e.target.value)}
                  />
                  {comboSearchResults.length > 0 && (
                    <ul className="list-group mt-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {comboSearchResults.map((item, i) => (
                        <li
                          key={i}
                          className="list-group-item list-group-item-action cursor-pointer"
                          onClick={() => addComboProduct(item)}
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  {comboSearching && <small className="text-muted">Searching...</small>}
                </div>
                <div className="col-md-12 table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Wastage %</th>
                        <th>Qty</th>
                        <th>Unit Cost</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comboProducts.map((row, i) => (
                        <tr key={i}>
                          <td>{row.name} [{row.code}]</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={row.wastage_percent}
                              onChange={(e) => updateComboProduct(i, 'wastage_percent', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="1"
                              value={row.qty}
                              onChange={(e) => updateComboProduct(i, 'qty', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              step="any"
                              value={row.unit_cost}
                              onChange={(e) => updateComboProduct(i, 'unit_cost', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              step="any"
                              value={row.unit_price}
                              onChange={(e) => updateComboProduct(i, 'unit_price', e.target.value)}
                            />
                          </td>
                          <td>{row.subtotal}</td>
                          <td>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeComboProduct(i)}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Brand</label>
                <select name="brand_id" value={product.brand_id} onChange={handleChange} className="form-control">
                  <option value="">Select Brand...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.title ?? b.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Category <span className="text-danger">*</span></label>
                <select name="category_id" value={product.category_id} onChange={handleChange} className="form-control" required>
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isStandardOnly && (
              <div className="row">
                <div className="col-md-4 form-group">
                  <label>Product Unit <span className="text-danger">*</span></label>
                  <select name="unit_id" value={product.unit_id} onChange={handleChange} className="form-control" required>
                    <option value="">Select Product Unit...</option>
                    {baseUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.unit_name ?? u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 form-group">
                  <label>Sale Unit</label>
                  <select name="sale_unit_id" value={product.sale_unit_id} onChange={handleChange} className="form-control">
                    <option value="">—</option>
                    {saleUnits.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 form-group">
                  <label>Purchase Unit</label>
                  <select name="purchase_unit_id" value={product.purchase_unit_id} onChange={handleChange} className="form-control">
                    <option value="">—</option>
                    {saleUnits.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {showCostPrice && (
              <div className="row">
                <div className="col-md-4 form-group">
                  <label>Product Cost <span className="text-danger">*</span></label>
                  <input type="number" name="cost" className="form-control" step="any" value={product.cost} onChange={handleChange} required={product.type === 'standard'} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Profit margin type</label>
                  <select name="profit_margin_type" value={product.profit_margin_type} onChange={handleChange} className="form-control">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
                <div className="col-md-4 form-group">
                  <label>Profit Margin</label>
                  <input type="number" name="profit_margin" className="form-control" step="0.01" value={product.profit_margin} onChange={handleChange} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Product Price <span className="text-danger">*</span></label>
                  <input type="number" name="price" className="form-control" step="any" value={product.price} onChange={handleChange} required={product.type === 'standard'} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Wholesale Price</label>
                  <input type="number" name="wholesale_price" className="form-control" step="any" value={product.wholesale_price} onChange={handleChange} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Daily Sale Objective</label>
                  <input type="number" name="daily_sale_objective" className="form-control" step="any" value={product.daily_sale_objective} onChange={handleChange} />
                </div>
                {product.type === 'standard' && (
                  <div className="col-md-4 form-group">
                    <label>Alert Quantity</label>
                    <input type="number" name="alert_quantity" className="form-control" step="any" value={product.alert_quantity} onChange={handleChange} />
                  </div>
                )}
              </div>
            )}

            <div className="row">
              <div className="col-md-4 form-group">
                <label>Product Tax</label>
                <select name="tax_id" value={product.tax_id} onChange={handleChange} className="form-control">
                  <option value="">No Tax</option>
                  {(taxList || []).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Tax Method</label>
                <select name="tax_method" value={product.tax_method} onChange={handleChange} className="form-control">
                  <option value="1">Exclusive</option>
                  <option value="2">Inclusive</option>
                </select>
              </div>
              <div className="col-md-4 form-group">
                <label>Warranty</label>
                <div className="d-flex gap-1">
                  <input type="number" name="warranty" min="1" className="form-control" placeholder="e.g. 1" value={product.warranty} onChange={handleChange} style={{ width: '50%' }} />
                  <select name="warranty_type" value={product.warranty_type} onChange={handleChange} className="form-control" style={{ width: '50%' }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4 form-group">
                <label>Guarantee</label>
                <div className="d-flex gap-1">
                  <input type="number" name="guarantee" min="1" className="form-control" placeholder="e.g. 1" value={product.guarantee} onChange={handleChange} style={{ width: '50%' }} />
                  <select name="guarantee_type" value={product.guarantee_type} onChange={handleChange} className="form-control" style={{ width: '50%' }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12"><strong className="text-muted">Additional options</strong></div>
            </div>
            {!product.is_batch && !product.is_imei && (
              <div className="row">
                <div className="col-md-6 form-group form-check mt-2">
                  <input type="checkbox" name="featured" id="featured" className="form-check-input" checked={product.featured} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="featured">Featured (display in POS)</label>
                </div>
              </div>
            )}
            <div className="row">
              <div className="col-md-6 form-group form-check mt-2">
                <input type="checkbox" name="is_embeded" id="is_embeded" className="form-check-input" checked={product.is_embeded} onChange={handleChange} />
                <label className="form-check-label" htmlFor="is_embeded">Embedded Barcode (weight scale)</label>
              </div>
            </div>
            {product.type !== 'combo' && (
              <div className="row">
                <div className="col-md-6 form-group form-check mt-2">
                  <input type="checkbox" name="is_initial_stock" id="is_initial_stock" className="form-check-input" checked={product.is_initial_stock} onChange={handleChange} disabled={product.is_variant || product.is_batch || product.is_imei} />
                  <label className="form-check-label" htmlFor="is_initial_stock">Initial Stock (not for variants/batch/IMEI)</label>
                </div>
              </div>
            )}
            {isStandardOnly && (
              <>
                <div className="row">
                  <div className="col-md-6 form-group form-check mt-2">
                    <input type="checkbox" name="is_variant" id="is_variant" className="form-check-input" checked={product.is_variant} onChange={handleChange} disabled={product.is_initial_stock} />
                    <label className="form-check-label" htmlFor="is_variant">This product has variant (size, color, etc.)</label>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group form-check mt-2">
                    <input type="checkbox" name="is_diffPrice" id="is_diffPrice" className="form-check-input" checked={product.is_diffPrice} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="is_diffPrice">Different price per warehouse</label>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group form-check mt-2">
                    <input type="checkbox" name="is_batch" id="is_batch" className="form-check-input" checked={product.is_batch} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="is_batch">Batch and expired date</label>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 form-group form-check mt-2">
                    <input type="checkbox" name="is_imei" id="is_imei" className="form-check-input" checked={product.is_imei} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="is_imei">IMEI or Serial numbers</label>
                  </div>
                </div>
              </>
            )}
            <div className="row">
              <div className="col-md-6 form-group form-check mt-2">
                <input type="checkbox" name="promotion" id="promotion" className="form-check-input" checked={product.promotion} onChange={handleChange} />
                <label className="form-check-label" htmlFor="promotion">Add Promotional Price</label>
              </div>
            </div>

            {product.promotion && (
              <div className="row">
                <div className="col-md-4 form-group">
                  <label>Promotional Price</label>
                  <input type="number" name="promotion_price" className="form-control" step="any" value={product.promotion_price} onChange={handleChange} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Promotion Starts</label>
                  <input type="date" name="starting_date" className="form-control" value={product.starting_date} onChange={handleChange} />
                </div>
                <div className="col-md-4 form-group">
                  <label>Promotion Ends</label>
                  <input type="date" name="ending_date" className="form-control" value={product.ending_date} onChange={handleChange} />
                </div>
              </div>
            )}

            {product.is_initial_stock && warehouses.length > 0 && (
              <div className="row col-md-12 mt-2">
                <label className="col-12">Initial Stock (per warehouse)</label>
                <div className="table-responsive col-12">
                  <table className="table table-sm">
                    <thead><tr><th>Warehouse</th><th>Qty</th></tr></thead>
                    <tbody>
                      {initialStocks.map((row, i) => (
                        <tr key={i}>
                          <td>{row.name}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min="0"
                              value={row.stock}
                              onChange={(e) => updateInitialStock(i, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {product.is_diffPrice && warehouses.length > 0 && (
              <div className="row col-md-12 mt-2">
                <label className="col-12">Different price per warehouse</label>
                <div className="table-responsive col-12">
                  <table className="table table-sm">
                    <thead><tr><th>Warehouse</th><th>Price</th></tr></thead>
                    <tbody>
                      {diffPrices.map((row, i) => (
                        <tr key={i}>
                          <td>{row.name}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              step="any"
                              value={row.price}
                              onChange={(e) => updateDiffPrice(i, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {product.is_variant && (
              <div className="row col-md-12 mt-2">
                <div className="col-12"><strong className="text-muted">Variant options</strong></div>
                {variantOptions.map((opt, i) => (
                  <div key={i} className="row col-12 align-items-end mb-2">
                    <div className="col-md-4 form-group">
                      <label>Option (e.g. Size, Color)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Size, Color..."
                        value={opt.option}
                        onChange={(e) => updateVariantOption(i, 'option', e.target.value)}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label>Values (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="S, M, L"
                        value={opt.value}
                        onChange={(e) => updateVariantOption(i, 'value', e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeVariantOption(i)} disabled={variantOptions.length <= 1}>Remove</button>
                    </div>
                  </div>
                ))}
                <div className="col-12 mb-2">
                  <button type="button" className="btn btn-sm btn-info" onClick={addVariantOption}>Add more variant option</button>
                </div>
                {variantTable.length > 0 && (
                  <div className="col-12 table-responsive">
                    <table className="table table-sm">
                      <thead><tr><th>Variant</th><th>Item Code</th><th>Additional Cost</th><th>Additional Price</th></tr></thead>
                      <tbody>
                        {variantTable.map((row, i) => (
                          <tr key={i}>
                            <td>{row.variant_name}</td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={row.item_code}
                                onChange={(e) => updateVariantRow(i, 'item_code', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                step="any"
                                value={row.additional_cost}
                                onChange={(e) => updateVariantRow(i, 'additional_cost', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                step="any"
                                value={row.additional_price}
                                onChange={(e) => updateVariantRow(i, 'additional_price', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {product.type !== 'digital' && (
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/*" className="form-control" ref={imageInputRef} />
              </div>
            )}

            <div className="form-group">
              <label>Product Details</label>
              <textarea name="product_details" className="form-control" rows={3} value={product.product_details} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={hideDialog}>
              <SafeFontAwesomeIcon icon={faTimes} className="mr-2" size="sm" />
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SafeFontAwesomeIcon icon={isEdit ? faCheck : faPlus} className="mr-2" size="sm" />
              {isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </FormModal>

      <br />
      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={() => fetchData()}
        actionsColumn
        showEditButton
        showDeleteButton={false}
        resetSearch={() => fetchData()}
        rowKey="id"
      />
    </div>
  );
};

export default Items;
