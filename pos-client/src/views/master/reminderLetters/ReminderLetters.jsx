import React, { useState, useEffect } from 'react';
import { api, msg, cookie } from '../../../services';
import { FormModal, ListView, SystemButton } from '../../../components';
import { jsPDF } from 'jspdf';
import moment from 'moment';

const ReminderLetter = () => {
  //Module name
  const moduleName = 'Reminder Letters';

  // Data loading status
  const [isLoading, setIsLoading] = useState({
    main: false,
    letters: false,
  });

  // Data edit state
  const [isEdit, setIsEdit] = useState(false);

  const [billTypes, setBillTypes] = useState([
    {
      id: '',
      des: '',
    },
  ]);

  const [searchParams, setSearchParams] = useState({
    batch_no: '',
    ddate: moment().format('YYYY-MM-DD'),
    bill_type_id: '',
    letter_no: '',
  });

  const [searchData, setSearchData] = useState([
    {
      checked: false,
      id: '',
      batch_no: '',
      loan_no: '',
      bill_no: '',
      letter_no: '',
      customer_name: '',
      amount: '',
      pawn_date: '',
      final_date: '',
      part_pay: '',
    },
  ]);

  const [billData, setBillData] = useState([]);

  const [selectAll, setSelectAll] = useState(false);

  const [manualDate, setManualDate] = useState('');

  let dataRows = [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        main: true,
      });

      let billTypesArr = [];

      const response = await api.get(
        `bill-types-by-branch/${cookie.get('user_branch')}`,
      );

      console.log(response.data);

      if (response.error) {
        msg.error(response.error);
      } else {
        response.data.map((entity) => {
          billTypesArr.push({
            id: entity.bill_type.id,
            des: entity.bill_type.des,
          });
        });
      }

      setBillTypes(billTypesArr);

      setIsLoading({
        ...isLoading,
        main: false,
      });
    } catch (error) {
      console.log(error);
      return msg.error(error);
    }
  };

  const handleValueChange = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    setSearchParams({
      ...searchParams,
      [inputName]: inputValue,
    });
  };

  const fetchData = async () => {
    try {
      setIsLoading({
        ...isLoading,
        letters: true,
      });
      setSelectAll(false);
      // prettier-ignore
      const response = await api.get(`showRemindLetters/${searchParams.ddate}/${searchParams.bill_type_id}/${searchParams.letter_no}/${cookie.get('user_branch')}`);
      //prettier-ignore-end

      console.log(response.data);

      if (response.error) {
        msg.error(response.error);
        return;
      } else {
        setSearchParams({
          ...searchParams,
          batch_no: response.data.batch_no,
        });

        response.data.loans.map((entity) => {
          dataRows.push({
            checked: false,
            id: entity.id,
            bill_no: entity.bill_no,
            required_amount: entity.required_amount,
            loan_item: entity.loan_item.map((item) => item.item.name),
            total_weight: entity.total_weight,
            gold_value: entity.gold_value,
            final_date: entity.final_date,
          });
        });

        // response.data[0].details.map((entity) => {
        //   dataRows.push({
        //     checked: false,
        //     id: entity.id,
        //     batch_no: entity.batch_no,
        //     loan_no: entity.loan_id,
        //     bill_no: entity.loan.bill_no,
        //     letter_no: entity.letter_no,
        //     customer_name: entity.loan.customer.name,
        //     amount: entity.loan.required_amount,
        //     pawn_date: entity.loan.ddate,
        //     final_date: entity.loan.final_date,
        //     part_pay:
        //       entity.loan.loan_trans.length === 0
        //         ? 0
        //         : entity.loan.loan_trans[0].amount_sum,
        //   });
        // });
      }

      setIsLoading({
        ...isLoading,
        letters: false,
      });
      setSearchData(dataRows);
      dataRows = [];
      //setEntities(dataRows);
    } catch (error) {
      return console.log(error);
    }
  };

  const selectLetters = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputId = targetInput.id;
    const inputValue = targetInput.value;

    if (inputName === 'selectAll' && selectAll === false) {
      searchData.map((letter) => {
        dataRows.push({
          checked: true,
          id: letter.id,
          batch_no: letter.batch_no,
          loan_no: letter.loan_no,
          bill_no: letter.bill_no,
          letter_no: letter.letter_no,
          customer_name: letter.customer_name,
          amount: letter.amount,
          pawn_date: letter.pawn_date,
          final_date: letter.final_date,
          part_pay: letter.part_pay,
        });
      });

      setSearchData(dataRows);
      dataRows = [];
      setSelectAll(true);
    } else {
      searchData.map((letter) => {
        dataRows.push({
          checked: false,
          id: letter.id,
          batch_no: letter.batch_no,
          loan_no: letter.loan_no,
          bill_no: letter.bill_no,
          letter_no: letter.letter_no,
          customer_name: letter.customer_name,
          amount: letter.amount,
          pawn_date: letter.pawn_date,
          final_date: letter.final_date,
          part_pay: letter.part_pay,
        });
      });

      setSearchData(dataRows);
      dataRows = [];
      setSelectAll(false);
    }
  };
  const selectOneLetter = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputId = targetInput.id;
    const inputValue = targetInput.value;

    searchData.map((letter) => {
      if (letter.id == inputName) {
        if (letter.checked === false) {
          dataRows.push({
            checked: true,
            id: letter.id,
            batch_no: letter.batch_no,
            loan_no: letter.loan_no,
            bill_no: letter.bill_no,
            letter_no: letter.letter_no,
            customer_name: letter.customer_name,
            amount: letter.amount,
            pawn_date: letter.pawn_date,
            final_date: letter.final_date,
            part_pay: letter.part_pay,
          });
        } else {
          dataRows.push({
            checked: false,
            id: letter.id,
            batch_no: letter.batch_no,
            loan_no: letter.loan_no,
            bill_no: letter.bill_no,
            letter_no: letter.letter_no,
            customer_name: letter.customer_name,
            amount: letter.amount,
            pawn_date: letter.pawn_date,
            final_date: letter.final_date,
            part_pay: letter.part_pay,
          });
        }
      } else {
        dataRows.push({
          checked: searchData.filter((lett) => lett.id === letter.id)[0]
            .checked,
          id: letter.id,
          batch_no: letter.batch_no,
          loan_no: letter.loan_no,
          bill_no: letter.bill_no,
          letter_no: letter.letter_no,
          customer_name: letter.customer_name,
          amount: letter.amount,
          pawn_date: letter.pawn_date,
          final_date: letter.final_date,
          part_pay: letter.part_pay,
        });
      }
    });

    if (dataRows.filter((row) => row.checked === false).length > 0) {
      setSelectAll(false);
    } else {
      setSelectAll(true);
    }

    setSearchData(dataRows);
    dataRows = [];
  };

  const search_batch = async (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputId = targetInput.id;
    const inputValue = targetInput.value;

    try {
      setIsLoading(true);
      let branch_id = cookie.get('user_branch');
      const response = await api.get(
        `showRemindLettersByBatch/${inputValue}/${searchParams.letter_no}`,
      );

      console.log(response);
      if (response.data.length == 0) {
        msg.error('Unable to load data');
        return;
      }

      if (response.error) {
        Object.values(response.error).forEach((err) => {
          msg.error(err[0]);
        });
        return;
      } else {
        response.data[0].details.map((entity) => {
          dataRows.push({
            checked: false,
            id: entity.id,
            batch_no: entity.batch_no,
            loan_no: entity.loan_id,
            bill_no: entity.bill_no,
            letter_no: entity.letter_no,
            customer_name: entity.loan.customer.name,
            amount: entity.loan.required_amount,
            pawn_date: entity.loan.ddate,
            final_date: entity.loan.final_date,
            part_pay:
              entity.loan.loan_trans.length === 0
                ? 0
                : entity.loan.loan_trans[0].amount_sum,
          });
        });
      }
      setIsLoading(false);
      setSearchData(dataRows);
      dataRows = [];
    } catch (error) {
      return console.log(error);
    }
  };

  // const print_letters = () => {
  //   // Default export is a4 paper, portrait, using millimeters for units
  //   const doc = new jsPDF();
  //   let page_count = searchData.filter((row) => row.checked === true).length;
  //   console.log(page_count);
  //   searchData.map((letter) => {
  //     if (letter.checked) {
  //       let cut_line = letter.letter_no === 2 ? 25 : 40;
  //       let final_date = manualDate !== '' ? manualDate : letter.final_date;

  //       doc.text(cookie.get('user_branch_name'), 170, 12);
  //       if (letter.letter_no !== 3) {
  //         doc.text('----------------------', 165, cut_line);
  //       }

  //       doc.text(
  //         '' +
  //           letter.bill_no +
  //           '                                                 ' +
  //           letter.pawn_date +
  //           '                                    ' +
  //           letter.amount,
  //         15,
  //         80,
  //       );

  //       doc.text(final_date, 15, 99);

  //       doc.text(final_date, 15, 123);

  //       doc.text(final_date, 60, 149);
  //       if (page_count > 1) {
  //         doc.addPage();
  //         page_count--;
  //       }
  //     }
  //   });
  //   if (searchData.filter((row) => row.checked === true).length > 0) {
  //     // doc.save('print_reminder_letters.pdf');
  //     doc.output('dataurlnewwindow');
  //   }
  // };

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      <div className="compactForm">
        <div className="row justify-content-end">
          <div className="col-sm-2 form-group">
            <label htmlFor="batch_no">Batch No.</label>
            <input
              id="batch_no"
              name="batch_no"
              className="form-control text-right"
              value={searchParams.batch_no}
              onChange={handleValueChange}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-2 form-group">
            <label htmlFor="ddate">To Date</label>
            <input
              type="date"
              id="ddate"
              name="ddate"
              className="form-control"
              value={searchParams.ddate}
              onChange={handleValueChange}
              required
            />
          </div>
          <div className="col-sm-2 form-group">
            <label htmlFor="bill_type_id">Bill Type</label>
            <select
              id="bill_type_id"
              name="bill_type_id"
              className="form-control"
              value={searchParams.bill_type_id}
              onChange={handleValueChange}
              required
            >
              <option value="">-- Select Bill Type</option>
              {billTypes.map((billType) => {
                return (
                  <option key={billType.id} value={billType.id}>
                    {billType.des}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="col-sm-2 form-group">
            <label htmlFor="letter_no">Letter Number</label>
            <select
              id="letter_no"
              name="letter_no"
              className="form-control"
              value={searchParams.letter_no}
              onChange={handleValueChange}
              required
            >
              <option value="">-- Select Letter no.</option>
              <option value="1">1st Letter</option>
              <option value="2">2nd Letter</option>
              <option value="3">3rd Letter</option>
            </select>
          </div>
          <div className="offset-4 col-sm-2 form-group">
            <SystemButton
              type="load"
              showText
              btnText="Load bills"
              method={fetchData}
            />
          </div>
        </div>
      </div>
      <div className="row" style={{ maxHeight: '500px', overflowY: 'scroll' }}>
        <table className="table table-sm table-hover">
          <thead className="thead-light text-center">
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  name="select_all"
                  id="select_all"
                  onChange={selectAll}
                />
              </th>
              <th scope="col">#</th>
              <th scope="col">Bill no</th>
              <th scope="col">Pawning date</th>
              <th scope="col">Pawning Amount</th>
              <th scope="col">Articles</th>
              <th scope="col">Gold Weight</th>
              <th scope="col">Gold Value</th>
              <th scope="col">Final Date</th>
            </tr>
          </thead>
          <tbody>
            {
              <tr>
                <td>
                  <input
                    type="checkbox"
                    name="select_all"
                    id="select_all"
                    onChange={selectAll}
                  />
                </td>
                <td>bill_no</td>
                <td>bill_no</td>
                <td>required_amount</td>
                <td>loan_item</td>
                <td>total_weight</td>
                <td>gold_value</td>
                <td>final_date</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      {/* <div className="row">
        <div className="col-ms6 form-group">
          <label htmlFor="manual_date">Manual Date</label>
          <input
            type="date"
            id="manual_date"
            name="manual_date"
            className="form-control"
            value={manualDate}
            onChange={set_manual_date}
          />
        </div>
      </div>
      &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;
      <div className="row">
        <SystemButton type="print" showText={true} method={print_letters} />
        &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;
        <SystemButton type="print" showText={true} btnText="Re-Print" />
      </div> */}
    </div>
  );
};

export default ReminderLetter;
