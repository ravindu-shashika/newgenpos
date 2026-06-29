import React from 'react';

const Loader = ({ color }) => {
  const spinnerColor = color ? color : '#358873';

  return (
    <div>
      <br />
      <br />
      <div className="d-flex justify-content-center">
        <div
          className="spinner-border"
          role="status"
          style={{ color: spinnerColor }}
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default Loader;
