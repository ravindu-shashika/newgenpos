import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    PageLayout,
    FormField,
    FormRow,
    TextareaInput,
    SelectInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';

function formatLanguage(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.code || value.language || '';
    return String(value);
}

function normalizePhone(phone) {
    return String(phone ?? '').replace(/\D/g, '');
}

function buildInitialSelection(receivers, selectedGroup, selectedPhone) {
    const groups = Object.entries(receivers || {});
    if (!groups.length) return [];

    if (selectedGroup && selectedPhone) {
        const digits = normalizePhone(selectedPhone);
        const groupItems = receivers[selectedGroup] || [];
        if (groupItems.some((item) => normalizePhone(item.phone) === digits)) {
            return [`${selectedGroup}:${digits}`];
        }
        return [];
    }

    const [firstGroup, firstItems] = groups[0];
    if (firstItems?.[0]) {
        return [`${firstGroup}:${normalizePhone(firstItems[0].phone)}`];
    }
    return [];
}

function ReceiverPicker({ receivers, selected, onChange }) {
    const toggleReceiver = (group, phone) => {
        const key = `${group}:${phone}`;
        onChange(
            selected.includes(key)
                ? selected.filter((item) => item !== key)
                : [...selected, key]
        );
    };

    const toggleGroup = (group, items) => {
        const keys = items.map((item) => `${group}:${normalizePhone(item.phone)}`);
        const allSelected = keys.every((key) => selected.includes(key));
        if (allSelected) {
            onChange(selected.filter((key) => !keys.includes(key)));
        } else {
            onChange([...new Set([...selected, ...keys])]);
        }
    };

    return (
        <div
            className="ui-card"
            style={{
                maxHeight: 280,
                overflowY: 'auto',
                padding: '12px 16px',
            }}
        >
            {Object.entries(receivers).map(([group, items]) => {
                const keys = items.map((item) => `${group}:${normalizePhone(item.phone)}`);
                const allSelected = keys.length > 0 && keys.every((key) => selected.includes(key));

                return (
                    <div key={group} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong style={{ fontSize: '0.85rem' }}>{group}</strong>
                            <button
                                type="button"
                                className="ui-btn sm secondary"
                                onClick={() => toggleGroup(group, items)}
                            >
                                {allSelected ? 'Clear group' : 'Select all'}
                            </button>
                        </div>
                        <div className="d-flex flex-column gap-1">
                            {items.map((item) => {
                                const digits = normalizePhone(item.phone);
                                const key = `${group}:${digits}`;
                                return (
                                    <label
                                        key={key}
                                        className="d-flex align-items-center gap-2"
                                        style={{ fontSize: '0.9rem', cursor: 'pointer' }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="ui-chk"
                                            checked={selected.includes(key)}
                                            onChange={() => toggleReceiver(group, digits)}
                                        />
                                        <span>{item.name} ({item.phone})</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {Object.keys(receivers).length === 0 && (
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    No customers or suppliers with WhatsApp numbers found.
                </p>
            )}
        </div>
    );
}

export default function WhatsappSend() {
    const location = useLocation();
    const { toast, showToast } = useToast();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [receivers, setReceivers] = useState({});
    const [templateOptions, setTemplateOptions] = useState([]);
    const [selectedReceivers, setSelectedReceivers] = useState([]);
    const [templateInfo, setTemplateInfo] = useState('');
    const [message, setMessage] = useState('');
    const [attachmentType, setAttachmentType] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const templateSelected = Boolean(templateInfo);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(location.search);
                const query = params.toString();
                const res = await api.get(`whatsapp/send${query ? `?${query}` : ''}`);
                const data = res.data ?? {};

                const receiverMap = data.receivers ?? {};
                setReceivers(receiverMap);
                setSelectedReceivers(
                    buildInitialSelection(
                        receiverMap,
                        data.selected_group,
                        data.selected_phone
                    )
                );

                const templates = Array.isArray(data.templates) ? data.templates : [];
                setTemplateOptions([
                    { value: '', label: 'No template — type message' },
                    ...templates.map((tpl) => {
                        const lang = formatLanguage(tpl.language);
                        return {
                            value: `${tpl.name}|${lang}`,
                            label: `${tpl.name} (${lang})`,
                        };
                    }),
                ]);

                if (data.error) {
                    setLoadError(data.error);
                }
            } catch (err) {
                const msg = err?.message || 'Failed to load send message form.';
                setLoadError(msg);
                showToast(msg, 'error');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [location.search, showToast]);

    const openAttachmentPicker = (type) => {
        setAttachmentType(type);
        if (fileInputRef.current) {
            if (type === 'image') {
                fileInputRef.current.accept = '.jpg,.jpeg,.png,.gif,.webp';
            } else {
                fileInputRef.current.removeAttribute('accept');
            }
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        setAttachmentFile(file);
        if (!file) {
            setAttachmentType('');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormErrors({});

        const phones = selectedReceivers.map((key) => key.split(':')[1]).filter(Boolean);
        if (!phones.length) {
            showToast('Select at least one receiver.', 'warning');
            return;
        }

        if (!templateSelected && !message.trim() && !attachmentFile) {
            showToast('Enter a message, choose a template, or attach a file.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            phones.forEach((phone) => formData.append('receiver_phone[]', phone));
            formData.append('_from_form', '1');

            if (templateSelected) {
                formData.append('template_info', templateInfo);
            } else {
                if (message.trim()) {
                    formData.append('message', message);
                }
                if (attachmentFile) {
                    formData.append('attachment', attachmentFile);
                    formData.append('attachment_type', attachmentType || 'document');
                }
            }

            await api.post('whatsapp/send', formData);
            showToast('Message sent successfully.', 'success');
            setMessage('');
            setTemplateInfo('');
            setAttachmentFile(null);
            setAttachmentType('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            if (err?.errors && typeof err.errors === 'object') {
                setFormErrors(err.errors);
            }
            showToast(err?.message || 'Failed to send message.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectedCount = selectedReceivers.length;

    return (
        <PageLayout title="Send WhatsApp Message">
            <Toast toast={toast} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                <Link to="/whatsapp/settings" className="ui-btn secondary sm">
                    WhatsApp Settings
                </Link>
                <Link to="/whatsapp/templates" className="ui-btn secondary sm">
                    Message Templates
                </Link>
            </div>

            {loadError && (
                <div className="ui-card mb-3" style={{ padding: '12px 16px' }}>
                    <p className="mb-0 text-warning" style={{ fontSize: '0.9rem' }}>{loadError}</p>
                    {loadError.toLowerCase().includes('credential') && (
                        <Link to="/whatsapp/settings" className="ui-btn sm secondary mt-2">
                            Configure credentials
                        </Link>
                    )}
                </div>
            )}

            {loading ? (
                <p className="text-muted">Loading…</p>
            ) : (
                <form onSubmit={handleSubmit} className="ui-card" style={{ padding: '20px 24px', maxWidth: 960 }}>
                    <FormRow>
                        <FormField
                            label={`Receiver${selectedCount ? ` (${selectedCount} selected)` : ''}`}
                            error={formErrors.receiver_phone?.[0]}
                        >
                            <ReceiverPicker
                                receivers={receivers}
                                selected={selectedReceivers}
                                onChange={setSelectedReceivers}
                            />
                        </FormField>
                        <FormField label="Template">
                            <SelectInput
                                value={templateInfo}
                                onChange={(e) => {
                                    setTemplateInfo(e.target.value);
                                    if (e.target.value) {
                                        setAttachmentFile(null);
                                        setAttachmentType('');
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }
                                }}
                                options={templateOptions}
                            />
                        </FormField>
                    </FormRow>

                    {!templateSelected && (
                        <>
                            <FormField label="Message">
                                <TextareaInput
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Type your message…"
                                />
                            </FormField>

                            <FormField label="Attachment">
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <button
                                        type="button"
                                        className="ui-btn secondary sm"
                                        onClick={() => openAttachmentPicker('image')}
                                    >
                                        Image
                                    </button>
                                    <button
                                        type="button"
                                        className="ui-btn secondary sm"
                                        onClick={() => openAttachmentPicker('document')}
                                    >
                                        Document
                                    </button>
                                    {attachmentFile && (
                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                            {attachmentFile.name}
                                        </span>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="d-none"
                                    onChange={handleFileChange}
                                />
                            </FormField>
                        </>
                    )}

                    <div className="mt-4">
                        <button type="submit" className="ui-btn primary" disabled={saving || Boolean(loadError)}>
                            {saving ? 'Sending…' : 'Send'}
                        </button>
                    </div>
                </form>
            )}
        </PageLayout>
    );
}
