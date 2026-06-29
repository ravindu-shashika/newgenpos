import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const InfoIcon = () => (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ display: "inline", verticalAlign: "middle", marginLeft: 4, color: "#3b82f6" }}>
        <circle cx="8" cy="8" r="6" />
        <line x1="8" y1="7" x2="8" y2="11" />
        <circle cx="8" cy="5" r="0.5" fill="currentColor" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="8" y1="13" x2="8" y2="3" /><polyline points="4 7 8 3 12 7" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="13" y1="8" x2="3" y2="8" /><polyline points="7 4 3 8 7 12" />
    </svg>
);

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
    const [show, setShow] = useState(false);
    return (
        <span style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <InfoIcon />
            {show && (
                <div style={{
                    position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
                    transform: "translateX(-50%)", background: "#1e293b", color: "#f8fafc",
                    fontSize: 11, padding: "6px 10px", borderRadius: 6,
                    zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,.2)",
                    maxWidth: 240, whiteSpace: "normal", textAlign: "center", lineHeight: 1.5,
                }}>
                    {text}
                    <div style={{
                        position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                        borderWidth: "5px 5px 0", borderStyle: "solid",
                        borderColor: "#1e293b transparent transparent",
                    }} />
                </div>
            )}
        </span>
    );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, required, children, tooltip }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{
                fontSize: 12, fontWeight: 600, letterSpacing: ".06em",
                textTransform: "uppercase", color: "var(--muted)",
            }}>
                {label}
                {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
                {tooltip && <Tooltip text={tooltip} />}
            </label>
            {children}
        </div>
    );
}

const baseInputStyle = {
    background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7,
    color: "var(--ink)", fontFamily: "inherit", fontSize: 13, padding: "9px 12px",
    outline: "none", width: "100%", transition: "border-color .15s, box-shadow .15s",
};

function NumInput({ addonIcon, focusColor = "#3b82f6", error, disabled, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: "flex", opacity: disabled ? 0.45 : 1 }}>
            {addonIcon && (
                <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRight: "none", borderRadius: "7px 0 0 7px",
                    padding: "0 11px", color: "var(--muted)",
                }}>
                    {addonIcon}
                </span>
            )}
            <input type="number" disabled={disabled}
                style={{
                    ...baseInputStyle,
                    borderColor: error ? "#ef4444" : focused ? focusColor : "var(--border)",
                    boxShadow: focused ? `0 0 0 3px ${error ? "rgba(239,68,68,.12)" : "rgba(59,130,246,.12)"}` : "none",
                    borderRadius: addonIcon ? "0 7px 7px 0" : 7,
                    cursor: disabled ? "not-allowed" : "auto",
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
        </div>
    );
}

