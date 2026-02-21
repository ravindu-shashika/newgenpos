import React, { useState, useEffect, useRef } from 'react';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { api, msg } from '../../services';
import { SafeFontAwesomeIcon } from '../../components';

const moduleName = 'Create SMS';

const CreateSms = () => {
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('create-sms-data');
      const data = res?.data;
      if (data?.status === 200 && data?.data) {
        setSmsTemplates(data.data.sms_templates || []);
        setCustomers(data.data.customers || []);
      }
    } catch (err) {
      msg.error(err?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setTemplateId(id);
    const template = smsTemplates.find((t) => String(t.id) === id);
    if (template && template.content) {
      setMessage(template.content);
    } else {
      setMessage('');
    }
  };

  const getFilteredCustomers = () => {
    const term = (customerSearch || '').trim().toLowerCase();
    if (!term || term.length < 1) return [];
    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone_number || '').toLowerCase();
      return name.includes(term) || phone.includes(term);
    });
  };

  const addCustomerPhone = (customer) => {
    const phone = customer.phone_number ? customer.phone_number.trim() : '';
    if (!phone) return;
    const current = mobile.trim();
    const numbers = current ? current.split(',').map((n) => n.trim()).filter(Boolean) : [];
    if (numbers.includes(phone)) {
      msg.warning('This number is already added');
      return;
    }
    setMobile(numbers.length ? [...numbers, phone].join(',') : phone);
    setCustomerSearch('');
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mobileTrim = mobile.replace(/\s/g, '').trim();
    if (!mobileTrim) {
      msg.error('Mobile number(s) are required');
      return;
    }
    if (!message.trim()) {
      msg.error('Message is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('send-sms').values({
        message: message.trim(),
        mobile: mobileTrim,
      });
      const data = res?.data;
      if (res?.status === 200 && data?.status === 200) {
        msg.success(data?.message || 'SMS sent successfully');
        setMessage('');
        setMobile('');
        setTemplateId('');
      } else {
        msg.error(data?.message || 'Failed to send SMS');
      }
    } catch (err) {
      const d = err?.response?.data;
      msg.error(d?.message || 'Failed to send SMS');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = getFilteredCustomers();

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
                  <h4>Create SMS</h4>
                </div>
                <div className="card-body">
                  <p className="italic">
                    <small>
                      The field labels marked with * are required. <strong>Add mobile numbers by selecting the customers.</strong>
                    </small>
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label>SMS Template</label>
                          <select
                            name="template_id"
                            className="form-control"
                            value={templateId}
                            onChange={handleTemplateChange}
                          >
                            <option value="">Select Template</option>
                            {smsTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group position-relative" ref={suggestionRef}>
                          <label>Customer search</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type customer name or mobile no and select"
                            value={customerSearch}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => filteredCustomers.length > 0 && setShowSuggestions(true)}
                          />
                          {showSuggestions && filteredCustomers.length > 0 && (
                            <ul
                              className="list-group mt-1"
                              style={{ maxHeight: 200, overflowY: 'auto', position: 'absolute', zIndex: 10, width: '100%' }}
                            >
                              {filteredCustomers.slice(0, 20).map((c) => (
                                <li
                                  key={c.id}
                                  className="list-group-item list-group-item-action"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => addCustomerPhone(c)}
                                  onKeyDown={(e) => e.key === 'Enter' && addCustomerPhone(c)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  {c.name} [{c.phone_number}]
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Mobile <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            name="mobile"
                            className="form-control"
                            placeholder="e.g. +8801*********,+8801*********"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Message <span className="text-danger">*</span></label>
                          <textarea
                            name="message"
                            className="form-control message"
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <button type="submit" className="btn btn-primary" disabled={submitting}>
                            <SafeFontAwesomeIcon icon={faPaperPlane} className="mr-2" size="sm" />
                            {submitting ? 'Sending...' : 'Send SMS'}
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

export default CreateSms;
