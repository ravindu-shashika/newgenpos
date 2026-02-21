import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, SystemButton } from '../../../components';

const CustomerForm = ({
  toggleFormModal,
  showModalState,
  customerData,
  updateCustomerData,
}) => {
  //Module name
  const moduleName = 'Customers';

  /* --- State declarationss --- */

  const [newData, setNewData] = useState({
    branch_code: '',
    customer_id: '',
    customer_no: '',
    cusname: '',
    nicno: '',
    address: '',
    telNo: '',
    mobile: '',
    email:'',
    notes: '',
    is_blacklisted: 0,
    branch_id: cookie.get('user_branch'),
    user_id: cookie.get('user_id'),
  });

  /* --- End of state declarations --- */

  useEffect(() => {
    updateCustomerData(
      newData.branch_code,
      newData.customer_id,
      newData.customer_no,
      newData.cusname,
      newData.nicno,
      newData.address,
      newData.telNo,
      newData.mobile,
      newData.email,
      newData.notes,
      newData.is_blacklisted,
    );
  }, [newData]);

  useEffect(() => {
    if (showModalState === true) {
      setInitialData();
    }
  }, [showModalState]);

  const setInitialData = () => {
    setNewData({
      ...newData,
      branch_code: customerData.branch_code,
      customer_id: customerData.branch_code + '-' + customerData.customer_no,
      customer_no: customerData.customer_no,
      cusname: customerData.cusname,
      nicno: customerData.nicno,
      address: customerData.address,
      telNo: customerData.telNo,
      mobile: customerData.mobile,
      email: customerData.email,
      notes: customerData.notes,
    });
  };

  /* --- Component functions --- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    await submitData();

    // setNewData({
    //   cusname: '',
    //   nicno: '',
    //   address: '',
    //   telNo: '', 
    //   mobile: '',
    //   notes: '',
    //   is_blacklisted: 0,
    //   branch_id: cookie.get('user_branch'),
    //   user_id: cookie.get('user_id'),
    // });
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    console.log(inputName , inputValue);

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const submitData = async () => {
    try {
      const response = await api.post('customers').values(newData);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      msg.success(response.data);
    } catch (error) {
      msg.error(error);
      return console.error(error);
    }
  };

  const resetForm = () => {
    setNewData({
      cusname: '',
      nicno: '',
      address: '',
      telNo: '',
      mobile: '',
      email: '',
      notes: '',
      is_blacklisted: 0,
      branch_id: cookie.get('user_branch'),
      user_id: cookie.get('user_id'),
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <FormModal
      moduleName={moduleName}
      modalState={showModalState}
      toggleFormModal={toggleFormModal}
      width={'50%'}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="row">
            <label htmlFor="nicno" className="col-sm-2 col-form-label">
              NIC
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                name="nicno"
                id="nicno"
                maxLength="20"
                minLength="10"
                className="form-control form-control-sm"
                value={newData.nicno}
                onChange={handleValueChange}
                // required
              />
            </div>
            <label
              htmlFor="customer_id"
              className="col-sm-2 col-form-label text-right"
            >
              Code
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                id="customer_id"
                name="customer_id"
                className="form-control form-control-sm"
                placeholder="Customer Name"
                readOnly
                value={newData.customer_id}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className="row">
            <label htmlFor="cusname" className="col-sm-2 col-form-label">
              Name
            </label>
            <div className="col-sm-10">
              <input
                type="text"
                id="cusname"
                name="cusname"
                className="form-control form-control-sm"
                placeholder="Customer Name"
                maxLength="100"
                value={newData.cusname}
                onChange={handleValueChange}
              />
            </div>
          </div>

          <div className="row">
            <label htmlFor="address" className="col-sm-2 col-form-label">
              Address
            </label>
            <div className="col-sm-10">
              <textarea
                id="address"
                name="address"
                className="form-control form-control-sm mb-1"
                rows="2"
                maxLength="200"
                placeholder="Postal Address"
                value={newData.address}
                onChange={handleValueChange}
              ></textarea>
            </div>
          </div>

          <div className=" row"></div>
          <div className=" row">
            <label htmlFor="telNo" className="col-sm-2 col-form-label">
              Telephone No
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                name="telNo"
                id="telNo"
                maxLength="20"
                minLength="9"
                className="form-control form-control-sm"
                value={newData.telNo}
                onChange={handleValueChange}
              />
            </div>
            <label
              htmlFor="mobile"
              className="col-sm-2 col-form-label text-right"
            >
              Mobile
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                name="mobile"
                id="mobile"
                maxLength="20"
                minLength="9"
                className="form-control form-control-sm "
                value={newData.mobile}
                onChange={handleValueChange}
              />
            </div>
          </div>

          <div className=" row">
            <label htmlFor="email" className="col-sm-2 col-form-label">
              Email
            </label>
            <div className="col-sm-4">
              <input
                type="text"
                name="email"
                id="email"
                maxLength="20"
                minLength="9"
                className="form-control form-control-sm"
                value={newData.email}
                onChange={handleValueChange}
              />
            </div>
          </div>
          <div className=" row">
            <label htmlFor="notes" className="col-sm-2 col-form-label">
              Notes
            </label>
            <div className="col-sm-10">
              <textarea
                name="notes"
                id="notes"
                rows="2"
                maxLength="200"
                className="form-control form-control-sm mb-1"
                value={newData.notes}
                onChange={handleValueChange}
              ></textarea>
            </div>
          </div>

          <div className="row">
            <div className="offset-2 col-sm-4">
              <div className="">
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className={
                      newData.is_blacklisted
                        ? `custom-control-input is-invalid`
                        : `custom-control-input is-valid`
                    }
                    id="is_blacklisted"
                    name="is_blacklisted"
                    checked={newData.is_blacklisted}
                    onChange={handleValueChange}
                  />
                  <label
                    className="custom-control-label"
                    htmlFor="is_blacklisted"
                  >
                    {newData.is_blacklisted ? `Blacklisted` : `Not blacklisted`}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleFormModal}
            showText={true}
          />
          {/* <SystemButton type={'save'} showText={true} /> */}
        </div>
      </form>
    </FormModal>
  );

  /* --- End of component renders --- */
};

export default CustomerForm;
