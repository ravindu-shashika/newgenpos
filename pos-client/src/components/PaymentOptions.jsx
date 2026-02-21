import React, { useState, useEffect } from 'react';
import { api } from '../services';

// TODO: Set values of the parent component to be updated via these 👇 props

const PaymentOptions = ({
  onChangeEvent,
  cashAmount,
  chequeAmount,
  cardAmount,
  totalPay,
  bank,
  bankBranch,
  bankAccount,
  chequeNo,
  chequeDate,
  cardNumber,
  cardProvider,
  cardType,
  cardExpDate,
}) => {
  /* --- State declarationss --- */

  const [bankBranches, setBankBranches] = useState([]);

  const [bankAccounts, setBankAccounts] = useState([]);

  const [cardProviders, setCardProviders] = useState([]);

  const [cardTypes, setCardTypes] = useState([]);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    const response = await api.get('payment-details');

    setBankBranches(response.data.bank_branches);
  };

  const formatValues = async (e) => {
    return null;
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div className="container">
      <h6>
        <strong>Payments</strong>
      </h6>
      <div className="row">
        {/* Payments */}
        <div className="col-md-4">
          {/* Cash pay */}
          <div className="form-group row">
            <label
              htmlFor="cash"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Cash amount
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="cash"
                id="cash"
                value={cashAmount}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Cheque pay */}
          <div className="form-group row">
            <label
              htmlFor="cheque"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Cheque amount
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="cheque"
                id="cheque"
                value={chequeAmount}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Card pay */}
          <div className="form-group row">
            <label
              htmlFor="card"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Card amount
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="card"
                id="card"
                value={cardAmount}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Total pay */}
          {/* // TODO: Cal total payment upon entering values on ☝ fileds */}
          {/* Try this 👉 Add a function similer to the HandleValueChange and do all the edits to the input values there, then assign them to variables */}
          <div className="form-group row">
            <label
              htmlFor="total_pay"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Total amount
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="total_pay"
                id="total_pay"
                value={totalPay}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
        {/* Cheque details */}
        <div className="col-md-4">
          {/* Bank Branch */}
          <div className="form-group row">
            <label
              htmlFor="bank_branch"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Bank Branch
            </label>
            <div className="col-sm-6">
              <select
                name="bank_branch"
                id="bank_branch"
                className="form-control form-control-sm"
                value={bankBranch}
                onChange={onChangeEvent}
              >
                <option
                  value=""
                  className="dropdown-item text-muted text-light"
                  disabled
                >
                  -- Select bank branch
                </option>
                {bankBranches.map((branch) => {
                  return (
                    <option
                      className="dropdown-item"
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.des}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          {/* Bank account */}
          <div className="form-group row">
            <label
              htmlFor="bank_account"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Bank Account
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="bank_account"
                id="bank_account"
                value={bankAccount}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Cheque number */}
          <div className="form-group row">
            <label
              htmlFor="cheque_no"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Cheque No
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="cheque_no"
                id="cheque_no"
                value={chequeNo}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Cheque date */}
          <div className="form-group row">
            <label
              htmlFor="cheque_date"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Cheque Date
            </label>
            <div className="col-sm-6">
              <input
                type="date"
                name="cheque_date"
                id="cheque_date"
                value={chequeDate}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
        {/* Card details */}
        <div className="col-md-4">
          {/* Card number */}
          <div className="form-group row">
            <label
              htmlFor="card_no"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Card No
            </label>
            <div className="col-sm-6">
              <input
                type="number"
                name="card_no"
                id="card_no"
                value={cardNumber}
                onChange={onChangeEvent}
                className="form-control form-control-sm text-right"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {/* Card expiration date */}
          // TODO: format card exp date into MM/YY on keyup
          <div className="form-group row">
            <label
              htmlFor="exp_date"
              className="col-sm-5 offset-1 col-form-label col-form-label-sm"
            >
              Exp Date
            </label>
            <div className="col-sm-6">
              <input
                type="text"
                name="exp_date"
                id="exp_date"
                value={cardExpDate}
                onChange={onChangeEvent}
                onKeyUp={formatValues}
                className="form-control form-control-sm text-right"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default PaymentOptions;
