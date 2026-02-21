import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader,
  SDD,
  SystemButton,
  ListSelection,
  FormModal,
  CustomerListSelection,
} from '../../../components';
import { api, cookie, msg } from '../../../services';
import ForfeitPurchasePrintA4Half from '../../../printouts/ForfeitPurchasePrintA4Half';

const CustomerStatement = () => {
  // Module name
  const moduleName = 'Customer Statement';
  const moduleNameMore = 'Sales Details';

  /* --- Route params --- */

  /* --- End of route params --- */

  /* --- State declarations --- */

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',
    mobile_no: '',

    customer_id: '',
    nicno: '',
    cusname: '',
    address: '',
    email: '',
    title: '',

    details: [],
  });

  const [billDetails, setBillDetails] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    id:'',
    pay_note:'',
    bc_no:'',
    tot_amount:'',
    details: [],
  });

  const [salesDetails, setSalesDetails] = useState({
   total_sales: 0.00,
   total_weight: 0.00,
   last_bill_no:'',
   last_bill_date:'',
   last_bill_amount:'',
   branch:''
  });

  const [customerData, setCustomerData] = useState({
    branch_code: '',
    customer_id: '',
    customer_no: '',
    cusname: '',
    nicno: '',
    address: '',
    telNo: '',
    mobile: '',
    email: '',
    notes: '',
    is_blacklisted: 0,
  });

  const [customerDet, setCustomerDet] = useState([
    {
      branch_code: '',
      customer_id: '',
      customer_no: '',
      cusname: '',
      nicno: '',
      address: '',
      telNo: '',
      mobile: '',
      email: '',
      notes: '',
      is_blacklisted: 0,
      branch: '',
    },
  ]);



  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [showModalState, setShowModalState] = useState(false);

  useEffect(() => {
    setNewData({
      ...newData,
      customer_id: customerData.customer_id,
      nicno: customerData.nicno,
      cusname: customerData.cusname,
      address: customerData.address,
      mobile_no: customerData.mobile,
    });
  }, [customerData]);

  /* ---  End of List Selection Required ---- */
  /* --- Customer List Selection Required ---- */
  const [viewCustomerListSelection, setViewCustomerListSelection] =
    useState(false);
  const showCustomerListSelection = () => {
    setViewCustomerListSelection(!viewCustomerListSelection);
  };

  const selectCustomer = (dataObj) => {
    setCustomerData({ ...dataObj, branch_code: dataObj.bc });
  };
  /* --- Component functions --- */

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const getCustomer = (e) => {
    if (e.key === 'F2') {
    showCustomerListSelection();
    }
  };

  const searchCustomer = async () => {
    try {
      const response = await api
        .post(`get_customer_by_nic`)
        .values({ nic: newData.mobile_no });

      if (response.data.customer === null) {
        msg.warning(
          'There is no customer exist for entered Mobile No. Please check the Mobile No or create new by clicking Add button.',
        );
        setNewData({
          ...newData,
          customer_id: '',
          nicno: '',
          cusname: '',
          address: '',
          mobile: '',
        });
      } else {
        setCustomerDet({
          ...customerDet,
          customer_id: response.data.customer.customer_id,
          cusname: response.data.customer.cusname,
          address: response.data.customer.address,
          nicno: response.data.customer.nicno,
          title: response.data.customer.title,
          mobile: newData.mobile_no,
          branch: response.data.customer.branch.name,
        });
      }
    } catch (error) {
      console.log(error);
      return msg.error('Unable to get customer details.');
    }
  };

  const getCustomerSalesDetails = async (customer_id) => {
    try {
      const response = await api
        .post(`get_customer_sales_details`)
        .values({ customer_id: customer_id });

        setSalesDetails({
            ...salesDetails,
            total_sales: response.data.customer_sales.tot_amount,
            last_bill_no:response.data.customer_last_bill.id,
            last_bill_date:response.data.customer_last_bill.ddate,
            last_bill_amount:response.data.customer_last_bill.tot_amount,
            total_weight: response.data.customer_sales.tot_weight,
            branch : response.data.customer_last_bill.bc_no
        });

        toggleMoreModal();
    } catch (error) {
      console.log(error);
      return msg.warning('This customer has not any bills.');
    }
  };

  const toggleMoreModal = () => {
    setShowModalState(!showModalState);

    // if(!showModalState){
    //     resetAll();
    // }
  };

  const getBillDetails = async (bill_no ,branch) => {
    try {
        const response = await api
          .post(`get_bill_details`)
          .values({ bill_no: bill_no, branch:branch });

        //   setBillDetails

        let dataObj = response.data.bill_details;

        const details = response.data.bill_details.details.map((item) => {
            return { ...item, index: uuidv4() };
        });

        dataObj.details = details;

        setBillDetails(dataObj);
  
      } catch (error) {
        console.log(error);
        return msg.error('Unable to get customer details.');
      }
  };

  const resetAll = () => {
      setNewData({
        ...newData,
        customer_id: '',
        nicno: '',
        cusname: '',
        address: '',
        mobile: '',
      });

      setSalesDetails({
        ...salesDetails,
        total_sales: 0.00,
        total_weight: 0.00,
        last_bill_no:'',
        last_bill_date:'',
        last_bill_amount:'',
        branch:''
      });

      setCustomerData({
        ...customerData,
        branch_code: '',
         customer_id: '',
         customer_no: '',
         cusname: '',
         nicno: '',
         address: '',
         telNo: '',
         mobile: '',
         email: '',
         notes: '',
         is_blacklisted: 0,
      });

      setSalesDetails({
        ...salesDetails,
        total_sales: 0.00,
        total_weight: 0.00,
        last_bill_no:'',
        last_bill_date:'',
        last_bill_amount:'',
        branch:''
      });

    //   setCustomerDet({
    //     ...customerDet,
    //         branch_code: '',
    //        customer_id: '',
    //        customer_no: '',
    //        cusname: '',
    //        nicno: '',
    //        address: '',
    //        telNo: '',
    //        mobile: '',
    //        email: '',
    //        notes: '',
    //        is_blacklisted: 0,
    //        branch: '',
    //   });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <CustomerListSelection
        toggleFormModal={showCustomerListSelection}
        showModalState={viewCustomerListSelection}
        selectRow={selectCustomer}
      />
      <br />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9 pl-0">
              <div className=" row ">
                <label htmlFor="mobile_no" className="col-sm-2 col-form-label ">
                  Customer
                </label>
                <div className="col-sm-4 ">
                  <input
                    name="mobile_no"
                    id="mobile_no"
                    className="form-control form-control-sm "
                    maxLength="10"
                    placeholder="Mobile No"
                    autoComplete="off"
                    value={newData.mobile_no}
                    onKeyDown={getCustomer}
                    onChange={handleValueChanges}
                  />
                </div>
                <div className="col-sm-2">
                  <SystemButton
                    type="search2"
                    method={searchCustomer}
                    showText
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-3">
            <table className="table table-bordered table-hover">
              <thead className="thead-light">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Customer ID</th>
                  <th scope="col">Customer Name</th>
                  <th scope="col">Address</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">Added Branch</th>
                </tr>
              </thead>
              <tbody>
                <tr className="pe-auto shadow-sm cursor-pointer"
                  key={customerDet.customer_id}
                  onClick={() =>
                    getCustomerSalesDetails(customerDet.customer_id)
                  }
                >
                  <td scope="row">1</td>
                  <td>{customerDet.customer_id}</td>
                  <td>{customerDet.cusname}</td>
                  <td>{customerDet.address}</td>
                  <td>{customerDet.mobile}</td>
                  <td>{customerDet.branch}</td>
                </tr>
              </tbody>
            </table>
          </div>      
        </div>
      )}

    <FormModal
        moduleName={moduleNameMore}
        modalState={showModalState}
        toggleFormModal={toggleMoreModal}
        width="50%"
      >
        {/* <form onSubmit={handleSubmit} className="compactForm">
        </form> */}
        <div>
          <div className="modal-body">
            

          <div className="row mt-3">
            <div className="col-sm-12">
            <h3 className="card-subtitle mb-2 text-muted">{customerDet.cusname} - ({customerDet.customer_id})</h3>
            <h5 className="card-subtitle mb-2 text-muted">{customerDet.address}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{customerDet.mobile}</h6>
            </div>
            <div className="col-sm-6">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Total Sales Amount</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Total Weight : {salesDetails.total_weight}
                  </h6>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Total Amount : {salesDetails.total_sales}
                  </h6>
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="card" onClick={() =>
                    getBillDetails(salesDetails.last_bill_no , salesDetails.branch)
                  }>
                <div className="card-body">
                  <h5 className="card-title">Last Bill</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Bill No     : {salesDetails.last_bill_no}
                  </h6>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Bill Date   : {salesDetails.last_bill_date}
                  </h6>
                  <h6 className="card-subtitle mb-2 text-muted">
                    Bill Amount : {salesDetails.last_bill_amount}
                  </h6>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="col-sm-12">
              <table className="table table-bordered table-hover">
                <thead className="thead-light">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Tag No</th>
                    <th scope="col">Weight</th>
                    <th scope="col">Price</th>
                    <th scope="col">Agree Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {billDetails.details ? (
                    billDetails.details.map((item, index) => {
                      return (
                        <tr
                        //   key={item.item_id}
                        //   onClick={() => clickOnPurchaseDetails(item)}
                        >
                          <td scope="row">{index + 1}</td>
                          <td>{item.tag_no}</td>
                          <td className="text-right">{item.weight}</td>
                          <td className="text-right">{item.price}</td>
                          <td className="text-right">{item.agree_rate}</td>
                        </tr>
                      );
                    })
                  ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No data
                      </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleMoreModal}
              showText={true}
            />
          </div>
        </div>
      </FormModal>
      <br />
      <br />
    </div>
  );

  /* --- End of component renders --- */
};

export default CustomerStatement;
