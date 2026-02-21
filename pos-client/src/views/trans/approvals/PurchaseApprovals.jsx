import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { api, msg, cookie } from '../../../services';
import { SafeFontAwesomeIcon } from '../../../components';
import { faForward } from '@fortawesome/free-solid-svg-icons';

const PurchaseApprovals = ({showApprovalModal}) => {
  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState(false);

  const [entities, setEntities] = useState([]);

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(`pending-purchase-approvals`);

      console.log(response.data);

      setEntities(response.data);
    } catch (error) {
      msg.error('Unable to fetch data!');
      return console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPurchase = () => {
    alert(`It's not doing anything...yet..`);
  };

  return (
    <div>
      <div className="table-responsive header-fixed-scrollable">
        <table className="table table-bordered table-sm table-hover">
          <thead className="thead-dark text-center">
            <tr>
              <td width="3%" rowSpan="2">
                #
              </td>
              <td width="8%">Purchase ID</td>
              <td width="30%">Memo</td>
              <td width="14%">Branch</td>
              <td width="14%">Supplier</td>
              <td width="14%">Store</td>
              <td width="14%">Officer</td>
              <td width="3%"></td>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity, index) => {
              return (
                <tr key={entity.id}>
                  <td>{parseInt(index) + 1}</td>
                  <td>{entity.nno}</td>
                  <td>{entity.memo}</td>
                  <td>{entity.branch.name}</td>
                  <td>{entity.vendor.name}</td>
                  <td>{entity.store.description}</td>
                  <td>{entity.officer.name}</td>
                  <td className="text-center">
                    <Link to={`/purchases/${entity.nno}/${entity.bc_no}`} onClick={() => showApprovalModal()}>
                      <span style={{ cursor: 'pointer' }}>
                        <SafeFontAwesomeIcon icon={faForward} color="green" />
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default PurchaseApprovals;
