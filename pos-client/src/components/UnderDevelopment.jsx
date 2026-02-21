import React from 'react';
import { dev } from '../assets';

function UnderDevelopment() {
  return (
    <div className="text-center">
      <br />
      <h5>Sorry! This feature is under construction...</h5>
      <img src={dev} alt="under development" style={{ width: '300px' }} />
    </div>
  );
}

export default UnderDevelopment;
