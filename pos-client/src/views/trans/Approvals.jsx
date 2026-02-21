import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../services';
import {
  PawningApprovals,
  CustomerApprovals,
  DiscountApprovals,
} from '../../views';
import { SafeFontAwesomeIcon } from '../../components';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../components';
// import { async } from 'exceljs/dist/exceljs';
import { ToastContainer, toast } from 'react-toastify';
import Cookies from 'universal-cookie';

const Approvals = () => {
  const [showApprovals, setShowApprovals] = useState(false);
  const [showRejectApprovals, setShowRejectApprovals] = useState(false);

  const [pawningAmtCount, setPawningAmtCount] = useState(0);
  const [customerLmtCount, setCustomerLmtCount] = useState(0);
  const [discountAppCount, setDiscountAppCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  let pawningApprovals = 0;
  let customerLimitApprovals = 0;
  let discountApprovals = 0;

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
  const userId = cookie.get('user_id');

  useEffect(() => {
    // setNotificationCount(15);

    window.Echo.channel('pawning_approval_status_channel').listen(
      'PawningApprovalStatus',
      (data) => {
        console.log('Received event:', data);

        // if (userId == data.data.to_user || userId == data.data.from_user) {
        console.log(data);
        console.log('userid', userId);

        pawningApprovals = data.data.loanApprovalCount;
        customerLimitApprovals = data.data.customerApprovalCount;
        discountApprovals = data.data.discountApprovalCount;

        // setPawningAmtCount(data.data.loanApprovalCount);

        setNotificationCount(
          (pawningApprovals ? pawningApprovals : 0) +
            (customerLimitApprovals ? customerLimitApprovals : 0) +
            (discountApprovals ? discountApprovals : 0),
        );
        // }
        var user = cookie.get('user_id');
        var branch_id = cookie.get('user_branch');
        var user_role = cookie.get('user_roles');
        // if (branch_id == data.data.to_branch_id) {
        //  console.log('Approval window count:', pawningApprovals);
        if (data.data.trans_type == 'PAWNING_APPROVAL_SENT') {
          // if (userId == data.data.to_user) {
          if (
            cookie.get('permissions') &&
            cookie.get('permissions').show_pawning_approvals === 1
          ) {
            toast.warning(data.data.message, {
              className: 'font-weight-bold bg-light text-dark',
              autoClose: 10000,
              position: toast.POSITION.TOP_RIGHT,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: false,
              closeButton: false,
              closeOnEscape: false,
            });

            fetchData();
          }
          // }
        } else if (data.data.trans_type == 'PAWNING_APPROVAL_APPROVE') {
          // if (userId == data.data.from_user) {
          fetchData();
          // }
        } else if (data.data.trans_type == 'CUSTOMER_LIMIT_APPROVAL_SENT') {
          // if (userId == data.to_user) {
          if (
            cookie.get('permissions') &&
            cookie.get('permissions').show_customer_limit_approvals === 1
          ) {
            toast.warning(data.data.message, {
              className: 'font-weight-bold bg-items text-dark',
              autoClose: 10000,
              position: toast.POSITION.TOP_RIGHT,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: false,
              closeButton: false,
              closeOnEscape: false,
            });
            // customerLimitApprovals++;
            fetchData();
            // }
          }
        } else if (data.data.trans_type == 'PAWNING_APPROVAL_CANCEL') {
          if (userId == data.data.to_user) {
            msg.error('Pawning Approval Close By User!');
            fetchData();
          }
        } else if (data.data.trans_type == 'PAWNING_APPROVAL_REJECT') {
          fetchData();
        } else if (data.data.trans_type == 'CUSTOMER_LIMIT_APPROVAL_APPROVE') {
          fetchData();
        } else if (data.data.trans_type == 'CUSTOMER_LIMIT_APPROVAL_CANCEL') {
          fetchData();
        } else if (data.data.trans_type == 'CUSTOMER_LIMIT_APPROVAL_REJECT') {
          fetchData();
        } else if (data.data.trans_type == 'DISCOUNT_APPROVAL_SENT') {
          // if (userId == data.to_user) {
          if (
            cookie.get('permissions') &&
            cookie.get('permissions').show_discount_approvals === 1
          ) {
            toast.warning(data.data.message, {
              className: 'font-weight-bold bg-dark-search text-dark',
              autoClose: 10000,
              position: toast.POSITION.TOP_RIGHT,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: false,
              closeButton: false,
              closeOnEscape: false,
            });

            fetchData();
            // }
          }
        } else if (data.data.trans_type == 'DISCOUNT_APPROVAL_APPROVE') {
          fetchData();
        } else if (data.data.trans_type == 'DISCOUNT_APPROVAL_CANCEL') {
          fetchData();
        } else if (data.data.trans_type == 'DISCOUNT_APPROVAL_REJECT') {
          fetchData();
        }
      },
    );
    // fetchData();
  }, []);

  const fetchData = async () => {
    try {
      //   //  const pawningAmt = await api.get(`showAprovalRequestsCount`);

      //   const pawningAmt = 0;
      //   const pawningApprovals = pawningAmt.data.pawning_approvals
      //     ? parseInt(pawningAmt.data.pawning_approvals)
      //     : 0;
      //   const customerApprovals = pawningAmt.data.customer_approvals
      //     ? parseInt(pawningAmt.data.customer_approvals)
      //     : 0;
      //   const discountApprovals = pawningAmt.data.discount_approvals
      //     ? parseInt(pawningAmt.data.discount_approvals)
      //     : 0;
      // if (
      //   cookie.get('permissions') &&
      //   cookie.get('permissions').show_pawning_approvals === 1
      // ) {
      // setPawningAmtCount(pawningApprovals);
      //   if (pawningApprovals > 0) {
      //     setPawningAmtCount(pawningApprovals);
      //   }
      // }
      // if (
      //   cookie.get('permissions') &&
      //   cookie.get('permissions').show_customer_limit_approvals === 1
      // ) {
      // setCustomerLmtCount(customerApprovals);
      //   if (customerLimitApprovals > 0) {
      //     setPawningAmtCount(customerLimitApprovals);
      //   }
      // }
      // if (
      //   cookie.get('permissions') &&
      //   cookie.get('permissions').show_discount_approvals === 1
      // ) {
      //   if (discountApprovals > 0) {
      //     setDiscountAppCount(discountApprovals);
      //   }
      // }
      //   // prettier-ignore
      // setNotificationCount(
      //   parseInt(pawningApprovals) +
      //     parseInt(customerApprovals) +
      //     parseInt(discountApprovals),
      // );

      // setNotificationCount(
      //   parseInt(pawningApprovals) +
      //     parseInt(customerLimitApprovals) +
      //     parseInt(discountApprovals),
      // );

      // prettier-ignore-end
      watchData();
    } catch (error) {
      console.log(error);
      return msg.error(
        'Unable to fetch notifications! Please check connection to the server',
      );
    }
  };

  // const watchData = async () => {
  //   const interval = setInterval(async () => {
  //     const pawningAmt = await api.get(`showAprovalRequestsCount`);

  //     let pawningApprovals = pawningAmt.data.pawning_approvals
  //       ? parseInt(pawningAmt.data.pawning_approvals)
  //       : 0;
  //     let customerApprovals = pawningAmt.data.customer_approvals
  //       ? parseInt(pawningAmt.data.customer_approvals)
  //       : 0;
  //     let discountApprovals = pawningAmt.data.discount_approvals
  //       ? parseInt(pawningAmt.data.discount_approvals)
  //       : 0;

  //     setPawningAmtCount(pawningApprovals);
  //     setCustomerLmtCount(customerApprovals);
  //     setDiscountAppCount(discountApprovals);
  //     // prettier-ignore
  //     setNotificationCount(parseInt(pawningApprovals) + parseInt(customerApprovals) + parseInt(discountApprovals));
  //     // prettier-ignore-end
  //   }, 20000);
  //   return () => clearInterval(interval);
  // };

  const watchData = async () => {
    // const pawningAmt = await api.get(`showAprovalRequestsCount`);

    // let pawningApprovals = pawningAmt.data.pawning_approvals
    //   ? parseInt(pawningAmt.data.pawning_approvals)
    //   : 0;
    // let customerApprovals = pawningAmt.data.customer_approvals
    //   ? parseInt(pawningAmt.data.customer_approvals)
    //   : 0;
    // let discountApprovals = pawningAmt.data.discount_approvals
    //   ? parseInt(pawningAmt.data.discount_approvals)
    //   : 0;

    // setPawningAmtCount(pawningApprovals);
    // setCustomerLmtCount(customerApprovals);
    // setDiscountAppCount(discountApprovals);

    setPawningAmtCount(pawningApprovals);
    setCustomerLmtCount(customerLimitApprovals);
    setDiscountAppCount(discountApprovals);
    // prettier-ignore
    //   setNotificationCount(parseInt(pawningApprovals) + parseInt(customerApprovals) + parseInt(discountApprovals));
    //   // prettier-ignore-end
    // }, 20000);
    // return () => clearInterval(interval);
  };

  const toggleApprovalModal = (e) => {
    console.log(e ? e.target.name : null);
    console.log('states', window.Echo.connector.pusher.connection.state);
    // if (window.Echo.connector.pusher.connection.state === 'connected') {
    if (e) {
      if (e.target.name === 'loanApproval') {
        setApprovalModal({
          title: 'Pawning Amount Approvals',
          type: 'loanApproval',
          component: <PawningApprovals countAgain={() => fetchData()} />,
        });
      } else if (e.target.name === 'customerApproval') {
        setApprovalModal({
          title: 'Customer Limit Approvals',
          type: 'customerApproval',
          component: <CustomerApprovals countAgain={() => fetchData()} />,
        });
      } else if (e.target.name === 'discountApproval') {
        setApprovalModal({
          title: 'Discount Approvals',
          type: 'discountApproval',
          component: <DiscountApprovals countAgain={() => fetchData()} />,
        });
      }
    }

    setShowApprovals(!showApprovals);
    // } else {
    //   // Pusher is not connected
    //   alert('Please connect to Pusher to view approvals.');
    // }
  };

  return (
    <div>
      <div className="hover-drop">
        <a
          id="loanapproval"
          //   className={'btn btn-sm rounded-0'}
          className={
            notificationCount
              ? 'btn btn-sm rounded-0 notification'
              : 'btn btn-sm rounded-0 '
          }
          style={{
            backgroundColor: '#2867FD',
            color: '#fff',
            padding: '3px 10px 3px 10px',
          }}
        >
          <span>
            <SafeFontAwesomeIcon icon={faClipboardCheck} color="white" />
          </span>
          &nbsp; Approvals &nbsp;
          {notificationCount ? (
            <span className="badge badge-light">{notificationCount}</span>
          ) : null}
        </a>
        <div className="hover-drop-content">
          {cookie.get('permissions') ? (
            cookie.get('permissions').show_approvals == 1 ? (
              <a
                id="loanApproval"
                name="loanApproval"
                onClick={toggleApprovalModal}
              >
                Pawning Amount Approvals &nbsp;
                {pawningAmtCount ? (
                  <span className="badge badge-danger align-top rounded-0">
                    {pawningAmtCount}
                  </span>
                ) : null}
              </a>
            ) : null
          ) : (
            ''
          )}

          {cookie.get('permissions') ? (
            cookie.get('permissions').show_customer_limit_approvals == 1 ? (
              <a
                id="customerApproval"
                name="customerApproval"
                onClick={toggleApprovalModal}
              >
                Customer Pawning Limit Approvals &nbsp;
                {customerLmtCount ? (
                  <span className="badge badge-danger align-top rounded-0">
                    {customerLmtCount}
                  </span>
                ) : null}
              </a>
            ) : null
          ) : (
            ''
          )}
          {/* <a
            id="expenseApproval"
            name="expenseApproval"
            onClick={toggleApprovalModal}
          >
            Expense Approvals
          </a> */}
          {cookie.get('permissions') ? (
            cookie.get('permissions').show_discount_approvals == 1 ? (
              <a
                id="discountApproval"
                name="discountApproval"
                onClick={toggleApprovalModal}
              >
                Discount Approvals &nbsp;
                {discountAppCount ? (
                  <span className="badge badge-danger align-top rounded-0">
                    {discountAppCount}
                  </span>
                ) : null}
              </a>
            ) : null
          ) : (
            ''
          )}
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

export default Approvals;
