import React, { useState, useEffect } from 'react';
import { SafeFontAwesomeIcon } from '../../../components';
import { faBinoculars } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../../components';
import CustomerFind from './CustomerFind';
import PawningFind from './PawningFind';

function Find() {
  const [showFindModal, setShowFindModal] = useState(false);

  const [searchType, setSearchType] = useState('cusFind');

  const toggleCustomerFindModal = () => {
    setShowFindModal(!showFindModal);
  };

  const selectSearchType = (type) => {
    setSearchType(type);
  };

  return (
    <div>
      <div onClick={toggleCustomerFindModal}>
        <a
          id="find"
          className="btn btn-sm rounded-0"
          style={{
            backgroundColor: '#2867FD',
            color: '#fff',
            padding: '3px 10px 3px 10px',
          }}
        >
          <span>
            <SafeFontAwesomeIcon icon={faBinoculars} color="white" />
          </span>
          &nbsp; Find
        </a>
      </div>
      {showFindModal ? (
        <FormModal
          moduleName="Find"
          modalState={showFindModal}
          toggleFormModal={toggleCustomerFindModal}
        >
          <div className="modal-body">
            <div className="row">
              {/* Switches */}
              <div className="col-sm-6">
                <div
                  className="btn btn-sm btn-block"
                  onClick={() => selectSearchType('cusFind')}
                >
                  <a
                    className={
                      searchType === 'cusFind'
                        ? 'nav-link tab-active'
                        : 'nav-link tab-inactive'
                    }
                  >
                    Customer
                  </a>
                </div>
                {/* <button
                  className={
                    searchType === 'cusFind'
                      ? 'btn btn-block btn-sm btn-warning rounded-0 active'
                      : 'btn btn-block btn-sm btn-warning rounded-0'
                  }
                  onClick={() => selectSearchType('cusFind')}
                >
                  Customer
                </button> */}
              </div>
              <div className="col-sm-6">
                <div
                  className="btn btn-sm btn-block"
                  onClick={() => selectSearchType('pawnFind')}
                >
                  <a
                    className={
                      searchType === 'pawnFind'
                        ? 'nav-link tab-active'
                        : 'nav-link tab-inactive'
                    }
                  >
                    Pawning
                  </a>
                </div>
                {/* <button
                  className={
                    searchType === 'pawnFind'
                      ? 'btn btn-block btn-sm btn-warning rounded-0 active'
                      : 'btn btn-block btn-sm btn-warning rounded-0'
                  }
                  onClick={() => selectSearchType('pawnFind')}
                >
                  Pawning
                </button> */}
              </div>
            </div>
            <br />
            {searchType === 'cusFind' ? <CustomerFind /> : null}
            {searchType === 'pawnFind' ? <PawningFind /> : null}
          </div>
          <div className="modal-footer">
            <SystemButton
              type={'close'}
              method={toggleCustomerFindModal}
              showText={true}
            />
          </div>
        </FormModal>
      ) : null}
    </div>
  );
}

export default Find;
