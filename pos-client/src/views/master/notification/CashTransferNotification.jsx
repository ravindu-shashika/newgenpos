import React, { useState, useEffect } from 'react';
import { api, cookie, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const CashTransferNotification = () => {
  // Module name
  const moduleName = 'Gold Types';

  /* --- State declarationss --- */

  const [entities, setEntities] = useState([]);

  const [newData, setNewData] = useState({
    category: '',
    display_name: '',
    user_id: cookie.get('user_id'),
  });

  // Data loading status
  const [isLoading, setIsLoading] = useState(false);
 
  // Form modal state
  const [showModalState, setShowModalState] = useState(false);

  // Data edit state
  const [isEdit, setIsEdit] = useState(false); 

  // Selected data
  const [selectedId, setSelectedId] = useState('');

  // List view states
  const dataColumns = [
    {
      title: 'Category',
      name: 'category',
      class: 'text-center',
      searchable: true,
    },
    {
      title: 'Display Name',
      name: 'display_name',
      class: 'text-center',
      searchable: true,
    },
  ];
  let dataRows = [];

  /* --- End of state declarations --- */

 
  /* --- Component functions --- */

  

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default CashTransferNotification;
