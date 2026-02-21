import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import SafeFontAwesomeIcon from '../../../components/SafeFontAwesomeIcon';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../../components';
import { useLocation, useNavigate } from 'react-router-dom';

const BranchSelector = () => {
  const [showBranchSelectModal, setShowBranchSelectModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [branchList, setBranchList] = useState([]);

  const [currentBranch, setCurrentBranch] = useState({
    id: cookie.get('user_branch'),
    code: '',
    name: cookie.get('user_branch_name'),
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (showBranchSelectModal === true) {
      fetchData();
    }
  }, [showBranchSelectModal]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log(cookie.get('user_branch_name')); 
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

  const handleValueChange = (e) => {
    try {
      console.log(e.target.value); 
      branchList.map((branch) => {
        if (parseInt(e.target.value) === parseInt(branch.bc_no)) {
          setCurrentBranch({
            id: branch.bc_no,
            code: branch.bc,
            name: branch.name,
          });
          cookie.set('user_branch', branch.bc_no);
          cookie.set('user_branch_name', branch.name);
          navigate('/temp');
          navigate(-1);
        }
      });
      console.log(cookie.get('user_branch_name')); 
      toggleBrancheslModal();
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
              <option value={branch.bc_no}>
                {branch.bc} - {branch.name}
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
        // onClick={
        //   parseInt(
        //     cookie.get('permissions')
        //       ? cookie.get('permissions').show_branch_selector
        //       : 0,
        //   ) === 1
        //     ? toggleBrancheslModal
        //     : null
        // }
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
