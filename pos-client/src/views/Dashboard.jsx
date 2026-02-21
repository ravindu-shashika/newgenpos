import React, { useEffect } from 'react';
import { cookie } from '../services';

const Dashboard = () => {
  useEffect(() => {
    console.log(cookie.get('user_roles'));
  }, []);

  return (
    <div>
      <h5 className="text-center">Home</h5>
    </div>
  );
};

export default Dashboard;
