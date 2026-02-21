import React, { useState, useEffect } from 'react';
import { api, cookie, msg, print } from '../../../services';
import { SafeFontAwesomeIcon } from '../../../components';
import { SystemButton, FormModal, Loader } from '../../../components';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
// // import { async } from 'exceljs/dist/exceljs';

const NavNotification = () => {
  const moduleName = 'Unread Notifications';

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showFormModal2, setShowFormModal2] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCount, setShowCount] = useState(false);
  const [isLoading, setLIsLoading] = useState(false);
  const [inbox, setInbox] = useState([]);

  const [loanApprovalRejectRows, setLoanApprovalRejectRows] = useState([]);

  const [newData, setNewData] = useState({
    id: '',
    branch: '',
    bill_type_no: '',
    bill_no: '',
    bill_type: '',
    period: '',
    gold_weight: '',
    payable_amount: '',
    requested_amount: '',
    requested_amount_temp: '',
    excess_amount: '',
    avg_gold_value: '',
    requested_by: '',
    items: '',
    customer: '',
    approving_officer: '',
    approval_remarks: '',
    reject_reason: '',
    user_id: cookie.get('user_id'),
  });

  let inboxArr = [];
  let branchesArr = [];

  const columns = [
    {
      name: 'Branch',
      selector: 'branch',
      sortable: true,
    },
    {
      name: 'Type',
      selector: 'type',
      sortable: true,
      center: true,
    },
    {
      name: 'Transaction',
      selector: 'transaction',
      right: true,
      wrap: true,
    },
    {
      name: 'From Branch',
      selector: 'f_branch',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'From User',
      selector: 'f_user',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Meesage',
      selector: 'message',
      right: true,
      wrap: true,
      grow: 1,
    },
    {
      name: 'Status',
      selector: 'status',
      wrap: true,
      sortable: true,
    },
  ];

  let tempRows = [];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showFormModal) {
      fetchUnreadNotifications();
      // clear inbox when showing form modal
      // fetchData();
    }
  }, [showFormModal]);

  const fetchData = async () => {
    try {
      let branch_id = cookie.get('user_branch');
      const response = await api.get(
        `showUnreadNotificationsCount/${branch_id}`,
      );

      setUnreadNotificationCount(response.data[0].notify_count);
      watchData();
    } catch (error) {
      console.log(error);

      return msg.error('Unable to fetch messages! 🙀');
    }
  };

  const watchData = async () => {
    const interval = setInterval(async () => {
      try {
        let branch_id = cookie.get('user_branch');
        const response = await api.get(
          `showUnreadNotificationsCount/${branch_id}`,
        );

        //console.log(response.data[0].msg_count);
        setUnreadNotificationCount(response.data[0].notify_count);
      } catch (error) {
        console.log(error);
        return msg.error('Unable to fetch messages!');
      }
    }, 1800000);
    return () => clearInterval(interval);
  };

  const marksAsaRead = async (trans) => {
    const response = await api.post('mark-as-read').values({ id: trans.id });
    if (trans.trans_type == 'CASH_TRANSFER') {
      const responsen = await api.get(
        `get-notificationsnew/${trans.trans_id}/${trans.to_branch_id}`,
      );
      if (responsen.data.transfers) {
        setNewData({
          ...newData,
          id: responsen.data.transfers.id,
          category: 'Cash Transfer',
          display_name: responsen.data.transfers.ddate,
          amount: responsen.data.transfers.amount,
          from_branch: responsen.data.transfers.branch.name,
          to_branch: responsen.data.transfers.to_branch.name,
        });

        const responsemark = await api
          .post('mark-as-recived')
          .values({ trans_id: trans.trans_id, branch_id: trans.to_branch_id });
        // msg.success('Fund Transfer saved successfully!');
        print.cashTransfer(responsen.data.transfers);
        fetchData();
        fetchUnreadNotifications();
      }
    } else if (trans.trans_type == 'CHEQUE_TRANSFER') {
      // const responsen = await api.get(`get-notificationsnew/${trans.trans_id}`);
      // if (responsen.data.transfers) {
      // setNewData({
      //   ...newData,
      //   id: responsen.data.transfers.id,
      //   category: 'Cheque Transfer',
      //   display_name: responsen.data.transfers.ddate,
      //   amount: responsen.data.transfers.amount,
      //   from_branch: responsen.data.transfers.branch.name,
      //   to_branch: responsen.data.transfers.to_branch.name,
      // });
      // const responsemark = await api
      //   .post('mark-as-recived')
      //   .values({ trans_id: trans.trans_id });
      // // msg.success('Fund Transfer saved successfully!');
      // print.cashTransfer(responsen.data.transfers);
      // fetchData();
      // fetchUnreadNotifications();
      // }
    }

    // fetchData();
    //fetchUnreadNotifications();
  };

  const toggleFormModal = () => {
    setShowFormModal(!showFormModal);
    setInbox([]);
    setShowNotifications(false);
  };

  const toggleFormModal2 = () => {
    setShowFormModal2(!showFormModal2);
  };

  const fetchUnreadNotifications = async () => {
    setLIsLoading(true);
    try {
      let branch_id = cookie.get('user_branch');
      const response = await api.get(`showUnreadNotifications/${branch_id}`);

      if (response.data) {
        setShowNotifications(true);
      }
      // else {
      //   setShowNotifications(showNotifications);
      // }

      setInbox(response.data);
      setLIsLoading(false);
    } catch (error) {
      console.log(error);
      setLIsLoading(false);
      return msg.error('Unable to fetch messages! 🙀');
    }
  };

  return (
    <div style={{ cursor: 'pointer' }}>
      <div onClick={toggleFormModal}>
        <a id="approval" className="btn btn-sm">
          <span>
            <SafeFontAwesomeIcon icon={faGlobe} color="white" size="lg" />
          </span>
          <span>
            {unreadNotificationCount ? (
              <span className="badge badge-danger align-top rounded-0">
                {unreadNotificationCount}
              </span>
            ) : null}
          </span>
        </a>
      </div>
      <FormModal
        moduleName={moduleName}
        modalState={showFormModal}
        toggleFormModal={toggleFormModal}
      >
        <div className="modal-body">
          {showNotifications ? (
            <table style={{ width: '100%' }} className="table-responsive">
              <tr style={{ background: '#fcf8e1' }}>
                {/* <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                Type
              </th> */}
                <th
                  className="width"
                  style={{
                    border: '1px solid black',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  Transaction No
                </th>
                <th
                  className="width"
                  style={{
                    border: '1px solid black',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  From User
                </th>
                <th
                  className="width"
                  style={{
                    border: '1px solid black',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  From Branch
                </th>
                <th
                  style={{
                    border: '1px solid black',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  Meesage
                </th>
                <th
                  className="width"
                  style={{
                    border: '1px solid black',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  Action
                </th>
              </tr>
              {inbox.map((message) => {
                return (
                  <tr style={{ background: '#e0e0de' }}>
                    {/* <td
                    style={{
                      border: '1px solid black',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                    }}
                  >
                    {message.trans_type}
                  </td> */}
                    <td
                      style={{
                        border: '1px solid black',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                      }}
                    >
                      {message.trans_id}
                    </td>

                    <td
                      style={{
                        border: '1px solid black',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                      }}
                    >
                      {message.from_user.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid black',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                      }}
                    >
                      {message.from_branch.name}
                    </td>
                    <td
                      style={{
                        border: '1px solid black',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                      }}
                    >
                      {message.message}
                    </td>
                    <td
                      style={{
                        border: '1px solid black',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                      }}
                    >
                      <button
                        className="btn btn-warning btn-sm pt-0 pb-0"
                        onClick={() => marksAsaRead(message)}
                      >
                        {' '}
                        Marks As Read
                      </button>
                    </td>
                  </tr>
                );
              })}
            </table>
          ) : isLoading ? (
            <div>
              <Loader />
            </div>
          ) : null}
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleFormModal}
            showText={true}
          />
        </div>
      </FormModal>
    </div>
  );
};

export default NavNotification;
