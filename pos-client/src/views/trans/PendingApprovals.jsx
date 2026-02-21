import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../services';
import {
  PawningApprovals,
  CustomerApprovals,
  DiscountApprovals,
} from '../../views';
import { SafeFontAwesomeIcon } from '../../components';
import { faClipboardCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../components';
// import { async } from 'exceljs/dist/exceljs';
import PendingPawningApprovals from './PendingPawningApprovals';

const PendingApprovals = () => {
  const [showApprovals, setShowApprovals] = useState(false);
  const [showRejectApprovals, setShowRejectApprovals] = useState(false);

  const [pawningAmtCount, setPawningAmtCount] = useState(0);
  const [customerLmtCount, setCustomerLmtCount] = useState(0);
  const [discountAppCount, setDiscountAppCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const [approvalModal, setApprovalModal] = useState({
    title: '',
    type: '',
    component: '',
  });

  const [approvalRejectDet, setApprovalRejectDet] = useState({
    title: '',
    type: '',
    component: '',
  });

  useEffect(() => {
    window.Echo.channel('pawning_approval_status_channel').listen(
      'PawningApprovalStatus',
      (data) => {
        var user = cookie.get('user_id');
        if (user == data.data.to_user) {
          var branch_id = cookie.get('user_branch');
          var mac = cookie.get('mac_address');
          // if (data.data.to_user == mac) {
          if (data.data.trans_type == 'PAWNING_APPROVAL_CANCEL') {
            fetchData();
          } else if (data.data.trans_type == 'CUSTOMER_LIMIT_APPROVAL_CANCEL') {
            fetchData();
          }
        }
      },
    );

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pawningAmt = await api.get(`showAprovalRequestsCount`);

      const pawningApprovals = pawningAmt.data.pawning_approvals
        ? parseInt(pawningAmt.data.pawning_approvals)
        : 0;
      const customerApprovals = pawningAmt.data.customer_approvals
        ? parseInt(pawningAmt.data.customer_approvals)
        : 0;
      const discountApprovals = pawningAmt.data.discount_approvals
        ? parseInt(pawningAmt.data.discount_approvals)
        : 0;

      setPawningAmtCount(pawningApprovals);
      setCustomerLmtCount(customerApprovals);
      setDiscountAppCount(discountApprovals);
      // prettier-ignore
      setNotificationCount(parseInt(pawningApprovals) + parseInt(customerApprovals) + parseInt(discountApprovals));
      // prettier-ignore-end

      watchData();
    } catch (error) {
      console.log(error);
      return msg.error(
        'Unable to fetch notifications! Please check connection to the server',
      );
    }
  };

  const watchData = async () => {
    const interval = setInterval(async () => {
      const pawningAmt = await api.get(`showAprovalRequestsCount`);

      let pawningApprovals = pawningAmt.data.pawning_approvals
        ? parseInt(pawningAmt.data.pawning_approvals)
        : 0;
      let customerApprovals = pawningAmt.data.customer_approvals
        ? parseInt(pawningAmt.data.customer_approvals)
        : 0;
      let discountApprovals = pawningAmt.data.discount_approvals
        ? parseInt(pawningAmt.data.discount_approvals)
        : 0;

      setPawningAmtCount(pawningApprovals);
      setCustomerLmtCount(customerApprovals);
      setDiscountAppCount(discountApprovals);
      // prettier-ignore
      setNotificationCount(parseInt(pawningApprovals) + parseInt(customerApprovals) + parseInt(discountApprovals));
      // prettier-ignore-end
    }, 20000);
    return () => clearInterval(interval);
  };

  const toggleApprovalModal = (e) => {
    console.log(e ? e.target.name : null);

    if (e) {
      if (e.target.name === 'pendingLoanApproval') {
        setApprovalModal({
          title: 'Pending Pawning Amount Request',
          type: 'pendingLoanApproval',
          component: <PendingPawningApprovals countAgain={() => fetchData()} />,
        });
      }
    }

    setShowApprovals(!showApprovals);
  };

  return (
    <div>
      <div className="hover-drop">
        <a
          id="approval"
          className={
            notificationCount
              ? 'btn btn-sm rounded-0 notification'
              : 'btn btn-sm rounded-0'
          }
          style={{
            backgroundColor: '#2867FD',
            color: '#fff',
            padding: '3px 10px 3px 10px',
          }}
        >
          <span>
            <SafeFontAwesomeIcon icon={faClock} color="white" />
          </span>
          &nbsp; Request &nbsp;
          {notificationCount ? (
            <span className="badge badge-light">{notificationCount}</span>
          ) : null}
        </a>
        <div className="hover-drop-content">
          <a
            id="pendingLoanApproval"
            name="pendingLoanApproval"
            onClick={toggleApprovalModal}
          >
            Pending Pawning Amount Request
            {pawningAmtCount ? (
              <span className="badge badge-danger align-top rounded-0">
                {pawningAmtCount}
              </span>
            ) : null}
          </a>
        </div>
      </div>
      {showApprovals ? (
        <FormModal
          moduleName={approvalModal.title}
          modalState={showApprovals}
          toggleFormModal={toggleApprovalModal}
        >
          <div className="modal-body">
            {approvalModal.component ? approvalModal.component : null}
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleApprovalModal}
              showText={true}
            />
          </div>
        </FormModal>
      ) : null}
    </div>
  );
};

export default PendingApprovals;
