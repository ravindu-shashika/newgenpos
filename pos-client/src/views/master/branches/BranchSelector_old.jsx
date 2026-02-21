import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { SafeFontAwesomeIcon } from '../../../components';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../../components';
import { useLocation, useHistory } from 'react-router-dom';
// import { async } from 'exceljs/dist/exceljs';

const BranchSelector = () => {
  const [showBranchSelectModal, setShowBranchSelectModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [branchList, setBranchList] = useState([]);

  const [currentBranch, setCurrentBranch] = useState({
    // id: cookie.get('user_branch'),
    // code: '',
    // name: cookie.get('user_branch_name'),
    id: localStorage.getItem('user_branch'),
    code: '',
      // name: cookie.get('user_branch_name'),
    name: localStorage.getItem('user_branch_name'),

  });

  const history = useHistory();

  useEffect(() => {
    if (showBranchSelectModal === true) {
      fetchData();
    }
  }, [showBranchSelectModal]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(`all-branches`);

      setBranchList(response.data);
    } catch (error) {
      console.log(error);
      return msg.error('Unable to fetch branches! 🙀');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBrancheslModal = () => {
    setShowBranchSelectModal(!showBranchSelectModal);
  };

  const options = {
    domain: `${process.env.REACT_APP_DOMAIN}`,
    path: '/',
    // expires: new Date(Date.now() + expiresAt),
  };

  const handleValueChange = async (e) => {
    console.log(options);
    try {
      branchList.map((branch) => {
        const branchid = localStorage.getItem('user_branch');
        if (parseInt(e.target.value) === parseInt(branchid)) {
            localStorage.setItem('user_branch', branch.id);
            localStorage.setItem('user_branch_code', branch.code);
            localStorage.setItem('user_branch_name', branch.name);
          setCurrentBranch({
            // id: branch.id,
            // code: branch.code,
            // name: branch.name,
            id: localStorage.getItem('user_branch'),
            code: localStorage.getItem('user_branch_code'),
            name: localStorage.getItem('user_branch_name'),
          });
          cookie.remove('user_branch', options);
          cookie.remove('user_branch_name', options);
          const branch_name = localStorage.getItem('user_branch_name');
        const branch_id = localStorage.getItem('user_branch');
        // cookie.remove('user_branch_name', options);
        cookie.set('user_branch_name', branch_name, options);
        cookie.set('user_branch', branch_id, options);
        //   cookie.set('user_branch', branch.id, options);
        //   cookie.set('user_branch_name', branch.name, options);
          //sessionStorage.setItem("user_branch", branch.id);
          //set session to backend
          const c = api.get('setSession/' + cookie.get('user_id') + '/' + cookie.get('user_roles') + '/' + branch.id);
          history.push('/temp');
          history.goBack();
        }
      });
    } catch (error) {
      msg.error(error);
    } finally {
    }
  };

  const BranchSelect = () => {
    return (
      <div>
        <select
          name="branch"
          id="branch"
          className="form-control form-control-sm"
          value={currentBranch.id}
          onChange={handleValueChange}
        >
          {branchList.map((branch) => {
            return (
              <option value={branch.id}>
                {branch.code} - {branch.name}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  return (
    <div>
      <div
        onClick={
          parseInt(
            cookie.get('permissions')
              ? cookie.get('permissions').show_branch_selector
              : 0,
          ) === 1
            ? toggleBrancheslModal
            : null
        }
      >
        <a id="approval" className="btn btn-sm">
          <SafeFontAwesomeIcon icon={faBuilding} size="lg" color="white" />
          &nbsp;
          <strong
            className="navbarText"
            style={{ marginBottom: '0px', padding: '0' }}
          >
            {cookie.get('user_branch_name')}
          </strong>
        </a>
      </div>
      {showBranchSelectModal ? (
        <FormModal
          moduleName="Change Current Branch"
          modalState={showBranchSelectModal}
          toggleFormModal={toggleBrancheslModal}
        >
          <div className="modal-body">
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
              <BranchSelect />
            )}
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleBrancheslModal}
              showText={true}
            />
          </div>
        </FormModal>
      ) : null}
    </div>
  );
};

export default BranchSelector;
