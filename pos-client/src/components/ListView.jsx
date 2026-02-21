import React, { useState, createRef, useEffect } from 'react';
import { SafeFontAwesomeIcon } from '.';
import {
  faEdit,
  faRedoAlt,
  faSearchPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';
import { msg } from './../services';
import Select from "react-select";
const ListView = ({
  columns,
  rows,
  edit,
  loadingState,
  searchAndFetch,
  showEditButton,
  showDeleteButton,
  onDelete,
  actionsColumn,
  resetSearch,
  rowKey,
}) => {
  /* --- State declarationss --- */

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  const [selectedColumn, setSelectedColumn] = useState(null); // Set as null initially


  const lastRowIndex = currentPage * rowsPerPage;

  const firstRowIndex = lastRowIndex - rowsPerPage;

  // let currentRows = rows.slice(firstRowIndex, lastRowIndex);

  const [dataRows, setDataRows] = useState([]);

  // DOM node refs
  const searchKeyword = createRef();

  /* --- End of state declarationss --- */

  useEffect(() => {
    setDataRows(rows);
  }, [rows]);

  /* --- Component functions --- */

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const selectColumnToSearch = (selectedOption) => {
    setSelectedColumn(selectedOption); // Store the whole object
    searchKeyword.current.focus();
  };
  

  const searchList = async (e) => {
    const targetInput = e.target;
    // const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (!inputValue) {
      setDataRows(rows);
    } else {
      switch (e.keyCode) {
        case 13:
          if (inputValue.length < 2) {
            msg.warning(`Enter atleast 2 character to search..`);
          } else if (selectedColumn === 'select-column') {
            msg.warning(`Select a valid column to search..`);
          } else {
            searchAndFetch(inputValue, selectedColumn);
          }
          break;

        case 8:
          setDataRows(
            rows.filter((row) => {
              return row[selectedColumn]
                .toString()
                .toLowerCase()
                .includes(inputValue.toString().toLowerCase());
            }),
          );
          break;

        case 46:
          setDataRows(
            rows.filter((row) => {
              return row[selectedColumn]
                .toString()
                .toLowerCase()
                .includes(inputValue.toString().toLowerCase());
            }),
          );
          break;

        default:
          setDataRows(
            dataRows.filter((row) => {
              return row[selectedColumn]
                .toString()
                .toLowerCase()
                .includes(inputValue.toString().toLowerCase());
            }),
          );
          break;
      }
    }
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  if (loadingState) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const options = columns
  .filter((column) => column.searchable) // Filter only searchable columns
  .map((column) => ({
    value: column.name, // Set value
    label: column.title, // Display title
  }));

  return (
    <div>
      <div className="row">
        <div className="col-7">
          <div className="input-group mb-4">
            <div className="input-group-prepend">
                <Select
                  name="branch_id"
                  id="branch_id"
                  className="small-select"
                  classNamePrefix="small"
                  options={columns.map((column) => ({
                    value: column.name,
                    label: `${column.title}`,
                  }))}
                  menuPortalTarget={document.body}
                  menuPosition="absolute"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "30px",
                      fontSize: "12px",
                    }),
                    dropdownIndicator: (provided) => ({
                      ...provided,
                      padding: "4px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      fontSize: "12px",
                    }),
                  }}
                  value={selectedColumn} // Use the full object, not just `e.value`
                  onChange={selectColumnToSearch}
                />
            </div>
            <input
              className="form-control form-control-sm"
              type="text"
              placeholder="Search column for..."
              ref={searchKeyword}
              disabled={selectedColumn === 'select-column'}
              onKeyUp={searchList}
            />
            &nbsp;
            <div className="input-group-prepend">
              <button className="btn btn-sm btn-secondary">
                <SafeFontAwesomeIcon icon={faSearchPlus} size="xs" />
              </button>
            </div>
            &nbsp;
            <div className="input-group-prepend">
              <button
                className="btn btn-sm btn-danger"
                onClick={() => resetSearch()}
              >
                <SafeFontAwesomeIcon icon={faRedoAlt} size="xs" />
              </button>
            </div>
          </div>
        </div>
        <div className="col-5">
          <Pagination
            rowsPerPage={rowsPerPage}
            totalRows={dataRows.length}
            paginate={paginate}
          />
        </div>
      </div>

      <div
        className="row table-responsive header-fixed-scrollable"
        style={{ maxHeight: '25em' }}
      >
        <table className="table table-sm table-striped table-bordered">
          <thead className="text-center thead-dark">
            <tr>
              {columns.map((column) => {
                return (
                  <th scope="col" key={column.name}>
                    {column.title}
                  </th>
                );
              })}
              {actionsColumn ? (
                <th scope="col" className="text-center">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {dataRows.slice(firstRowIndex, lastRowIndex).map((filteredData) => {
              return (
                <tr key={rowKey ? filteredData[rowKey] : filteredData.id}>
                  {columns.map((column) => {
                    return (
                      <td key={column.name} className={column.class}>
                        {filteredData[column.name]}
                      </td>
                    );
                  })}
                  {actionsColumn ? (
                    <td className="text-center">
                      {showEditButton ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          style={{ padding: '1px 5px 1px 5px' }}
                          onClick={() => edit(filteredData)}
                        >
                          <span>
                            <SafeFontAwesomeIcon icon={faEdit} size="xs" />
                          </span>
                        </button>
                      ) : null}
                      &nbsp;
                      {showDeleteButton ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          style={{ padding: '1px 5px 1px 5px' }}
                          onClick={() => (onDelete ? onDelete(filteredData) : edit(filteredData))}
                        >
                          <span>
                            <SafeFontAwesomeIcon icon={faTrash} size="sm" />
                          </span>
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default ListView;
