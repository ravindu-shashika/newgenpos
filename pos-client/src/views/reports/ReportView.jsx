import React, { useState, useEffect, useRef } from 'react';
import { SystemButton } from '../../components';
import { api, cookie, msg } from '../../services';

const ReportView = () => {
  // Module name
  const moduleName = 'Reports';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [reportsTrans, setReportsTrans] = useState([]);
  const [reportsMaster, setReportsMaster] = useState([]);
  const [reportsStock, setReportsStock] = useState([]);
  const [branches, setBranches] = useState([]);

  const [newData, setNewData] = useState({
    from_date: '',
    to_date: '',
    bc_no: '',
    branch_id: cookie.get('user_branch'),
    user_id: cookie.get('user_id'),
  });

  const [selectedReport, setSelectedReport] = useState('');

  /* ---  End of Customer List Selection Required ---- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- End of component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        init: true,
      });

      const response = await api.get(`reports`);

      setReportsMaster(response.data.report_permission_master);
      setReportsTrans(response.data.report_permission_trans);
      setBranches(response.data.branches);
      //   setReportsStock(response.data.report_permission_trans)

      setIsLoading({
        ...isLoading,
        init: false,
      });
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

//   setCurrentReport

const setCurrentReport = async (module_path, e) => {
    setSelectedReport(module_path);
};

const viewReport = async () => {
    console.log(selectedReport);
    switch (selectedReport) {
        case "gold_rate_history":
            const response = await api.getapi(`gold_rate_history`);
            // {`${process.env.REACT_APP_DEFAULT_PATH}/reportHome/${cookie.get('user_id')}`}
        break;
    }
};

  /* --- Component renders --- */

  return (
    <div>
      <br />
      <h5 classNameName="text-center">{moduleName}</h5>
      <br />
      <div className="card">
        <div id="accordion">
          <div className="card">
            <div className="card-header" id="headingOne">
              <h5 className="mb-0">
                <button
                  className="btn btn-link"
                  data-toggle="collapse"
                  data-target="#collapseOne"
                  aria-expanded="true"
                  aria-controls="collapseOne"
                >
                  Master Reports
                </button>
              </h5>
            </div>

            <div
              id="collapseOne"
              className="collapse show"
              aria-labelledby="headingOne"
              data-parent="#accordion"
            >
              <div className="card-body">
                {reportsMaster.map((item, index) => {
                  return (
                    <a className="list-group-item">
                      {item.module_name}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header" id="headingTwo">
              <h5 className="mb-0">
                <button
                  className="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseTwo"
                  aria-expanded="false"
                  aria-controls="collapseTwo"
                >
                  Stock Reports
                </button>
              </h5>
            </div>
            <div
              id="collapseTwo"
              className="collapse"
              aria-labelledby="headingTwo"
              data-parent="#accordion"
            >
              <div className="card-body">
                {reportsStock.map((item, index) => {
                  return (
                    <a href="/reports" className="list-group-item">
                      {item.module_name}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header" id="headingThree">
              <h5 className="mb-0">
                <button
                  className="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  Transaction Report
                </button>
              </h5>
            </div>
            <div
              id="collapseThree"
              className="collapse"
              aria-labelledby="headingThree"
              data-parent="#accordion"
            >
              <div className="card-body">
                {reportsTrans.map((item, index) => {
                  return (
                    <button 
                    type="button" 
                    onClick={(event) => {
                        setCurrentReport(item.module_path,event);
                    }}
                    className="btn btn-light list-group-item col-sm-12 text-left"> 
                    {item.module_name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div className="card">
        <div className="modal-body">
          <div className="row">
            <label htmlFor="name" className="col-sm-2 col-form-label">
              From Date
            </label>
            <div className="col-sm-4">
              <input
                type="date"
                name="from_date"
                id="from_date"
                maxLength="30"
                className="form-control form-control-sm"
                value={newData.from_date}
                onChange={handleValueChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <label htmlFor="name" className="col-sm-2 col-form-label">
              To Date
            </label>
            <div className="col-sm-4">
              <input
                type="date"
                name="to_date"
                id="to_date"
                maxLength="30"
                className="form-control form-control-sm"
                value={newData.to_date}
                onChange={handleValueChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <label htmlFor="name" className="col-sm-2 col-form-label">
              Branches
            </label>
            <div className="col-sm-4">
              <select
                id="bc_no"
                name="bc_no"
                className="form-control form-control-sm"
                required
                onChange={handleValueChange}
                value={newData.bc_no}
              >
                <option value="">---</option>
                {branches.map((obj) => {
                  return (
                    <option key={obj.bc_no} value={obj.bc_no}>
                      {obj.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <SystemButton 
          type={'view'} 
          method={viewReport}
          showText={true} />
        </div>
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default ReportView;
