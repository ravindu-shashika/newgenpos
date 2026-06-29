import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    PageLayout,
    FormField,
    FormRow,
    NumberInput,
    SelectInput,
    TextareaInput,
    Toast,
    useToast,
} from '../../../../components/ui';
import api from '../../../../services/api';

const METHOD_OPTIONS = [
    { value: '0', label: 'Cash' },
    { value: '1', label: 'Cheque' },
    { value: '2', label: 'Credit Card' },
];

const STATUS_OPTIONS = [
    { value: 'final', label: 'Final' },
    { value: 'draft', label: 'Draft' },
];

function calcTotal(salary, commission, overtime, expense) {
    return (Number(salary) || 0) + (Number(commission) || 0) + (Number(overtime) || 0) - (Number(expense) || 0);
}

function parsePayrollRowDate(value) {
    if (!value) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = value.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return new Date().toISOString().slice(0, 10);
}

function buildInitialRows(employees) {
    const rows = {};
    employees.forEach((emp) => {
        const p = emp.existing_payroll || {};
        const salary = p.salary ?? 0;
        const commission = p.commission ?? 0;
        const expense = p.expense ?? 0;
        const overtime = p.overtime ?? 0;
        rows[emp.id] = {
            employee_id: emp.id,
            salary_amount: String(salary),
            commission: String(commission),
            expense: String(expense),
            overtime: String(overtime),
            amount: String(p.total_amount || calcTotal(salary, commission, overtime, expense)),
            paying_method: String(p.method ?? '0'),
            status: p.status || 'draft',
            created_at: parsePayrollRowDate(p.date),
            note: p.note || '',
        };
    });
    return rows;
}

