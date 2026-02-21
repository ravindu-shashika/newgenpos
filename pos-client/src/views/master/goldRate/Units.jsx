import React, { useState, useEffect } from 'react';
import { api, msg } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';

const Units = () => {
  const moduleName = 'Unit';

  /* --- State declarations --- */

  const [entities, setEntities] = useState([]);
  const [baseUnitList, setBaseUnitList] = useState([]);

  const [newData, setNewData] = useState({
    unit_code: '',
    unit_name: '',
    base_unit: '',
    operator: '',
    operation_value: '',
  });

  const [showModalState, setShowModalState] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  const dataColumns = [
    { title: 'Code', name: 'unit_code', searchable: true },
    { title: 'Name', name: 'unit_name', searchable: true },
    { title: 'Base Unit', name: 'base_unit_name', searchable: false },
    { title: 'Operator', name: 'operator', searchable: false },
    { title: 'Operation Value', name: 'operation_value', searchable: false },
  ];

  /* --- End of state declarations --- */

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // if (showModalState === false) {
    //   resetForm();
    // }
  }, [showModalState]);

  /* --- Component functions --- */

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('units');
      const data = response?.data?.data ?? response?.data ?? response ?? [];
      const list = Array.isArray(data) ? data : [];
      const rows = list.map((entity) => ({
        id: entity.id,
        unit_code: entity.unit_code ?? entity.code ?? '',
        unit_name: entity.unit_name ?? entity.name ?? '',
        base_unit: entity.base_unit ?? entity.base_unit_id ?? '',
        base_unit_name: entity.base_unit_name ?? entity.base_unit_name ?? '—',
        operator: entity.operator ?? '',
        operation_value: entity.operation_value ?? '',
      }));
      setEntities(rows);
    } catch (error) {
      console.error(error);
      msg.error('Unable to fetch units!');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBaseUnits = async () => {
    try {
      const response = await api.get('units/base');
      const data = response?.data?.data ?? response?.data ?? response ?? [];
      const list = Array.isArray(data) ? data : [];
      setBaseUnitList(list.filter((u) => !u.base_unit && !u.base_unit_id));
    } catch (err) {
      console.error(err);
      setBaseUnitList([]);
    }
  };

  const searchAndFetch = async () => {
    fetchData();
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    // const inputValue = targetInput.value;
    const inputValue =
      targetInput.type === 'checkbox' ? targetInput.checked : targetInput.value;

    setNewData({
      ...newData,
      [inputName]: inputValue,
    });
  };

  const editRow = (dataObj) => {
    setNewData({
      unit_code: dataObj.unit_code ?? '',
      unit_name: dataObj.unit_name ?? '',
      base_unit: dataObj.base_unit ?? '',
      operator: dataObj.operator ?? '',
      operation_value: dataObj.operation_value ?? '',
    });
    setSelectedId(dataObj.id ?? '');
    setIsEdit(true);
    setShowModalState(true);
  };

  const toggleFormModal = () => {
    setShowModalState(!showModalState);
    if (!showModalState) fetchBaseUnits();
    if (!showModalState && !isEdit) resetForm();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newData.unit_code?.trim() || !newData.unit_name?.trim()) {
      msg.error('Code and Name are required.');
      return;
    }
    await save();
    resetForm();
    setShowModalState(false);
    fetchData();
  };

  const save = async () => {
    const payload = {
      unit_code: newData.unit_code?.trim(),
      unit_name: newData.unit_name?.trim(),
      base_unit: newData.base_unit || null,
      operator: newData.operator || null,
      operation_value: newData.operation_value ? Number(newData.operation_value) : null,
    };
    if (isEdit && selectedId) {
      payload.id = selectedId;
    }
    try {
      const response = await api.post('save-unit').values(payload);
      const resData = response?.data ?? response;
      if (response.error) {
        Object.values(response.error).forEach((err) => msg.error(Array.isArray(err) ? err[0] : err));
        return;
      }
      msg.success(resData?.message ?? 'Unit saved successfully.');
      setShowModalState(false);
      setIsEdit(false);
      setSelectedId('');
    } catch (error) {
      msg.error(error?.message ?? 'Unable to save unit.');
    }
  };

  const resetForm = () => {
    setNewData({
      unit_code: '',
      unit_name: '',
      base_unit: '',
      operator: '',
      operation_value: '',
    });
    setIsEdit(false);
    setSelectedId('');
  };

  const resetSearch = () => {
    setEntities([]);

    fetchData();
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <br />
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="row">
        <div className="col-sm-2">
          <SystemButton
            type="add-new"
            method={toggleFormModal}
            showText
            btnText="Add Unit"
          />
        </div>
      </div>

      {/* Unit create/edit modal */}
      <FormModal
        moduleName={isEdit ? 'Edit Unit' : 'Add Unit'}
        modalState={showModalState}
        toggleFormModal={toggleFormModal}
        width="50%"
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body text-left">
            <p className="italic">
              <small>The field labels marked with * are required input fields.</small>
            </p>
            <div className="form-group">
              <label>Code *</label>
              <input
                type="text"
                name="unit_code"
                className="form-control"
                value={newData.unit_code}
                onChange={handleValueChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="unit_name"
                className="form-control"
                value={newData.unit_name}
                onChange={handleValueChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Base Unit</label>
              <select
                name="base_unit"
                id="base_unit_create"
                className="form-control"
                value={newData.base_unit}
                onChange={handleValueChange}
              >
                <option value="">No Base Unit</option>
                {baseUnitList.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit_name ?? unit.name ?? unit.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group operator">
              <label>Operator</label>
              <select
                name="operator"
                className="form-control"
                value={newData.operator}
                onChange={handleValueChange}
              >
                <option value="">Select an operator</option>
                <option value="*">*</option>
                <option value="/">/</option>
              </select>
            </div>
            <div className="form-group operation_value">
              <label>Operation Value</label>
              <input
                type="number"
                name="operation_value"
                className="form-control"
                placeholder="Enter operation value"
                step="any"
                value={newData.operation_value}
                onChange={handleValueChange}
              />
            </div>
            <div className="form-text text-muted mt-2 mb-4">
              <strong>Example conversions:</strong>
              <br />
              1 Dozen = 1<strong>*</strong>12 Piece
              <br />
              1 Gram = 1<strong>/</strong>1000 KG
            </div>
          </div>
          <div className="modal-footer">
            <SystemButton type="close" method={toggleFormModal} showText />
            <SystemButton
                  type="no-form-save"
                  showText
                  btnText={isEdit ? 'Update' : 'Save'}
                  method={handleSubmit}
                />
          </div>
        </form>
      </FormModal>
      <br />
      <br />

      <ListView
        columns={dataColumns}
        rows={entities}
        edit={editRow}
        loadingState={isLoading}
        searchAndFetch={searchAndFetch}
        actionsColumn
        showEditButton
        resetSearch={resetSearch}
        rowKey="unit_code"
      />
      {/* End of list view component */}
    </div>
  );

  /* --- End of component renders --- */
};

export default Units;
