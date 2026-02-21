import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { SafeFontAwesomeIcon } from '.';
import { faClock } from '@fortawesome/free-solid-svg-icons';

const DateAndTime = () => {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    timer();
  }, []);

  const timer = () => {
    const interval = setInterval(() => {
      setDateTime(moment().format(`dddd, MMMM Do YYYY | h:mm:ss A`));
    }, 1000);
    return () => clearInterval(interval);
  };

  return (
    <div
      className="navbarText"
      style={{
        fontFamily: 'Nova Square, cursive',
        fontSize: '0.9rem',
        fontWeight: 'bold',
      }}
    >
      {/* <span>
        <SafeFontAwesomeIcon icon={faClock} />
      </span>
      &nbsp; */}
      {dateTime}
    </div>
  );
};

export default DateAndTime;
