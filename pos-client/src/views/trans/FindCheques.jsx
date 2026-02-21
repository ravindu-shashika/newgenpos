import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print } from '../../services';
import { FormModal, ListView, SystemButton, SDD } from '../../components';
import moment from 'moment';
import { SafeFontAwesomeIcon } from '../../components';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
// import { async } from 'exceljs/dist/exceljs';

const FindCheques = () => {
  const [pendingRelizedChequeList, setPendingRelizedChequeList] = useState([]);

  const [selectedList, setSelectedList] = useState([]);

  const [isEdit, setIsEdit] = useState(false);

  const [dissableButton, setDissableButton] = useState(true);

  const [newRecord, setNewRecord] = useState({
    branch_id: cookie.get('user_branch'),
    realized_batch_number: '',
    cheque_number: '',
    search_date: '',
    current_date: '',
  });

  const handleValaueChange = async (e) => {
    let input_name = e.target.name;
    let input_value = e.target.value;
    setNewRecord({
      ...newRecord,
      [input_name]: input_value,
    });
  };

  const searchRealizedChequesByBatchNumber = async (e) => {
    if (e.key === 'Enter') {
      console.log('press enter key');
      let cheque_number =
        newRecord.cheque_number != '' ? newRecord.cheque_number : 'No';

      const find_cheques = await api.get(
        `find-cheques/${cookie.get('user_branch')}/${cheque_number}`,
      );
      // console.log(find_cheques);
      if (find_cheques.status == 200 && find_cheques.data.status == 200) {
        setPendingRelizedChequeList(find_cheques.data.data);
      } else if (
        find_cheques.status == 200 &&
        find_cheques.data.status == 500
      ) {
        msg.error(find_cheques.data.error);
      } else if (
        find_cheques.status == 200 &&
        find_cheques.data.status == 400
      ) {
        msg.warning(find_cheques.data.message);
      } else {
        msg.error('Something went wrong');
      }
    }
  };

  const resetAll = async () => {
    setNewRecord({
      ...newRecord,
      branch_id: cookie.get('user_branch'),
      cheque_number: '',
    });
    setPendingRelizedChequeList([]);
    setIsEdit(false);
    setSelectedList([]);
  };

  return (
    <div>
      <h5 className="text-center mt-2"> Find Cheques</h5>
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
              onKeyUp={searchRealizedChequesByBatchNumber}
            />
          </div>
        </div>
        <div className="col-sm-4">
          <div className="form-group row">
            <div className="col-auto">
              <button
                className="btn btn-sm btn-success"
                type="button"
                onClick={() => searchRealizedChequesByBatchNumber()}
              >
                <SafeFontAwesomeIcon icon={faSearch} size="sm" />
                &nbsp; Search...
              </button>
              &nbsp;
              <button
                className="btn btn-sm btn-danger"
                type="button"
                onClick={resetAll}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        {pendingRelizedChequeList.length > 0 ? (
          <table className="table table-hover table-sm">
            <thead className="thead-dark">
              <tr>
                <th scope="col">Trans No</th>
                <th scope="col">From Branch</th>
                <th scope="col">To Branch </th>
                <th scope="col">Account No</th>
                <th scope="col">Cheque No</th>
                <th scope="col">Cheque Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Bank Name</th>
                <th scope="col">Branch Name</th>
                <th scope="col">Issue Date</th>
                {pendingRelizedChequeList.received_cheque ? (
                  <th scope="col">Received Date</th>
                ) : (
                  <th scope="col">Return Date</th>
                )}
              </tr>
            </thead>
            <tbody>
              {pendingRelizedChequeList.map((cheque) => {
                return (
                  <tr>
                    <td>{cheque.trans_id}</td>
                    <td>{cheque.frombranch.name}</td>
                    <td>{cheque.tobranch.name}</td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.received_account.account_number
                        : cheque.return_chequedet.received_account
                            .account_number}
                    </td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.cheque_no
                        : cheque.return_chequedet.cheque_no}
                    </td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.cheque_date
                        : cheque.return_chequedet.cheque_date}
                    </td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.amount
                        : cheque.return_chequedet.amount}
                    </td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.bank.des
                        : cheque.return_chequedet.bank.des}
                    </td>
                    <td>
                      {cheque.received_cheque
                        ? cheque.received_cheque.bank_branch.des
                        : cheque.return_chequedet.bank_branch.des}
                    </td>
                    <td>{moment(cheque.tdate).format('YYYY-MM-DD')}</td>
                    <td>
                      {moment(
                        cheque.received_cheque
                          ? cheque.received_cheque.tdate
                          : cheque.return_chequedet.tdate,
                      ).format('YYYY-MM-DD')}
                    </td>
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
    </div>
  );

  /* --- End of component renders --- */
};

export default FindCheques;
