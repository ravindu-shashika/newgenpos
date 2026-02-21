import React, { useState, useEffect } from 'react';
import { api, msg, cookie, auth } from '../../../services';

const UpdateProfile = () => {
  const moduleName = 'Update User Profile';

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [password, setPassword] = useState({
    current_pass: '',
    new_pass: '',
    confirm_pass: '',
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMatchMessage, setPasswordMatchMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (password.new_pass && password.confirm_pass) {
      setPasswordMatchMessage(
        password.new_pass === password.confirm_pass ? 'Password matches!' : "Password doesn't match!"
      );
    } else {
      setPasswordMatchMessage('');
    }
  }, [password.new_pass, password.confirm_pass]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('user/profile');
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const d = data.data;
        setProfile({
          name: d.name ?? '',
          email: d.email ?? '',
          phone: d.phone ?? '',
          company_name: d.company_name ?? '',
        });
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setProfileLoaded(true);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name?.trim()) {
      msg.error('User name is required');
      return;
    }
    if (!profile.email?.trim()) {
      msg.error('Email is required');
      return;
    }
    if (!profile.phone?.trim()) {
      msg.error('Phone number is required');
      return;
    }
    setProfileSubmitting(true);
    try {
      const res = await api.post('user/profile-update').values(profile);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Profile updated successfully');
        if (cookie.get('user_name') !== profile.name) {
          cookie.set('user_name', profile.name, { path: '/' });
        }
      } else {
        msg.error(data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Update failed'));
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || (d?.errors ? Object.values(d.errors).flat().join(' ') : 'Update failed'));
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.current_pass) {
      msg.error('Current password is required');
      return;
    }
    if (!password.new_pass) {
      msg.error('New password is required');
      return;
    }
    if (password.new_pass !== password.confirm_pass) {
      msg.error('Please confirm your new password');
      return;
    }
    if (password.new_pass.length < 6) {
      msg.error('New password must be at least 6 characters');
      return;
    }
    setPasswordSubmitting(true);
    try {
      const res = await api.post('user/change-password').values({
        current_pass: password.current_pass,
        new_pass: password.new_pass,
        confirm_pass: password.confirm_pass,
      });
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Password updated. Please sign in again.');
        auth.clearLocalStorage().then(() => {
          window.location.reload();
        });
      } else {
        msg.error(data?.message || 'Password change failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Password change failed');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!profileLoaded) {
    return (
      <div className="text-center p-4">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <section className="forms">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header d-flex align-items-center">
                  <h4>Update User Profile</h4>
                </div>
                <div className="card-body">
                  <p className="italic">
                    <small>The field labels marked with * are required input fields.</small>
                  </p>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>User Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="name"
                            required
                            className="form-control"
                            value={profile.name}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email <span className="text-danger">*</span></label>
                          <input
                            type="email"
                            name="email"
                            required
                            className="form-control"
                            value={profile.email}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="phone"
                            required
                            className="form-control"
                            value={profile.phone}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="form-group">
                          <label>Company Name</label>
                          <input
                            type="text"
                            name="company_name"
                            className="form-control"
                            value={profile.company_name}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="form-group">
                          <button type="submit" className="btn btn-primary" disabled={profileSubmitting}>
                            {profileSubmitting ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header d-flex align-items-center">
                  <h4>Change Password</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Current Password <span className="text-danger">*</span></label>
                          <input
                            type="password"
                            name="current_pass"
                            required
                            className="form-control"
                            value={password.current_pass}
                            onChange={handlePasswordChange}
                            autoComplete="current-password"
                          />
                        </div>
                        <div className="form-group">
                          <label>New Password <span className="text-danger">*</span></label>
                          <input
                            type="password"
                            name="new_pass"
                            required
                            className="form-control"
                            value={password.new_pass}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                          />
                        </div>
                        <div className="form-group">
                          <label>Confirm Password <span className="text-danger">*</span></label>
                          <input
                            type="password"
                            name="confirm_pass"
                            id="confirm_pass"
                            required
                            className="form-control"
                            value={password.confirm_pass}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                          />
                        </div>
                        <div className="form-group">
                          <div className="registrationFormAlert" id="divCheckPasswordMatch">
                            {passwordMatchMessage && (
                              <span className={password.new_pass === password.confirm_pass ? 'text-success' : 'text-danger'}>
                                {passwordMatchMessage}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <button type="submit" className="btn btn-primary" disabled={passwordSubmitting || password.new_pass !== password.confirm_pass}>
                            {passwordSubmitting ? 'Submitting...' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UpdateProfile;
