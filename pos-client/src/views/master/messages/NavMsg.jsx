import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { SafeFontAwesomeIcon } from '../../../components';
import { SystemButton, FormModal } from '../../../components';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const NavMsg = () => {
  const moduleName = 'Messages Inbox';

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showFormModal2, setShowFormModal2] = useState(false);

  const [branches, setBranches] = useState([]);

  const [inbox, setInbox] = useState([]);

  const [currentMessage, setCurrentMessage] = useState([
    {
      id: '',
      from_branch: '',
      to_branch: '',
      message: '',
      file_path: '',
      send_date_time: '',
    },
  ]);

  let inboxArr = [];
  let branchesArr = [];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showFormModal) {
      fetchUnreadMessages();
      fetchData();
    }
  }, [showFormModal]);

  const fetchData = async () => {
    try {
      let branch_id = cookie.get('user_branch');
      const response = await api.get(`showUnreadMessagesCount/${branch_id}`);

      console.log(response.data[0].msg_count);
      setUnreadMsgCount(response.data[0].msg_count);
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
        const response = await api.get(`showUnreadMessagesCount/${branch_id}`);

        //console.log(response.data[0].msg_count);
        setUnreadMsgCount(response.data[0].msg_count);
      } catch (error) {
        console.log(error);
        return msg.error('Unable to fetch messages! 🙀');
      }
    }, 20000);
    return () => clearInterval(interval);
  };

  const toggleFormModal = () => {
    setShowFormModal(!showFormModal);
  };

  const toggleFormModal2 = () => {
    setShowFormModal2(!showFormModal2);
  };

  const fetchUnreadMessages = async () => {
    try {
      let branch_id = cookie.get('user_branch');
      const response = await api.get(`showUnreadMessages/${branch_id}`);
      console.log(response);
      response.data.branches.map((entity) => {
        branchesArr.push({
          label: entity.name,
          value: entity.id,
        });
      });
      response.data.messages.map((entity) => {
        inboxArr.push({
          id: entity.id,
          from_branch: response.data.branches.filter((branch) => {
            return branch.id === entity.from_branch_id;
          })[0].name,
          to_branch: response.data.branches.filter((branch) => {
            return branch.id === entity.to_branch_id;
          })[0].name,
          message: entity.message,
          send_date_time: entity.send_date_time,
          file_path: entity.file_path,
        });
      });

      setBranches(branchesArr);
      setInbox(inboxArr);
    } catch (error) {
      console.log(error);
      return msg.error('Unable to fetch messages! 🙀');
    }
  };

  const showCurrentMessage = async (id) => {
    try {
      const response = await api.get(`showMessageById/${id}/${'T'}`);
      console.log(response);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        setCurrentMessage({
          id: response.data.id,
          from_branch: branches.filter((branch) => {
            return branch.value == response.data.from_branch_id;
          })[0].label,
          to_branch: branches.filter((branch) => {
            return branch.value == response.data.to_branch_id;
          })[0].label,
          message: response.data.message,
          file_path: response.data.file_path,
          send_date_time: response.data.send_date_time,
        });
        //toggleFormModal();
        toggleFormModal2();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const delete_inBox = async () => {
    try {
      const response = await api.delete(
        `deleteMessageToBranch/${currentMessage.id}`,
      );
      console.log(response);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        toggleFormModal2();
        fetchData();
        fetchUnreadMessages();
        msg.success(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ cursor: 'pointer' }}>
      <div onClick={toggleFormModal}>
        <a id="approval" className="btn btn-sm">
          <span>
            <SafeFontAwesomeIcon icon={faEnvelope} color="white" size="lg" />
          </span>
          <span>
            {unreadMsgCount ? (
              <span className="badge badge-danger align-top rounded-0">
                {unreadMsgCount}
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
          <table style={{ width: '100%' }}>
            <tr style={{ background: '#fcf8e1' }}>
              <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                Date
              </th>
              <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                From
              </th>
              <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                To
              </th>
              <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                Message
              </th>
              <th
                style={{
                  border: '1px solid black',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                Attachment
              </th>
            </tr>
            {inbox.map((message) => {
              return (
                <tr
                  style={{ background: '#e0e0de', cursor: 'pointer' }}
                  onClick={() => showCurrentMessage(message.id)}
                >
                  <td
                    style={{
                      border: '1px solid black',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                    }}
                  >
                    {message.send_date_time}
                  </td>
                  <td
                    style={{
                      border: '1px solid black',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                    }}
                  >
                    {message.from_branch}
                  </td>
                  <td
                    style={{
                      border: '1px solid black',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                    }}
                  >
                    {message.to_branch}
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
                    {message.file_path !== null ? (
                      <a href={message.file_path} download>
                        Download
                      </a>
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              );
            })}
          </table>
        </div>
        <div className="modal-footer">
          <SystemButton
            type={'close'}
            method={toggleFormModal}
            showText={true}
          />
        </div>
      </FormModal>
      <FormModal
        moduleName="Messages inbox"
        modalState={showFormModal2}
        toggleFormModal={toggleFormModal2}
      >
        <div className="modal-body">
          <div className="row"></div>
          <div className="row">
            <div className="col-sm-6 form-group">
              <strong>Date Time : </strong>
              <label> {currentMessage.send_date_time}</label>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6 form-group">
              <strong>From Branch : </strong>
              <label> {currentMessage.from_branch}</label>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6 form-group">
              <strong>To Branch : </strong>
              <label> {currentMessage.to_branch}</label>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6 form-group">
              <strong>Message : </strong>
              <textarea
                className="form-control text_area"
                cols="150"
                rows="7"
                value={currentMessage.message}
              ></textarea>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6 form-group">
              <strong>Attachment : </strong>
              {currentMessage.file_path !== null ? (
                <a href={currentMessage.file_path} download>
                  Download
                </a>
              ) : (
                ''
              )}
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton showText={true} method={delete_inBox} type="delete" />
            <SystemButton
              showText={true}
              method={toggleFormModal}
              type="close"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default NavMsg;
