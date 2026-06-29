import React, { useState, createRef, useEffect } from 'react';
import { SafeFontAwesomeIcon } from '.';
import {
  faEdit,
  faRedoAlt,
  faSearchPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from './Pagination';
import { msg } from '../services';

const ListView = ({
  columns,
  rows,
  edit,
  loadingState,
  searchAndFetch,
  showEditButton,
  showDeleteButton,
  actionsColumn,
  resetSearch,
  deleteFunc,
}) => {
  /* --- State declarationss --- */

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);

  const [selectedColumn, setSelectedColumn] = useState('select-column');

  const lastRowIndex = currentPage * rowsPerPage;

  const firstRowIndex = lastRowIndex - rowsPerPage;

  // let currentRows = rows.slice(firstRowIndex, lastRowIndex);

  const [dataRows, setDataRows] = useState([]);

  const [selColDataSummary, setSelColDataSummary] = useState([]);

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

  const selectColumnToSearch = (e) => {
    setSelectedColumn(e.target.value);
    let sel_column_data = dataRows
      .map((rr) => {
        return rr[e.target.value];
      })
      .join('');
    console.log('###Data columns array');
    console.log(sel_column_data);
    let unique = [...new Set(sel_column_data)];
    console.log('###unique array');
    console.log(unique);
    setSelColDataSummary(unique);
    searchKeyword.current.focus();
  };

  const searchList = async (e) => {
    const targetInput = e.target;
    // const inputName = targetInput.name;
    const inputValue = targetInput.value;
    searchAndFetch(inputValue, selectedColumn);
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
            setDataRows(
              rows.filter((row) => {
                return row[selectedColumn]
                  .toString()
                  .toLowerCase()
                  .includes(inputValue.toString().toLowerCase());
              }),
            );
            // searchAndFetch(inputValue, selectedColumn);
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

  return (
    <div>
      <div className="row">
        <div className="col-7">
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              {/* <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Dropdown</button> */}
              <select
                className="dropdown-toggle bg-dark-search rounded-left border text-light rounded-0"
                value={selectedColumn}
                onChange={selectColumnToSearch}
              >
                {/* <div className="dropdown-menu"> */}
                <option
                  value="select-column"
                  className="dropdown-item text-muted"
                  disabled
                >
                  Search in...
                </option>
                {columns.map((column) => {
                  return column.searchable ? (
                    <option
                      className="dropdown-item text-light"
                      key={column.name}
                      value={column.name}
                    >
                      {column.title}
                    </option>
                  ) : null;
                })}
                {/* </div> */}
              </select>
            </div>
            <input
              className="form-control form-control-sm"
              type="text"
              placeholder="Search column for..."
              list="colDataList"
              ref={searchKeyword}
              disabled={selectedColumn === 'select-column'}
              onKeyUp={searchList}
              onChange={searchList}
            />
            <datalist id="colDataList">
              {selColDataSummary.map((item, key) => (
                <option key={key} value={item} />
              ))}
            </datalist>
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
          {/* <input className="form-control form-control-sm" type="text" placeholder="Search list..." onKeyUp={searchList} /> */}
        </div>
      </div>

      <div
        className="row m-0 table-responsive header-fixed-scrollable"
        style={{ maxHeight: '25em' }}
      >
        <table className="table table-sm table-striped table-bordered">
          <thead className=" thead-dark">
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
                <tr key={filteredData.id}>
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
                          onClick={() => deleteFunc(filteredData)} // Redirect to a delete function instead of edit if one was built
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
      <br />
      <div className="row">
        <div className="col-7">
          <Pagination
            rowsPerPage={rowsPerPage}
            totalRows={dataRows.length}
            paginate={paginate}
          />
        </div>
      </div>
    </div>
  );

  /* --- End of component renders --- */
};

export default ListView;