const PayrollGenerate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const payload = location.state;
    const { toast, showToast } = useToast();

    const [accountId, setAccountId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupStatus, setGroupStatus] = useState('draft');
    const [rows, setRows] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!payload?.employees?.length) {
            navigate('/payroll', { replace: true });
            return;
        }

        const monthLabel = payload.month
            ? new Date(`${payload.month}-01`).toLocaleString(undefined, { month: 'long', year: 'numeric' })
            : '';
        setGroupName(`Payroll for ${monthLabel}`);
        setRows(buildInitialRows(payload.employees));

        const defaultAccount = payload.accounts?.find((a) => a.is_default) || payload.accounts?.[0];
        if (defaultAccount) setAccountId(String(defaultAccount.id));
    }, [payload, navigate]);

    const accountOptions = useMemo(
        () => (payload?.accounts || []).map((a) => ({
            value: String(a.id),
            label: `${a.name}${a.account_no ? ` [${a.account_no}]` : ''}`,
        })),
        [payload]
    );

    const monthLabel = useMemo(() => {
        if (!payload?.month) return '';
        try {
            return new Date(`${payload.month}-01`).toLocaleString(undefined, { month: 'long', year: 'numeric' });
        } catch {
            return payload.month;
        }
    }, [payload]);

    const patchRow = (employeeId, patch) => {
        setRows((prev) => {
            const current = prev[employeeId] || {};
            const next = { ...current, ...patch };
            next.amount = String(calcTotal(next.salary_amount, next.commission, next.overtime, next.expense).toFixed(2));
            return { ...prev, [employeeId]: next };
        });
    };

    const handleSubmit = async () => {
        if (!accountId) {
            showToast('Please select an account.', 'error');
            return;
        }

        const payrolls = {};
        Object.entries(rows).forEach(([id, row]) => {
            payrolls[id] = {
                employee_id: Number(row.employee_id),
                salary_amount: Number(row.salary_amount),
                commission: Number(row.commission),
                expense: Number(row.expense),
                overtime: Number(row.overtime),
                amount: Number(row.amount),
                paying_method: row.paying_method,
                status: row.status,
                created_at: row.created_at,
                note: row.note,
            };
        });

        try {
            setSaving(true);
            const res = await api.post('payroll/store-multiple', {
                month: payload.month,
                warehouse_id: payload.warehouse_id,
                account_id: Number(accountId),
                payroll_group_name: groupName,
                payroll_group_status: groupStatus,
                payrolls,
            });
            showToast(res.data?.message || 'Payrolls saved.', 'success');
            navigate('/payroll');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save payrolls.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!payload?.employees?.length) {
        return null;
    }

    return (
        <PageLayout
            title="Generate Payroll"
            actions={
                <>
                    <button type="button" className="ui-btn ghost" onClick={() => navigate('/payroll')}>
                        Back to List
                    </button>
                    <button type="button" className="ui-btn primary" disabled={saving} onClick={handleSubmit}>
                        {saving ? 'Saving…' : 'Submit All Payrolls'}
                    </button>
                </>
            }
        >
            <Toast toast={toast} />

            <div className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
                <h4 style={{ marginTop: 0 }}>Payroll for {monthLabel}</h4>
                <p style={{ color: 'var(--ui-muted)', marginBottom: 16 }}>
                    Location: {payload.warehouse_name || 'All Warehouse'}
                </p>
                <FormRow cols={2}>
                    <FormField label="Payroll Group Name" required>
                        <input className="ui-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    </FormField>
                    <FormField label="Account" required>
                        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)} options={accountOptions} />
                    </FormField>
                    <FormField label="Group Status">
                        <SelectInput value={groupStatus} onChange={(e) => setGroupStatus(e.target.value)} options={STATUS_OPTIONS} />
                    </FormField>
                </FormRow>
            </div>

            {payload.employees.map((emp) => {
                const row = rows[emp.id] || {};
                return (
                    <div key={emp.id} className="ui-card" style={{ padding: 16, marginBottom: 16 }}>
                        <h5 style={{ marginTop: 0 }}>{emp.name}</h5>
                        <p style={{ color: 'var(--ui-muted)', fontSize: '0.85rem' }}>
                            Leaves: {emp.total_leaves} days · Work: {emp.total_work_hours} hours · Attendance: {emp.attendance_days} days
                        </p>
                        <FormRow cols={2}>
                            <FormField label="Salary">
                                <NumberInput step="0.01" value={row.salary_amount || ''} onChange={(e) => patchRow(emp.id, { salary_amount: e.target.value })} />
                            </FormField>
                            <FormField label="Overtime">
                                <NumberInput step="0.01" value={row.overtime || ''} onChange={(e) => patchRow(emp.id, { overtime: e.target.value })} />
                            </FormField>
                            <FormField label="Commission">
                                <NumberInput step="0.01" value={row.commission || ''} onChange={(e) => patchRow(emp.id, { commission: e.target.value })} />
                            </FormField>
                            <FormField label="Expenses">
                                <NumberInput step="0.01" value={row.expense || ''} onChange={(e) => patchRow(emp.id, { expense: e.target.value })} />
                            </FormField>
                            <FormField label="Total Payable">
                                <input className="ui-input" readOnly value={row.amount || ''} />
                            </FormField>
                            <FormField label="Status">
                                <SelectInput value={row.status || 'draft'} onChange={(e) => patchRow(emp.id, { status: e.target.value })} options={STATUS_OPTIONS} />
                            </FormField>
                            <FormField label="Method">
                                <SelectInput value={row.paying_method || '0'} onChange={(e) => patchRow(emp.id, { paying_method: e.target.value })} options={METHOD_OPTIONS} />
                            </FormField>
                            <FormField label="Date">
                                <input type="date" className="ui-input" value={row.created_at || ''} onChange={(e) => patchRow(emp.id, { created_at: e.target.value })} />
                            </FormField>
                            <FormField label="Note" span2>
                                <TextareaInput value={row.note || ''} onChange={(e) => patchRow(emp.id, { note: e.target.value })} rows={2} />
                            </FormField>
                        </FormRow>
                    </div>
                );
            })}
        </PageLayout>
    );
};

export default PayrollGenerate;
