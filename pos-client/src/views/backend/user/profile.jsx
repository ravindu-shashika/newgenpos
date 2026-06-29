import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
    PageLayout,
    FormField,
    TextInput,
    Toast,
    useToast,
} from '../../../components/ui';
import { api } from '../../../services';
import authService from '../../../services/auth';
import authStore from '../../../stores/authStore';
import usePermissions from '../../../stores/usePermissions';

const EMPTY_PROFILE = {
    name: '',
    email: '',
    phone: '',
    company_name: '',
};

const EMPTY_PASSWORD = {
    current_pass: '',
    new_pass: '',
    confirm_pass: '',
};

const UserProfile = ({ controllerName }) => {
    const ctrl = controllerName || 'user-profile';
    const { id: routeId } = useParams();
    const navigate = useNavigate();

    const currentUser = authStore.getUser();
    const userId = routeId || currentUser?.id;
    const isOwnProfile = currentUser && userId && String(currentUser.id) === String(userId);

    const { canEdit: permEdit } = usePermissions(ctrl);
    const canEdit = isOwnProfile || permEdit;

    const [profile, setProfile] = useState(EMPTY_PROFILE);
    const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD);
    const [profileErrors, setProfileErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordHint, setPasswordHint] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const { toast, showToast } = useToast();

    const setProfileField = (name) => (e) =>
        setProfile((p) => ({ ...p, [name]: e.target.value }));

    const setPasswordField = (name) => (e) => {
        const value = e.target.value;
        setPasswordForm((p) => {
            const next = { ...p, [name]: value };
            if (name === 'new_pass' || name === 'confirm_pass') {
                if (next.new_pass && next.confirm_pass && next.new_pass !== next.confirm_pass) {
                    setPasswordHint("Password doesn't match!");
                } else if (next.new_pass && next.confirm_pass && next.new_pass === next.confirm_pass) {
                    setPasswordHint('Password matches!');
                } else {
                    setPasswordHint('');
                }
            }
            return next;
        });
    };

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await api.get(`user/profile/${userId}`);
            const data = res.data?.data ?? res.data ?? {};
            setProfile({
                name: data.name || data.username || '',
                email: data.email || '',
                phone: data.phone || '',
                company_name: data.company_name || '',
            });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to load profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validateProfile = () => {
        const errors = {};
        if (!profile.name?.trim()) errors.name = 'Username is required.';
        if (!profile.email?.trim()) errors.email = 'Email is required.';
        if (!profile.phone?.trim()) errors.phone = 'Phone number is required.';
        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePassword = () => {
        const errors = {};
        if (!passwordForm.current_pass) errors.current_pass = 'Current password is required.';
        if (!passwordForm.new_pass) errors.new_pass = 'New password is required.';
        if (!passwordForm.confirm_pass) errors.confirm_pass = 'Confirm password is required.';
        else if (passwordForm.new_pass !== passwordForm.confirm_pass) {
            errors.confirm_pass = 'Passwords do not match.';
        }
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!canEdit || !validateProfile()) return;
        try {
            setSavingProfile(true);
            const res = await api.put(`user/update_profile/${userId}`, profile);
            const updated = res.data?.data;
            if (updated) {
                setProfile({
                    name: updated.name || updated.username || '',
                    email: updated.email || '',
                    phone: updated.phone || '',
                    company_name: updated.company_name || '',
                });
                authStore.setUser({ ...currentUser, ...updated });
            }
            showToast(res.data?.message || 'Profile updated successfully.', 'success');
        } catch (err) {
            if (err.response?.data?.errors) setProfileErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (!canEdit || !validatePassword()) return;
        try {
            setSavingPassword(true);
            const res = await api.put(`user/changepass/${userId}`, passwordForm);
            showToast(res.data?.message || 'Password changed successfully.', 'success');
            setPasswordForm(EMPTY_PASSWORD);
            setPasswordHint('');
            if (res.data?.logout) {
                await authService.signOutUser();
                navigate('/login');
            }
        } catch (err) {
            if (err.response?.data?.errors) setPasswordErrors(err.response.data.errors);
            else showToast(err.response?.data?.message || 'Failed to change password.', 'error');
        } finally {
            setSavingPassword(false);
        }
    };

    const pageTitle = useMemo(
        () => (loading ? 'User Profile' : `User Profile${profile.name ? ` — ${profile.name}` : ''}`),
        [loading, profile.name]
    );

    if (!userId) {
        return (
            <PageLayout title="User Profile">
                <p>No user selected.</p>
            </PageLayout>
        );
    }

    return (
        <PageLayout title={pageTitle}>
            <Toast toast={toast} />

            {loading ? (
                <p>Loading profile…</p>
            ) : (
                <div className="ui-form-grid two" style={{ alignItems: 'start' }}>
                    <section className="ui-card" style={{ padding: 20 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Update User Profile</h3>
                        <p className="ui-modal-hint" style={{ marginBottom: 16 }}>
                            Fields marked with * are required.
                        </p>
                        <form onSubmit={handleProfileSave}>
                            <FormField label="Username" required error={profileErrors.name}>
                                <TextInput
                                    value={profile.name}
                                    onChange={setProfileField('name')}
                                    required
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Email" required error={profileErrors.email}>
                                <TextInput
                                    type="email"
                                    value={profile.email}
                                    onChange={setProfileField('email')}
                                    required
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Phone Number" required error={profileErrors.phone}>
                                <TextInput
                                    value={profile.phone}
                                    onChange={setProfileField('phone')}
                                    required
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Company Name" error={profileErrors.company_name}>
                                <TextInput
                                    value={profile.company_name}
                                    onChange={setProfileField('company_name')}
                                    disabled={!canEdit}
                                />
                            </FormField>
                            {canEdit && (
                                <button type="submit" className="ui-btn primary" disabled={savingProfile}>
                                    {savingProfile ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </form>
                    </section>

                    <section className="ui-card" style={{ padding: 20 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Change Password</h3>
                        <form onSubmit={handlePasswordSave}>
                            <FormField label="Current Password" required error={passwordErrors.current_pass}>
                                <TextInput
                                    type="password"
                                    value={passwordForm.current_pass}
                                    onChange={setPasswordField('current_pass')}
                                    autoComplete="current-password"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="New Password" required error={passwordErrors.new_pass}>
                                <TextInput
                                    type="password"
                                    value={passwordForm.new_pass}
                                    onChange={setPasswordField('new_pass')}
                                    autoComplete="new-password"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            <FormField label="Confirm Password" required error={passwordErrors.confirm_pass}>
                                <TextInput
                                    type="password"
                                    value={passwordForm.confirm_pass}
                                    onChange={setPasswordField('confirm_pass')}
                                    autoComplete="new-password"
                                    disabled={!canEdit}
                                />
                            </FormField>
                            {passwordHint && (
                                <p
                                    className="ui-help-text"
                                    style={{
                                        color: passwordHint.includes("doesn't") ? '#e74c3c' : '#27ae60',
                                        marginBottom: 12,
                                    }}
                                >
                                    {passwordHint}
                                </p>
                            )}
                            {canEdit && (
                                <button type="submit" className="ui-btn primary" disabled={savingPassword}>
                                    {savingPassword ? 'Saving…' : 'Submit'}
                                </button>
                            )}
                        </form>
                    </section>
                </div>
            )}
        </PageLayout>
    );
};

export default UserProfile;
