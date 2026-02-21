import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, SystemButton } from '../../../components';
import { MultiSelect } from 'react-multi-select-component';
import styles from '../pawning/BillTypes.module.css';
import { SafeFontAwesomeIcon } from '../../../components';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Messages = () => {
  const moduleName = 'Messages';

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);

  // Selected branches list
  const [effectiveBranches, setEffectiveBranches] = useState([]);

  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  const [branches, setBranches] = useState([]);

  const [users, setUsers] = useState([
    {
      id: '',
      name: '',
      branch_id: '',
    },
  ]);

  const [messages, setMessages] = useState([]);

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

  const [newData, setNewData] = useState({});

  const [selectedFile, setSelectedFile] = useState(null);

  let formData = new FormData();

  let branchesArr = [];
  let usersArr = [];
  let messagesArr = [];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setNewData({
      ...newData,
      to_branch_ids: effectiveBranches,
    });
  }, [effectiveBranches]);

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `showAllMessages/${cookie.get('user_branch')}`,
      );
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      console.log(response.data);

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        response.data.branches.map((entity) => {
          branchesArr.push({
            // id: entity.id,
            // code: entity.code,
            // name: entity.name,
            label: entity.name,
            value: entity.id,
          });
        });
        response.data.messages.map((entity) => {
          messagesArr.push({
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
      }
      console.log(messagesArr);
      setMessages(messagesArr);
      setBranches(branchesArr);
      setIsLoading(false);
    } catch (error) {
      return console.log(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      from_user_id: cookie.get('user_id'),
      from_branch_id: cookie.get('user_branch'),
      to_user_id: 0,
      [inputName]: inputValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    buildPayload();

    save();
  };

  const save = async () => {
    try {
      const response = await api.post('sendMessage').values(formData);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        resetForm();
        fetchData();
        msg.success(response.data);
      }
    } catch (error) {
      return console.log(error);
    }
  };

  const handleUpload = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const buildPayload = async () => {
    return new Promise((resolve, reject) => {
      formData.set('id', newData.id);
      formData.set('from_user_id', newData.from_user_id);
      formData.set('to_user_id', newData.to_user_id);
      formData.set('from_branch_id', newData.from_branch_id);
      formData.append('to_branch_ids', JSON.stringify(effectiveBranches));
      formData.set('message', newData.message);
      formData.append('attachment', selectedFile);
    });
  };

  const send = (e) => {
    e.preventDefault();
  };

  const resetForm = () => {
    setNewData({
      from_user_id: cookie.get('user_id'),
      from_branch_id: cookie.get('user_branch'),
      to_user_id: 0,
      message: '',
    });
    setSelectedFile(null);
    setEffectiveBranches([]);
    setBranches('');
  };

  const showCurrentMessage = async (id) => {
    try {
      const response = await api.get(`showMessageById/${id}/${'F'}`);
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
        toggleFormModal();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const delete_outBox = async () => {
    try {
      const response = await api.delete(
        `deleteMessageFromBranch/${currentMessage.id}`,
      );
      console.log(response);
      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        resetForm();
        toggleFormModal();
        fetchData();
        msg.success(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <FormModal
        moduleName="Messages Outbox"
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
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
            <SystemButton
              showText={true}
              method={delete_outBox}
              type="delete"
            />
            <SystemButton
              showText={true}
              method={toggleFormModal}
              type="close"
            />
          </div>
        </div>
      </FormModal>

      <div className="row">
        <div className="col-sm-6">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="row compactForm">
              <div className="col-sm-10 form-group">
                <label htmlFor="Branches">To Branch</label>
                <br />
                <MultiSelect
                  id="to_branch_ids"
                  name="to_branch_ids"
                  selectAllLabel={'All Branches'}
                  options={branches}
                  value={effectiveBranches}
                  onChange={setEffectiveBranches}
                  labelledBy={'Branches'}
                  className={styles.multiselect}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-sm-10 form-group">
                <label htmlFor="Branches">Message</label>
                <textarea
                  className="form-control"
                  cols="150"
                  rows="7"
                  id="message"
                  name="message"
                  onChange={handleValueChange}
                  value={newData.message}
                  placeholder="Your message ..."
                  required
                ></textarea>
                <br />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-10 form-group">
                <label htmlFor="Branches">Attachment</label>&nbsp;&nbsp;
                <input
                  type="file"
                  id="attachment"
                  name="attachment"
                  accept=".txt,.pdf,.xls,.xlsx"
                  onChange={handleUpload}
                  value={selectedFile !== null ? selectedFile.filename : ''}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-10 form-group">
                <button
                  type="submit"
                  className="btn btn-info btn-block btn-sm rounded-0 shadow-sm text-center"
                >
                  <span>
                    <SafeFontAwesomeIcon icon={faPaperPlane} size="sm" />
                  </span>
                  &nbsp; Send Message
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="col-sm-6">
          <h5 style={{ textAlign: 'center' }}>Sent</h5>
          <div
            style={{
              background: 'gray',
              height: '375px',
              overflowY: 'scroll',
              wdith: 'auto',
              fontSize: 9,
            }}
          >
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
              {messages.map((message) => {
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
        </div>
      </div>
    </div>
  );
};

export default Messages;
