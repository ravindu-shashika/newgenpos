import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print } from '../../services';
import { FormModal, ListView, SystemButton, SDD } from '../../components';
import moment from 'moment';
import { SafeFontAwesomeIcon } from '../../components';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
// import { async } from 'exceljs/dist/exceljs';

const PendingRealizeCheques = () => {
  const [pendingRelizedChequeList, setPendingRelizedChequeList] = useState([]);

  const [selectedList, setSelectedList] = useState([]);

  const [isEdit, setIsEdit] = useState(false);

  const [buttonText, setButtonText] = useState('Realize');

  const [dissableButton, setDissableButton] = useState(true);

  const [newRecord, setNewRecord] = useState({
    branch_id: cookie.get('user_branch'),
    realized_batch_number: '',
    cheque_number: '',
    search_date: '',
    current_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedList.length > 0) {
      setDissableButton(false);
    } else {
      setDissableButton(true);
    }
  }, [selectedList]);

  const fetchData = async () => {
    //  * transaction date
    const trans_date = await api.get(`trans_date/${cookie.get('user_branch')}`);
    const batch_number = await api.get(
      `load-realize-batch-number/${cookie.get('user_branch')}`,
    );
    setNewRecord({
      ...newRecord,
      current_date: trans_date.data,
      search_date: trans_date.data,
      realized_batch_number: batch_number.data.data,
    });
  };

  const handleValaueChange = async (e) => {
    let input_name = e.target.name;
    let input_value = e.target.value;
    setNewRecord({
      ...newRecord,
      [input_name]: input_value,
    });
  };

  const loadPendingRealizedCheques = async () => {
    // * get search Results
    let cheque_number =
      newRecord.cheque_number != '' ? newRecord.cheque_number : 'No';
    let search_date =
      newRecord.search_date != '' ? newRecord.search_date : 'No';
    const pending_realized_cheque = await api.get(
      `load-pending-realized-cheques/${cookie.get(
        'user_branch',
      )}/${cheque_number}/${search_date}`,
    );
    // console.log(pending_realized_cheque);
    if (
      pending_realized_cheque.status == 200 &&
      pending_realized_cheque.data.status == 200
    ) {
      setPendingRelizedChequeList(pending_realized_cheque.data.data);
    } else if (
      pending_realized_cheque.status == 200 &&
      pending_realized_cheque.data.status == 500
    ) {
      msg.error(pending_realized_cheque.data.error);
    } else if (
      pending_realized_cheque.status == 200 &&
      pending_realized_cheque.data.status == 400
    ) {
      msg.warning(pending_realized_cheque.data.message);
    } else {
      msg.error('Something went wrong');
    }
  };

  const toggleSelectedList = async (id) => {
    if (selectedList.includes(id)) {
      setSelectedList((current) =>
        current.filter((value) => {
          return value !== id;
        }),
      );
    } else {
      setSelectedList((current) => [...current, id]);
    }
  };

  const handleSave = async () => {
    // console.log(selectedList);
    // console.log(newRecord);
    if (isEdit == false) {
      const response = await api.post(`save-bulk-realized-cheques`).values({
        selected_cheques: selectedList,
        record_details: newRecord,
      });
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        resetAll();
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.error);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else {
        msg.error('Something went wrong');
      }
    } else {
      const response = await api
        .post(`remove-realized-cheques-by-batch-number`)
        .values({
          selected_cheques: selectedList,
          branch_id: newRecord.branch_id,
        });
      if (response.status == 200 && response.data.status == 200) {
        msg.success(response.data.message);
        resetAll();
      } else if (response.status == 200 && response.data.status == 500) {
        msg.error(response.data.error);
      } else if (response.status == 200 && response.data.status == 400) {
        msg.warning(response.data.message);
      } else {
        msg.error('Something went wrong');
      }
    }
  };

  const searchRealizedChequesByBatchNumber = async (e) => {
    if (e.key === 'Enter') {
      console.log('press enter key');
      setIsEdit(true);
      setButtonText('Remove Realized');
      const realized_cheques = await api.get(
        `load-realized-cheques-by-batch-number/${newRecord.branch_id}/${newRecord.realized_batch_number}`,
      );
      console.log(realized_cheques);
      if (
        realized_cheques.status == 200 &&
        realized_cheques.data.status == 200
      ) {
        setPendingRelizedChequeList(realized_cheques.data.data);
        setNewRecord({
          ...newRecord,
          current_date: realized_cheques.data.data[0].realize_date,
        });
      } else if (
        realized_cheques.status == 200 &&
        realized_cheques.data.status == 500
      ) {
        msg.error(realized_cheques.data.error);
        setIsEdit(false);
        setButtonText('Realize');
      } else if (
        realized_cheques.status == 200 &&
        realized_cheques.data.status == 400
      ) {
        msg.warning(realized_cheques.data.message);
        setIsEdit(false);
        setButtonText('Realize');
      } else {
        msg.error('Something went wrong');
        setIsEdit(false);
        setButtonText('Realize');
      }
    }
  };

  const resetAll = async () => {
    setNewRecord({
      ...newRecord,
      branch_id: cookie.get('user_branch'),
      realized_batch_number: '',
      cheque_number: '',
      search_date: '',
      current_date: '',
    });
    setPendingRelizedChequeList([]);
    setIsEdit(false);
    setButtonText('Realize');
    setSelectedList([]);
    fetchData();
  };

  return (
    <div>
      <h5 className="text-center mt-2"> Realize Cheques</h5>
      <div className="row justify-content-between">
        <div className="col-sm-4">
          <div className="form-group row mb-0">
            <label for="cheque_number" className="col-sm-4">
              Cheque Number
            </label>
            <input
              type="text"
              name="cheque_number"
              className="form-control form-control-sm col-sm-8 text-right"
              id="cheque_number"
              value={newRecord.cheque_number}
              onChange={handleValaueChange}
            />
          </div>
          <div className="form-group row">
            <label for="search_date" className="col-sm-4">
              Date
            </label>
            <input
              type="date"
              name="search_date"
              className="form-control form-control-sm col-sm-8"
              id="search_date"
              value={newRecord.search_date}
              onChange={handleValaueChange}
            />
            <div className="col-auto">
              <button
                className="btn btn-sm btn-success"
                type="button"
                onClick={() => loadPendingRealizedCheques()}
              >
                <SafeFontAwesomeIcon icon={faSearch} size="sm" />
                &nbsp; Search...
              </button>
            </div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="form-group row mb-0">
            <label for="realized_batch_number" className="col-sm-4">
              Batch Number
            </label>
            <input
              type="text"
              name="realized_batch_number"
              className="form-control form-control-sm col-sm-8 text-right"
              id="realized_batch_number"
              value={newRecord.realized_batch_number}
              onChange={handleValaueChange}
              onKeyUp={searchRealizedChequesByBatchNumber}
            />
          </div>
          <div class="form-group row">
            <label for="current_date" className="col-sm-4">
              Realized Date
            </label>
            <input
              type="date"
              name="current_date"
              className="form-control form-control-sm col-sm-8"
              id="current_date"
              value={newRecord.current_date}
              onChange={handleValaueChange}
            />
          </div>
        </div>
      </div>
      <div className="row">
        {pendingRelizedChequeList.length > 0 ? (
          <table className="table table-hover table-sm">
            <thead className="thead-dark">
              <tr>
                <th scope="col"></th>
                <th scope="col">Account No</th>
                <th scope="col">Cheque No</th>
                <th scope="col">Cheque Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Bank Name</th>
                <th scope="col">Branch Name</th>
                <th scope="col">Received Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingRelizedChequeList.map((cheque) => {
                return (
                  <tr>
                    <th>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="exampleCheck1"
                          name="selected_list"
                          checked={
                            selectedList.includes(cheque.id) ? true : false
                          }
                          onChange={() => toggleSelectedList(cheque.id)}
                        />
                      </div>
                    </th>
                    <td>{cheque.received_account.account_number}</td>
                    <td>{cheque.cheque_no}</td>
                    <td>{cheque.cheque_date}</td>
                    <td>{cheque.amount}</td>
                    <td>{cheque.bank.des}</td>
                    <td>{cheque.bank_branch.des}</td>
                    <td>{moment(cheque.tdate).format('YYYY-MM-DD')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="col-sm-12">
            <div className="alert alert-info">
              <h6>No cheques found!</h6>
            </div>
          </div>
        )}
      </div>
      <div className="row justify-content-end p-2">
        <div className="pr-2">
          <button
            className="btn btn-sm btn-light"
            type="button"
            onClick={resetAll}
          >
            Reset
          </button>
        </div>
        <div>
          <button
            className="btn btn-sm btn-success"
            type="button"
            onClick={() => handleSave()}
            disabled={dissableButton}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default PendingRealizeCheques;
