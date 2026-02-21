import React, { useState, useEffect } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faBinoculars } from '@fortawesome/free-solid-svg-icons';
import { SystemButton, FormModal } from '../../../components';
import CustomerFind from './CustomerFind';
import PawningFind from './PawningFind';

const FindFormSeparateWindow = () => {
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
            <div className="row">
                <h3 className="col-sm-12 text-center">Find Form</h3>
            </div>
            <div className="row">
                <div className="col-sm-6">
                    <div className="btn btn-sm btn-block" onClick={() => selectSearchType('cusFind')} >
                        <a className={ searchType === 'cusFind' ? 'nav-link tab-active' : 'nav-link tab-inactive' } >
                            Customer
                        </a>
                    </div>
                </div>
                <div className="col-sm-6">
                    <div className="btn btn-sm btn-block" onClick={() => selectSearchType('pawnFind')} >
                        <a className={ searchType === 'pawnFind' ? 'nav-link tab-active' : 'nav-link tab-inactive' } >
                            Pawning
                        </a>
                    </div>
                </div>
            </div>
            <br />
            {/* {searchType === 'cusFind' ? <CustomerSearchTable /> : null} */}
            {searchType === 'cusFind' ? <CustomerFind /> : null}
            {searchType === 'pawnFind' ? <PawningFind /> : null}
      </div>
    );
  }

export default FindFormSeparateWindow;
