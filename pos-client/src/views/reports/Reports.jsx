import React from 'react';
import { cookie } from '../../services';
import SafeFontAwesomeIcon from '../../components/SafeFontAwesomeIcon';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';

function Reports() {
  return (
    <div>
      {/* Dedigama testing server */}
      <form
        action={`${process.env.REACT_APP_DEFAULT_PATH || 'http://127.0.0.1:8000'}/reportHome/${cookie.get('user_id')}`}
        // action={`http://123.231.16.203/reportHome/${cookie.get('user_id')}`} 
        // method="get"
        target="_blank"
      >
        <button
          type="submit"
          className="btn btn-sm rounded-0"
          style={{
            backgroundColor: '#2867FD',
            color: '#fff',
            padding: '3px 10px 3px 10px',
          }}
        >
          <span>
            <SafeFontAwesomeIcon icon={faFileAlt} color="white" />
          </span>
          &nbsp; Reports
        </button>
        {/* <input type="submit" value="Reports" className="btn btn" /> */}
      </form>
    </div>
  );
}

export default Reports;
