import React, { useState, useEffect } from 'react';
import { api, msg } from '../../services';

const moduleName = 'Reward Point Setting';

const DURATION_TYPES = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

const defaultForm = {
  is_active: false,
  per_point_amount: '',
  minimum_amount: '',
  duration: '',
  type: 'days',
  redeem_amount_per_unit_rp: '',
  min_order_total_for_redeem: '',
  min_redeem_point: '',
  max_redeem_point: '',
};

const RewardPointSetting = () => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('settings/reward-point');
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        const s = data.data;
        setForm({
          is_active: !!s.is_active,
          per_point_amount: s.per_point_amount != null ? String(s.per_point_amount) : '',
          minimum_amount: s.minimum_amount != null ? String(s.minimum_amount) : '',
          duration: s.duration != null ? String(s.duration) : '',
          type: s.type || 'days',
          redeem_amount_per_unit_rp: s.redeem_amount_per_unit_rp != null ? String(s.redeem_amount_per_unit_rp) : '',
          min_order_total_for_redeem: s.min_order_total_for_redeem != null ? String(s.min_order_total_for_redeem) : '',
          min_redeem_point: s.min_redeem_point != null ? String(s.min_redeem_point) : '',
          max_redeem_point: s.max_redeem_point != null ? String(s.max_redeem_point) : '',
        });
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load reward point setting');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.per_point_amount === '' || form.per_point_amount === null) {
      msg.error('Sold amount per point is required');
      return;
    }
    if (form.minimum_amount === '' || form.minimum_amount === null) {
      msg.error('Minimum sold amount to get point is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        per_point_amount: parseFloat(form.per_point_amount) || 0,
        minimum_amount: parseFloat(form.minimum_amount) || 0,
        duration: form.duration !== '' ? (parseInt(form.duration, 10) || null) : null,
        type: form.type,
        redeem_amount_per_unit_rp: form.redeem_amount_per_unit_rp !== '' ? (parseFloat(form.redeem_amount_per_unit_rp) || 0) : null,
        min_order_total_for_redeem: form.min_order_total_for_redeem !== '' ? (parseFloat(form.min_order_total_for_redeem) || 0) : null,
        min_redeem_point: form.min_redeem_point !== '' ? (parseInt(form.min_redeem_point, 10) || 0) : null,
        max_redeem_point: form.max_redeem_point !== '' ? (parseInt(form.max_redeem_point, 10) || 0) : null,
      };
      if (form.is_active) payload.is_active = true;
      const res = await api.post('settings/reward-point').values(payload);
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'Reward point setting saved');
        fetchData();
      } else {
        msg.error(data?.message || 'Save failed');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <p>Loading...</p>
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
            <div className="col-md-12">
              <div className="card">
                <div className="card-header d-flex align-items-center">
                  <h4>Reward Point Setting</h4>
                </div>
                <div className="card-body">
                  <p className="italic">
                    <small>The field labels marked with * are required input fields.</small>
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-3 mt-3">
                        <div className="form-group">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleChange}
                          />
                          &nbsp;
                          <label title="Check this box to activate reward points feature.">
                            Active reward point
                          </label>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label title="This means how much point customer will get according to sold amount. For example, if you put 100 then for every 100 spent customer will get one point as reward.">
                            Sold amount per point <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="per_point_amount"
                            className="form-control"
                            value={form.per_point_amount}
                            onChange={handleChange}
                            required
                            step="any"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label title="Customer will only get points if order total reaches this amount.">
                            Minimum sold amount to get point <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="minimum_amount"
                            className="form-control"
                            value={form.minimum_amount}
                            onChange={handleChange}
                            required
                            step="any"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label title="Duration after which the earned reward points will expire.">
                            Point Expiry Duration
                          </label>
                          <input
                            type="number"
                            name="duration"
                            className="form-control"
                            value={form.duration}
                            onChange={handleChange}
                            min="0"
                            placeholder="Duration"
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label title="Select whether the expiry duration is in days, months, or years.">
                            Duration Type
                          </label>
                          <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                            {DURATION_TYPES.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <hr />

                    <div className="row well mt-4">
                      <div className="col-sm-12">
                        <h4>Redeem Points Settings:</h4>
                      </div>
                      <div className="col-sm-4">
                        <div className="form-group">
                          <label title="How much monetary value each reward point can be redeemed for.">
                            Redeem amount per unit point
                          </label>
                          <input
                            type="text"
                            name="redeem_amount_per_unit_rp"
                            className="form-control"
                            placeholder="Redeem amount per unit point"
                            value={form.redeem_amount_per_unit_rp}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="form-group">
                          <label title="Customer can only redeem points if order total reaches this minimum amount.">
                            Minimum order total to redeem points
                          </label>
                          <input
                            type="text"
                            name="min_order_total_for_redeem"
                            className="form-control"
                            placeholder="Minimum order total to redeem points"
                            value={form.min_order_total_for_redeem}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="form-group">
                          <label title="Minimum number of points that must be available to redeem.">
                            Minimum redeem point
                          </label>
                          <input
                            type="number"
                            name="min_redeem_point"
                            className="form-control"
                            placeholder="Minimum redeem point"
                            value={form.min_redeem_point}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="col-sm-4">
                        <div className="form-group">
                          <label title="If a maximum redeem limit is set, you cannot redeem more than the allowed maximum points. If the limit is set to 0, then unlimited points can be redeemed.">
                            Maximum redeem point per order
                          </label>
                          <input
                            type="number"
                            name="max_redeem_point"
                            className="form-control"
                            placeholder="Maximum redeem point per order"
                            value={form.max_redeem_point}
                            onChange={handleChange}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-12 form-group mt-4">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Submit'}
                      </button>
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

export default RewardPointSetting;