function TextInput({ error, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <input type="text"
            style={{
                ...baseInputStyle,
                borderColor: error ? "#ef4444" : focused ? "#3b82f6" : "var(--border)",
                boxShadow: focused ? `0 0 0 3px ${error ? "rgba(239,68,68,.12)" : "rgba(59,130,246,.12)"}` : "none",
            }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            {...props}
        />
    );
}

function TextArea({ error, ...props }) {
    const [focused, setFocused] = useState(false);
    return (
        <textarea
            style={{
                ...baseInputStyle,
                borderColor: error ? "#ef4444" : focused ? "#3b82f6" : "var(--border)",
                boxShadow: focused ? "0 0 0 3px rgba(59,130,246,.12)" : "none",
                resize: "vertical", minHeight: 80,
            }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            {...props}
        />
    );
}

function CheckboxField({ id, checked, onChange, label, tooltip }) {
    return (
        <label style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            cursor: "pointer", fontSize: 13, userSelect: "none",
        }}>
            <span style={{
                width: 17, height: 17, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${checked ? "#3b82f6" : "var(--border)"}`,
                background: checked ? "#3b82f6" : "var(--surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
            }}>
                {checked && (
                    <svg width={10} height={10} viewBox="0 0 12 12" fill="none"
                        stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <polyline points="2 6 5 9 10 3" />
                    </svg>
                )}
            </span>
            <input type="checkbox" id={id} checked={checked} onChange={onChange}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
            {label}
            {tooltip && <Tooltip text={tooltip} />}
        </label>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
                textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap",
            }}>
                {children}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
    );
}

function Toast({ msg, type }) {
    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,.15)", animation: "toastIn .2s ease",
            background: type === "success" ? "#166534" : "#991b1b", color: "#fff",
        }}>
            {msg}
            <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

// ── Mock existing barcode data (replace with real prop/fetch) ─────────────────
const MOCK_BARCODE = {
    id: 7,
    name: "Standard A4 Label Sheet",
    description: "Default setting for A4 label sheets with 3 columns.",
    is_continuous: false,
    top_margin: 0.5,
    left_margin: 0.25,
    width: 2.625,
    height: 1.0,
    paper_width: 8.5,
    paper_height: 11.0,
    stickers_in_one_row: 3,
    row_distance: 0,
    col_distance: 0.125,
    stickers_in_one_sheet: 30,
    is_default: true,
};

// ── Main Component ────────────────────────────────────────────────────────────
// Props: barcode (object) — the existing record to edit.
// Falls back to MOCK_BARCODE if not provided.
export default function EditBarcodeSettings({ barcode = MOCK_BARCODE, onSubmit }) {
    const [form, setForm] = useState({
        name: barcode.name ?? "",
        description: barcode.description ?? "",
        is_continuous: !!barcode.is_continuous,
        top_margin: barcode.top_margin ?? 0,
        left_margin: barcode.left_margin ?? 0,
        width: barcode.width ?? "",
        height: barcode.height ?? "",
        paper_width: barcode.paper_width ?? "",
        paper_height: barcode.paper_height ?? "",
        stickers_in_one_row: barcode.stickers_in_one_row ?? "",
        row_distance: barcode.row_distance ?? 0,
        col_distance: barcode.col_distance ?? 0,
        stickers_in_one_sheet: barcode.stickers_in_one_sheet ?? "",
        is_default: !!barcode.is_default,
    });

    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState(null);

    const set = (field, value) => {
        setForm(f => {
            const next = { ...f, [field]: value };
            // Mirror jQuery toggle: when continuous is checked, clear & disable paper_height
            if (field === "is_continuous" && value) {
                next.paper_height = 0;
            }
            return next;
        });
        setErrors(e => ({ ...e, [field]: undefined }));
    };

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = "Name is required.";
        if (form.width === "" || Number(form.width) < 0.1) errs.width = "Min 0.1";
        if (form.height === "" || Number(form.height) < 0.1) errs.height = "Min 0.1";
        if (form.paper_width === "" || Number(form.paper_width) < 0.1) errs.paper_width = "Min 0.1";
        if (!form.is_continuous && (form.paper_height === "" || Number(form.paper_height) < 0.1))
            errs.paper_height = "Min 0.1";
        if (form.stickers_in_one_row === "" || Number(form.stickers_in_one_row) < 1)
            errs.stickers_in_one_row = "Min 1";
        if (!form.is_continuous && (form.stickers_in_one_sheet === "" || Number(form.stickers_in_one_sheet) < 1))
            errs.stickers_in_one_sheet = "Min 1";
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitted(true);

        // Simulate PUT /barcode/{id}
        const payload = { ...form, id: barcode.id, is_custom: 1 };
        if (onSubmit) {
            onSubmit(payload);
        } else {
            setTimeout(() => {
                setSubmitted(false);
                showToast("Barcode sticker setting updated successfully!");
            }, 1200);
        }
    };

    const css = `
    :root {
      --bg: #f8f7f4;
      --surface: #ffffff;
      --surface2: #f3f2ef;
      --border: rgba(0,0,0,.1);
      --ink: #111;
      --muted: #6b7280;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f0f0f;
        --surface: #1a1a1a;
        --surface2: #242424;
        --border: rgba(255,255,255,.1);
        --ink: #f0ede6;
        --muted: #9ca3af;
      }
    }
    .bc-edit-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
    .bc-edit-wrap {
      background: var(--bg); color: var(--ink);
      font-family: 'IBM Plex Mono', 'Fira Code', monospace;
      min-height: 100vh; padding: 32px 28px 64px;
    }
    .bc-edit-wrap button { font-family: inherit; }
    .bc-edit-wrap input[type=number]::-webkit-inner-spin-button,
    .bc-edit-wrap input[type=number]::-webkit-outer-spin-button { opacity: .5; }
    .bc-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; overflow: hidden; max-width: 820px; margin: 0 auto;
    }
    .bc-card-head {
      padding: 18px 24px; border-bottom: 2px solid var(--ink);
      background: var(--ink); display: flex; align-items: center; justify-content: space-between;
    }
    .bc-card-title { font-size: 16px; font-weight: 700; letter-spacing: -.02em; color: var(--bg); }
    .bc-id-badge {
      font-size: 11px; font-weight: 600; letter-spacing: .06em;
      background: rgba(255,255,255,.12); color: rgba(255,255,255,.7);
      border: 1px solid rgba(255,255,255,.15); border-radius: 5px;
      padding: 3px 10px;
    }
    .bc-card-body { padding: 28px 24px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
    .err { font-size: 11px; color: #ef4444; margin-top: 3px; }
    .divider { height: 1px; background: var(--border); margin: 24px 0; }
    .submit-row { display: flex; justify-content: center; padding-top: 8px; }
    .update-btn {
      background: var(--ink); border: none; border-radius: 8px;
      color: var(--bg); cursor: pointer; font-size: 14px; font-weight: 700;
      letter-spacing: .04em; padding: 12px 48px;
      transition: opacity .15s, transform .12s;
    }
    .update-btn:hover { opacity: .85; transform: translateY(-1px); }
    .update-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    .continuous-note {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(59,130,246,.08); border: 1px solid rgba(59,130,246,.2);
      border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #3b82f6;
      margin-bottom: 20px; line-height: 1.5;
    }
    .fade-in { animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  `;

    return (
        <>
            <style>{css}</style>
            <div className="bc-edit-wrap">
                <div className="bc-card">

                    {/* Header */}
                    <div className="bc-card-head">
                        <div className="bc-card-title">Edit Barcode Sticker Setting</div>
                        <div className="bc-id-badge">ID #{barcode.id}</div>
                    </div>

                    <div className="bc-card-body">
                        <form onSubmit={handleSubmit} noValidate>

                            {/* ── Basic Info ── */}
                            <SectionLabel>Basic Information</SectionLabel>
                            <div className="grid-1" style={{ marginBottom: 20 }}>
                                <Field label="Sticker Sheet Setting Name" required>
                                    <TextInput
                                        name="name"
                                        value={form.name}
                                        placeholder="Sticker Sheet Setting Name"
                                        error={errors.name}
                                        onChange={e => set("name", e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="err">{errors.name}</div>}
                                </Field>

                                <Field label="Sticker Sheet Setting Description">
                                    <TextArea
                                        name="description"
                                        value={form.description}
                                        placeholder="Sticker Sheet Setting Description"
                                        rows={3}
                                        onChange={e => set("description", e.target.value)}
                                    />
                                </Field>

                                <div>
                                    <CheckboxField
                                        id="is_continuous"
                                        checked={form.is_continuous}
                                        onChange={e => set("is_continuous", e.target.checked)}
                                        label="Continuous feed or rolls"
                                    />
                                </div>
                            </div>

                            {/* Continuous mode banner */}
                            {form.is_continuous && (
                                <div className="continuous-note fade-in">
                                    <svg width={14} height={14} viewBox="0 0 16 16" fill="none"
                                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                        style={{ flexShrink: 0, marginTop: 1 }}>
                                        <circle cx="8" cy="8" r="6" />
                                        <line x1="8" y1="7" x2="8" y2="11" />
                                        <circle cx="8" cy="5" r=".5" fill="currentColor" />
                                    </svg>
                                    Continuous feed mode — paper height and stickers per sheet are disabled.
                                </div>
                            )}

                            <div className="divider" />

                            {/* ── Margins ── */}
                            <SectionLabel>Margins (In Inches)</SectionLabel>
                            <div className="grid-2" style={{ marginBottom: 24 }}>
                                <Field label="Additional Top Margin" required>
                                    <NumInput
                                        name="top_margin"
                                        value={form.top_margin}
                                        min={0} step={0.00001}
                                        addonIcon={<ArrowUpIcon />}
                                        placeholder="0"
                                        onChange={e => set("top_margin", e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Additional Left Margin" required>
                                    <NumInput
                                        name="left_margin"
                                        value={form.left_margin}
                                        min={0} step={0.00001}
                                        addonIcon={<ArrowLeftIcon />}
                                        placeholder="0"
                                        onChange={e => set("left_margin", e.target.value)}
                                        required
                                    />
                                </Field>
                            </div>

                            <div className="divider" />

                            {/* ── Sticker Size ── */}
                            <SectionLabel>Sticker Size (In Inches)</SectionLabel>
                            <div className="grid-2" style={{ marginBottom: 24 }}>
                                <Field label="Width of Sticker" required>
                                    <NumInput
                                        name="width"
                                        value={form.width}
                                        min={0.1} step={0.00001}
                                        placeholder="e.g. 2.5"
                                        error={errors.width}
                                        onChange={e => set("width", e.target.value)}
                                        required
                                    />
                                    {errors.width && <div className="err">{errors.width}</div>}
                                </Field>
                                <Field label="Height of Sticker" required>
                                    <NumInput
                                        name="height"
                                        value={form.height}
                                        min={0.1} step={0.00001}
                                        placeholder="e.g. 1.0"
                                        error={errors.height}
                                        onChange={e => set("height", e.target.value)}
                                        required
                                    />
                                    {errors.height && <div className="err">{errors.height}</div>}
                                </Field>
                            </div>

                            <div className="divider" />

                            {/* ── Paper Size ── */}
                            <SectionLabel>Paper Size (In Inches)</SectionLabel>
                            <div className="grid-2" style={{ marginBottom: 24 }}>
                                <Field label="Paper Width" required>
                                    <NumInput
                                        name="paper_width"
                                        value={form.paper_width}
                                        min={0.1} step={0.00001}
                                        placeholder="e.g. 8.5"
                                        error={errors.paper_width}
                                        onChange={e => set("paper_width", e.target.value)}
                                        required
                                    />
                                    {errors.paper_width && <div className="err">{errors.paper_width}</div>}
                                </Field>

                                {/* Paper height — mirrors jQuery disabled logic */}
                                <Field label="Paper Height" required={!form.is_continuous}>
                                    <NumInput
                                        name="paper_height"
                                        value={form.is_continuous ? 0 : form.paper_height}
                                        min={0.1} step={0.00001}
                                        placeholder="e.g. 11.0"
                                        error={errors.paper_height}
                                        disabled={form.is_continuous}
                                        onChange={e => set("paper_height", e.target.value)}
                                        required={!form.is_continuous}
                                    />
                                    {errors.paper_height && <div className="err">{errors.paper_height}</div>}
                                </Field>
                            </div>

                            <div className="divider" />

                            {/* ── Layout ── */}
                            <SectionLabel>Layout</SectionLabel>
                            <div className="grid-2" style={{ marginBottom: 24 }}>
                                <Field label="Stickers in One Row" required>
                                    <NumInput
                                        name="stickers_in_one_row"
                                        value={form.stickers_in_one_row}
                                        min={1} step={1}
                                        placeholder="e.g. 3"
                                        error={errors.stickers_in_one_row}
                                        onChange={e => set("stickers_in_one_row", e.target.value)}
                                        required
                                    />
                                    {errors.stickers_in_one_row && <div className="err">{errors.stickers_in_one_row}</div>}
                                </Field>

                                {/* Stickers per sheet — hidden when continuous */}
                                <Field label="No. of Stickers per Sheet" required={!form.is_continuous}>
                                    <NumInput
                                        name="stickers_in_one_sheet"
                                        value={form.stickers_in_one_sheet}
                                        min={1} step={1}
                                        placeholder="e.g. 30"
                                        error={errors.stickers_in_one_sheet}
                                        disabled={form.is_continuous}
                                        onChange={e => set("stickers_in_one_sheet", e.target.value)}
                                        required={!form.is_continuous}
                                    />
                                    {errors.stickers_in_one_sheet && <div className="err">{errors.stickers_in_one_sheet}</div>}
                                </Field>
                            </div>

                            <div className="divider" />

                            {/* ── Spacing ── */}
                            <SectionLabel>Spacing Between Stickers (In Inches)</SectionLabel>
                            <div className="grid-2" style={{ marginBottom: 24 }}>
                                <Field label="Distance Between Two Rows" required>
                                    <NumInput
                                        name="row_distance"
                                        value={form.row_distance}
                                        min={0} step={0.00001}
                                        placeholder="0"
                                        onChange={e => set("row_distance", e.target.value)}
                                        required
                                    />
                                </Field>
                                <Field label="Distance Between Two Columns" required>
                                    <NumInput
                                        name="col_distance"
                                        value={form.col_distance}
                                        min={0} step={0.00001}
                                        placeholder="0"
                                        onChange={e => set("col_distance", e.target.value)}
                                        required
                                    />
                                </Field>
                            </div>

                            <div className="divider" />

                            {/* ── Default ── */}
                            <div style={{ marginBottom: 28 }}>
                                <CheckboxField
                                    id="is_default"
                                    checked={form.is_default}
                                    onChange={e => set("is_default", e.target.checked)}
                                    label="Set as default"
                                    tooltip="Setting this as default will set it for all future barcode printing."
                                />
                            </div>

                            {/* ── Submit ── */}
                            <div className="submit-row">
                                <button type="submit" className="update-btn" disabled={submitted}>
                                    {submitted ? "Updating…" : "Update"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} />}
        </>
    );
}