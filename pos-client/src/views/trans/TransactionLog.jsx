import React, { useState, useEffect } from 'react';
import { api, msg, cookie, print, roundup, cal, txt } from './../../services';
import moment from 'moment';
import { SystemButton, UnclosableModal, FormModal } from '../../components';
import { SafeFontAwesomeIcon } from '../../components';
import {
  faForward,
  faGavel,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { Link } from 'react-router-dom';
// import { async } from 'exceljs/dist/exceljs';

const TransactionLog = () => {
  const moduleName = 'Transaction Log';

  const [isLoading, setIsLoading] = useState(true);

  const [transTypes, setTransTypes] = useState([]);

  const [transactionDetails, setTransactionDetails] = useState([]);

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    branch_id: cookie.get('user_branch'),
    trans_type_id: '',
    ref_no: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await api.get('trans-types');
    console.log(response);
    if (response.status == 200 && response.data.status == 200) {
      setTransTypes(response.data.data);
      setIsLoading(false);
    } else if (response.status == 200 && response.data.status == 500) {
      msg.warning(response.data.message);
    } else {
      msg.error('Something Went Wrong...');
    }
  };

  const loadData = async () => {
    const results = await api.post('get-transaction-details').values(newData);
    console.log(results.data.data);
    if (results.status == 200 && results.data.status == 200) {
      // if (results.data.data.length > 0) {
      setEntities(results.data.data);
      // } else {
      //     msg.info('No Data')
      // }
    } else if (results.status == 200 && results.data.status == 400) {
      msg.warning(results.data.message);
    } else if (results.status == 200 && results.data.status == 500) {
      msg.error(results.data.message);
    } else {
      msg.error('Something Went Wrong...');
    }
  };

  const resetAll = () => {
    setNewData({
      ...newData,
      branch_id: cookie.get('user_branch'),
      trans_type_id: '',
      ref_no: '',
    });
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading ? (
        <div>
          <br />
          <br />
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="row">
            <div className="col-sm-2">
              <div className="form-group mb-0">
                <label htmlFor="trans_type_id" className="col-form-label">
                  Trans Type
                </label>
                <select
                  className="form-control form-control-sm"
                  id="trans_type_id"
                  name="trans_type_id"
                  value={newData.trans_type_id}
                  onChange={(e) =>
                    setNewData({ ...newData, trans_type_id: e.target.value })
                  }
                >
                  <option value="" className="text-muted" disabled>
                    ---
                  </option>
                  {transTypes.map((type) => {
                    return (
                      <option value={type.id} key={type.id}>
                        {type.description}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="col-sm-2">
              <div className="form-group mb-0">
                <label htmlFor="ref_no" className="col-form-label">
                  Reference Number
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm text-right"
                  id="ref_no"
                  name="ref_no"
                  value={newData.ref_no}
                  onChange={(e) =>
                    setNewData({ ...newData, ref_no: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="col-sm-2 align-self-end">
              <SystemButton type={'load'} showText={true} method={loadData} />
            </div>
          </div>
          {entities.length > 0 ? (
            <div className="row mt-2 px-3">
              <table className="table table-sm table-bordered table-hover">
                <thead className="thead-dark text-center">
                  <tr>
                    <th scope="col">User ID</th>
                    <th scope="col">User Name</th>
                    <th scope="col">Action</th>
                    <th scope="col">Trans Date</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {entities.map((entity, index) => {
                    return (
                      <tr key={entity.id}>
                        <td>{entity.user.id}</td>
                        <td>{entity.user.name}</td>
                        <td>{entity.sub_trans_type}</td>
                        <td>
                          {moment(entity.created_at).format(
                            'YYYY-MM-DD HH:mm:ss',
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="row mt-2 px-3">
              <div class="alert alert-primary col-sm-12" role="alert">
                No Records Found...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionLog;
