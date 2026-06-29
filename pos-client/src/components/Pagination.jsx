import React, { useState, useEffect } from 'react';

const Pagination = ({ rowsPerPage, totalRows, paginate }) => {
  /* --- State declarationss --- */

  const pageNumbers = [];

  /* --- End of state declarationss --- */

  /* --- Component functions --- */

  for (let i = 1; i <= Math.ceil(totalRows / rowsPerPage); i++) {
    pageNumbers.push(i);
  }

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div className="form-group row">
      <label className="pull-left col-sm-2 col-form-label">Pages </label>
      <nav className="col-sm-10">
        <ul className="pagination">
          {/* <li className="page-item disabled">
                        <a className="page-link" href="#" tabIndex="-1">Previous</a>
                    </li> */}
          {pageNumbers.length <= 1 ? (
            <label className="page-link">1</label>
          ) : (
            pageNumbers.map((number) => {
              return (
                <li key={number} className="page-item">
                  <a
                    className="page-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => paginate(number)}
                  >
                    {number}
                  </a>
                </li>
              );
            })
          )}
          {/* <li className="page-item">
                        <a className="page-link" href="#">Next</a>
                    </li> */}
        </ul>
      </nav>
    </div>
  );

  /* --- End of component renders --- */
};

export default Pagination;
