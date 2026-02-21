import React, { useState, useEffect } from 'react';
import { FormModal, SystemButton, SearchTable } from './index';
import { api, msg } from './../services';

const ListSelection = ({ toggleFormModal, showModalState, selectRow }) => {
  //Module name
  const moduleName = '';

  /* --- State declarationss --- */

  // Data loading status
  const [entities, setEntities] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  let dataColumns = [
    { title: 'NIC', name: 'nicno', searchable: true },
    { title: 'Name', name: 'cusname', searchable: true },
    { title: 'Address', name: 'address', searchable: true },
    { title: 'Email', name: 'email', searchable: true },
    { title: 'Mobile', name: 'mobile', searchable: true },
  ];

  let dataRows = [];

  useEffect(() => {
    if (showModalState === true) {
      fetchData();
    }
  }, [showModalState]);

  const editRow = (dataObj) => {
    selectRow(dataObj);
    toggleFormModal();
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const response = await api.get('customers');
      dataRows = [];

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      }
      response.data.data.map((entity) => {
        return dataRows.push({
          customer_id: entity.customer_id,
          customer_no: entity.customer_no,
          bc: entity.bc,
          nicno: entity.nicno,
          cusname: entity.cusname,
          address: entity.address ? entity.address : '',
          address2: entity.address2 ? entity.address2 : '',
          telNo: entity.telNo ? entity.telNo : '',
          mobile: entity.mobile ? entity.mobile : '',
          email: entity.email ? entity.email : '',
          notes: entity.notes ? entity.notes : '',
          isblackListed: entity.isblackListed,
        });
      });

      setEntities(dataRows);

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to fetch data!');
    }
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `customers/search/${searchPhrase}/${selectedColumn}`,
      );

      dataRows = [];

      if (response.data.total === 0) {
        msg.warning(`No results returned your search!`);
      } else {
        response.data.data.map((entity) => {
          return dataRows.push({
            customer_id: entity.customer_id,
            customer_no: entity.customer_no,
            bc: entity.bc,
            nicno: entity.nicno,
            cusname: entity.cusname,
            address: entity.address ? entity.address : '',
            address2: entity.address2 ? entity.address2 : '',
            telNo: entity.telNo ? entity.telNo : '',
            mobile: entity.mobile ? entity.mobile : '',
            email: entity.email ? entity.email : '',
            notes: entity.notes ? entity.notes : '',
            isblackListed: entity.isblackListed,
          });
        });
        setEntities(dataRows);
      }

      setIsLoading(false);
    } catch (error) {
      msg.error('Unable to search data!');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="70%"
      >
        <div className="container-fluid">
          <SearchTable
            columns={dataColumns}
            rows={entities}
            edit={editRow}
            loadingState={isLoading}
            searchAndFetch = {searchAndFetch}
            showEditButton
            rowKey="customer_id"
          />
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

export default ListSelection;
