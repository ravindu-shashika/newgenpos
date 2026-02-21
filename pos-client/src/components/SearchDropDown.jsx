import React, { useEffect, useState } from 'react';
import { msg } from '../services';

const SearchDropDown = ({
  data,
  method,
  value,
  rowId,
  classes,
  listId,
  placeholder,
  selected,
}) => {
  let dataObj = [];

  const [textValue, setTextValue] = useState(selected);

  useEffect(() => {
    setTextValue(selected);
  }, [selected]);

  const selectRow = (e) => {
    console.log(e.target.value);
    dataObj = data.find((row) => row[value] === e.target.value);

    setTextValue(e.target.value);

    if (dataObj) {
      method(dataObj);
    } 
  };

  const focuedOut = (e) => {
    if (e.target.value) {
      dataObj = data.find((row) => row[value] === e.target.value);
      if (!dataObj) {        
        setTextValue('');
        msg.warning('Please enter a value in the list 😒');
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        list={`dataList_${listId}`}
        name={`customInputElement_${listId}`}
        id={`customInputElement_${listId}`}
        autoComplete="off"
        className={classes ? `${classes}` : 'form-control'}
        onChange={selectRow}
        onBlur={focuedOut}
        placeholder={placeholder ? placeholder : ''}
        // defaultValue={selected ? selected : ''}
        value={textValue}
      />
      
      <datalist id={`dataList_${listId}`}>
        {data.map((row) => {
          return (
            <option key={row[rowId]} value={row[value]} />
            //   {row[value]}
            // </option>
          );
        })}
      </datalist>
    </div>
  );
};

export default SearchDropDown;
