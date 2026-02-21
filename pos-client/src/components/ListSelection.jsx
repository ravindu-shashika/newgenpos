import React, { useState, useEffect } from 'react';
import { FormModal, SystemButton, SearchTable } from './index';
import { msg } from './../services';

const ListSelection = ({
  toggleFormModal,
  showModalState,
  dataColumns,
  entities,
  selectRow
  
}) => {
  //Module name
  const moduleName = '';

  /* --- State declarationss --- */

  // Data loading status

  const [isLoading, setIsLoading] = useState(false);
  // const dataColumns = [
  //   { title: 'Code', name: 'id', searchable: true },
  //   { title: 'Name', name: 'name', searchable: true },
  //   // { title: 'Is Salesman', name: 'is_salesman', searchable: true },
  // ];

  useEffect(() => {
    if (showModalState === true) {
    }
  }, [showModalState]);

  const editRow = (dataObj) => {
    selectRow(dataObj)
    toggleFormModal();
  };

  const searchAndFetch = async (searchPhrase, selectedColumn) => {
    // try {
    //   setIsLoading(true);

    //   const response = await api.get(
    //     `vendors/search/${searchPhrase}/${selectedColumn}`,
    //   );

    //   dataRows = [];

    //   console.log(response);

    //   if (response.data.total === 0) {
    //     msg.warning(`No results returned your search!`);
    //   } else {
    //     response.data.data.map((entity) => {
    //       return dataRows.push({
    //         code: entity.code,
    //         name: entity.name,
    //         nic: entity.nic,
    //         description: entity.description,
    //         oc: entity.oc,
    //         action_date: entity.action_date,
    //         is_cash_customer: entity.is_cash_customer,
    //         address: entity.address,
    //         tp: entity.tp,
    //         mobile: entity.mobile,
    //         fax: entity.fax,
    //         e_mail: entity.e_mail,
    //         inactive: entity.inactive,
    //         cash_customer_status: entity.is_cash_customer
    //           ? 'Cash Customer'
    //           : 'Not Cash Customer',
    //         active_status: entity.inactive ? 'Inactive' : 'Active',
    //       });
    //     });

    //     setEntities(dataRows);
    //   }
    // } catch (error) {
    //   msg.error(`Unable to search data! --> ${error}`);
    //   return console.log(error);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const resetSearch = () => {
   
  };

  return (
    <div>
      <FormModal
        moduleName={moduleName}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="50%"
      >
     
        <div className="container-fluid">
            <SearchTable
                columns={dataColumns}
                rows={entities}
                edit={editRow}
                loadingState={isLoading}
                actionsColumn
                showEditButton                
                rowKey="id"
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
