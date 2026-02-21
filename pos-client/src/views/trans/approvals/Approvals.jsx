import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { PurchaseApprovals } from '../..';
import SafeFontAwesomeIcon from '../../../components/SafeFontAwesomeIcon';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../../components';
import VoucherApprovals from './VoucherApprovals';
import ReceiptApprovals from './ReceiptApprovals';

const Approvals = () => {
  const [showApprovals, setShowApprovals] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);

  const [purchaseApprovals, setPurchaseApprovals] = useState(0);
  const [tagTransferApprovals, setTagTransferApprovals] = useState(0);
  const [voucherApprovals, setVoucherApprovals] = useState(0);
  const [receiptApprovals, setReceiptApprovals] = useState(0);

  const [approvalModal, setApprovalModal] = useState({
    title: '',
    type: '',
    component: '',
  });

  useEffect(() => {
    //fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // const pawningAmt = await api.get(`showAprovalRequestsCount`);

      const waitingForApprovals = await api.get('show-approval-requests-count');

      const purchaseApprovalsCount = waitingForApprovals.data.purchaseApprovals
        ? parseInt(waitingForApprovals.data.purchaseApprovals)
        : 0;

      const tagTransferApprovalsCount = waitingForApprovals.data
        .customer_approvals
        ? parseInt(waitingForApprovals.data.customer_approvals)
        : 0;

      const voucherApprovalsCount = waitingForApprovals.data.voucherApprovals
        ? parseInt(waitingForApprovals.data.voucherApprovals)
        : 0;  

      const receiptApprovalsCount = waitingForApprovals.data.voucherApprovals
        ? parseInt(waitingForApprovals.data.receiptApprovals)
        : 0;  

      setPurchaseApprovals(purchaseApprovalsCount);
      setTagTransferApprovals(tagTransferApprovalsCount);
      setVoucherApprovals(voucherApprovalsCount);
      setReceiptApprovals(receiptApprovalsCount);

      // prettier-ignore
      setNotificationCount(parseInt(purchaseApprovalsCount) + parseInt(tagTransferApprovalsCount) + parseInt(voucherApprovalsCount) + parseInt(receiptApprovalsCount));
      // prettier-ignore-end

      watchData();
    } catch (error) { 
      console.log(error);
      return msg.error('⚠️ Unable to get notifications!');
    }
  };

  const watchData = async () => {
    const interval = setInterval(async () => {
      const waitingForApprovals = await api.get('show-approval-requests-count');

      const purchaseApprovalsCount = waitingForApprovals.data.purchaseApprovals
        ? parseInt(waitingForApprovals.data.purchaseApprovals)
        : 0;

      const tagTransferApprovalsCount = waitingForApprovals.data
        .customer_approvals
        ? parseInt(waitingForApprovals.data.customer_approvals)
        : 0;

      const voucherApprovalsCount = waitingForApprovals.data.voucherApprovals
        ? parseInt(waitingForApprovals.data.voucherApprovals)
        : 0;  

      const receiptApprovalsCount = waitingForApprovals.data.voucherApprovals
        ? parseInt(waitingForApprovals.data.receiptApprovals)
        : 0;  

      setPurchaseApprovals(purchaseApprovalsCount);
      setTagTransferApprovals(tagTransferApprovalsCount);
      setVoucherApprovals(voucherApprovalsCount);
      setReceiptApprovals(receiptApprovalsCount);


      // prettier-ignore
      setNotificationCount(parseInt(purchaseApprovalsCount) + parseInt(tagTransferApprovalsCount) + parseInt(voucherApprovalsCount) + parseInt(receiptApprovalsCount));
      // prettier-ignore-end
    }, 20000);
    return () => clearInterval(interval);
  };

  const toggleApprovalModal = (e) => {
    if (e) {
      if (e.target.name === 'purchaseApprovals') {
        setApprovalModal({
          title: ' Amount Approvals',
          type: 'purchaseApprovals',
          component: <PurchaseApprovals showApprovalModal={showApprovalModal}/>,
        });
      } else if (e.target.name === 'tagTransferApprovals') {
        // setApprovalModal({
        //   title: 'Customer Limit Approvals',
        //   type: 'tagTransferApprovals',
        //   component: <CustomerApprovals />,
        // });
      } else if (e.target.name === 'voucherApprovals'){
        setApprovalModal({
          title: ' Voucher Approvals',
          type: 'voucherApprovals',
          component: <VoucherApprovals showApprovalModal={showApprovalModal}/>,
        });
      } else if (e.target.name === 'receiptApprovals'){
        setApprovalModal({
          title: ' Receipt Approvals',
          type: 'ReceiptApprovals',
          component: <ReceiptApprovals showApprovalModal={showApprovalModal}/>,
        });
      }
    }
    setShowApprovals(!showApprovals);
  };

  const showApprovalModal = (e) =>{   
    setShowApprovals(false); 
  
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
            <SafeFontAwesomeIcon icon={faClipboardCheck} color="white" />
          </span>
          &nbsp; Approvals &nbsp;
          {notificationCount ? (
            <span className="badge badge-light">{notificationCount}</span>
          ) : null}
        </a>
        <div className="hover-drop-content">
          <a
            id="purchaseApprovals"
            name="purchaseApprovals"
            onClick={toggleApprovalModal}
          >
            Purchases
            {purchaseApprovals ? (
              <span className="badge badge-primary float-right">
                {purchaseApprovals}
              </span>
            ) : null}
          </a>
          <a
            id="tagTransferApprovals"
            name="tagTransferApprovals"
            onClick={toggleApprovalModal}
          >
            Tag Transfers
            {tagTransferApprovals ? (
              <span className="badge badge-primary float-right">
                {tagTransferApprovals}
              </span>
            ) : null}
          </a>
          <a
            id="voucherApprovals"
            name="voucherApprovals"
            onClick={toggleApprovalModal}
          >
            Voucher
            {voucherApprovals ? (
              <span className="badge badge-primary float-right">
                {voucherApprovals}
              </span>
            ) : null}
          </a>
          <a
            id="receiptApprovals"
            name="receiptApprovals"
            onClick={toggleApprovalModal}
          >
            Receipt
            {receiptApprovals ? (
              <span className="badge badge-primary float-right">
                {receiptApprovals}
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

export default Approvals;
