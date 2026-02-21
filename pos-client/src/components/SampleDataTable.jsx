import React, { useEffect, useRef ,Component} from "react";
import $ from "jquery";
// import 'datatables.net';
// import "datatables.net-dt/css/jquery.dataTables.min.css";
import { faEdit, faPenAlt, faTrash, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { SafeFontAwesomeIcon } from '.';

const SampleDataTable = ({ data, columns, onDelete, onEdit }) => {
    const tableRef = useRef(null);
  
    useEffect(() => {
      // Initialize the DataTable plugin when the component mounts
      $(tableRef.current).DataTable();
  
      return () => {
        // Destroy the DataTable instance when the component unmounts
        $(tableRef.current).DataTable().destroy(true);
        // $(tableRef.current).DataTable().reload(true);
      };
    }, []);
  
    return (
        <React.Fragment>
      <table ref={tableRef} className="table-striped table-sm">
        <thead>
          <tr style={{ backgroundColor: '#ff9c4b'}}>
            {
                columns.map(column => {
                    return <th>{column.title}</th>
                })
            }
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {
                columns.map(column => {
                    if (column.haveData == true){
                        return <td>{item[column.name]}</td>
                    }
                })
              }
              <td>
                <button type="button" className="btn btn-sm btn-outline-info" style={{ padding: '1px 5px 1px 5px' }} onClick={() => onEdit(item)}>
                    <SafeFontAwesomeIcon icon={faEdit} size="xs" />
                </button>
                &nbsp;
                <button type="button" className="btn btn-sm btn-outline-danger" style={{ padding: '1px 5px 1px 5px' }} onClick={() => onDelete(item)}>
                    <SafeFontAwesomeIcon icon={faTrash} size="xs" />    
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </React.Fragment>
    );
  };

export default SampleDataTable;