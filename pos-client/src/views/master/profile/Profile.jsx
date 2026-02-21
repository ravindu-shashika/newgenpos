import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const Profile = () => {
    //Module name
    const moduleName = 'Profile';

    /* --- State declarationss --- */

    // Data states

    const [newData, setNewData] = useState({
        current_password: '',
        // new_email: '',
        new_password: '',
        // conf_new_password: '',
        user_id: cookie.get('user_id'),
        user_email: cookie.get('user_email'),
        user_name: cookie.get('user_name'),
    });

    const [entities, setEntities] = useState([]);

    // Form modal state
    let is_passwords_match = true;

    /* --- Component functions --- */

    const handleSubmit = async (e) => {
        e.preventDefault();

        await submitData();

        resetAll();
    };

    const handleValueChange = (e) => {
        const targetInput = e.target;
        const inputName = targetInput.name;
        const inputValue = targetInput.value;

        if (inputName === 'conf_new_password') {
            console.log(inputName);
            if (inputValue === newData.new_password) {
              is_passwords_match = true;
            } else {
              is_passwords_match = false;
            }
          } else {
            setNewData({
              ...newData,
              [inputName]: inputValue,
            });
          }

        // setNewData({
        //     ...newData,
        //     [inputName]: inputValue,
        // });
    };

    const submitData = async () => {
        if(is_passwords_match){
            try {
                const response = await api.post('change-user-password').values(newData);
            
                if (response.data.error) {
                    return msg.error(response.data.error);
                } else {
                  return msg.success(response.data.success);
                }
              } catch (error) {
                return console.log(error);
              }
        }else {
            msg.error(`Password and Confirmation Password fields doesn't match`);
          }
    };

    const resetAll = () => {
        setNewData({
            current_password: '',
            // new_email: '',
            new_password: '',
            user_id: cookie.get('user_id'),
            user_email: cookie.get('user_email'),
        });

        document.getElementById('conf_new_password').value = ''
      };

    /* --- End of component functions --- */

    /* --- Component renders --- */

    return (
        <div>
            <h5 className="text-center">{moduleName+ ' ' + '(' + newData.user_name + ')'}</h5>
            <br />

            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="row form-group">
                        <label htmlFor="email" className="col-sm-2 col-form-label">Email</label>
                        <div className="col-sm-4">
                            <input
                                type="text"
                                name="email"
                                id="email"
                                maxLength="20"
                                minLength="10"
                                className="form-control form-control-sm"
                                value={newData.user_email}
                                disabled
                            />
                        </div>
                        <label htmlFor="current_password" className="col-sm-2 col-form-label">Current Password</label>
                        <div className="col-sm-4">
                            <input
                                type="password"
                                name="current_password"
                                id="current_password"
                                placeholder="Enter Current Password"
                                maxLength="20"
                                minLength="6"
                                className="form-control form-control-sm"
                                value={newData.current_password}
                                onChange={handleValueChange}
                            />
                        </div>
                    </div>

                    <div className="row form-group">
                        {/* <label htmlFor="new_email" className="col-sm-2 col-form-label">New Email</label>
                        <div className="col-sm-4">
                            <input
                                type="text"
                                name="new_email"
                                id="new_email"
                                className="form-control form-control-sm"
                                value={newData.new_email}
                                onChange={handleValueChange}
                            />
                        </div> */}
                        <label htmlFor="new_password" className="col-sm-2 col-form-label">New Password</label>
                        <div className="col-sm-4">
                            <input
                                type="password"
                                name="new_password"
                                id="new_password"
                                maxLength="20"
                                minLength="6"
                                className="form-control form-control-sm"
                                value={newData.new_password}
                                onChange={handleValueChange}
                            />
                        </div>

                        <label htmlFor="conf_new_password" className="col-sm-2 col-form-label">Confirm New Password</label>
                        <div className="col-sm-4">
                            <input
                                type="password"
                                name="conf_new_password"
                                id="conf_new_password"
                                maxLength="20"
                                minLength="6"
                                className="form-control form-control-sm"
                                value={newData.conf_new_password}
                                onChange={handleValueChange}
                            />
                        </div>
                    </div>

                    <div className="row form-group">
                        
                    </div>
                </div>
                <div className="modal-footer">
                    <SystemButton type={'save'} showText={true} />
                </div>
            </form>
        </div>

    );

    /* --- End of component renders --- */
};

export default Profile;
