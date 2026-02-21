import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Loader, SDD, SystemButton } from '../../../components';
import { api, cookie, msg } from '../../../services';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

const TagChange = () => {
  // Module name
  const moduleName = 'Tag Change';

  /* --- State declarationss --- */

  const [isLoading, setIsLoading] = useState({
    init: false,
  });

  const [isEdit, setIsEdit] = useState(false);

  const [newData, setNewData] = useState({
    user_id: cookie.get('user_id'),
    bc_no: cookie.get('user_branch'),
    newDate: '',
    newId: '',
    ddate: '',
    id: '',

    tag_id: '',
    tag_no: '',
    new_tag_no: '',
    memo: '',
  });

  const [tags, setTags] = useState([]);

  /* --- End of state declarations --- */

  useEffect(() => {
    // fetchData();
    getAllAvailableTags();
  }, []);

  /* --- Component functions --- */

  //   const fetchData = async () => {
  //     try {
  //       setIsLoading({
  //         ...isLoading,
  //         init: true,
  //       });

  //       const response = await api.get(`tag-changes`);
  //       setNewData({
  //         ...newData,
  //         ddate: response.data.ddate,
  //         newDate: response.data.ddate,
  //         id: response.data.new_id,
  //         newId: response.data.new_id,
  //       });

  //       setIsLoading({
  //         ...isLoading,
  //         init: false,
  //       });
  //     } catch (error) {
  //       return msg.error('Unable to fetch data!');
  //     }
  //   };

  const getAllAvailableTags = async () => {
    try {
      const response = await api.get(`get-available-tags`);

      if (response.data) {
        setTags(response.data);
      }
    } catch (error) {
      return msg.error('Unable to fetch data!');
    }
  };

  const supplierSelect = (selectedObj) => {
    setNewData({
      ...newData,
      nicno: selectedObj.code,
      cusname: selectedObj.description,
    });
  };

  const validateControlValues = (input, value) => {
    /**
     * This function can be used to validate any input value when the onChange (or onKeyPress, or onKeyDown, or whatever tf you like...) event fires
     * Pass the form element's name as the 1st parameter, @param {string} input
     * And the value needs to be validated as the 2nd, @param {any} value
     * Use the promise to do any required validation and resolve with true
     * Don't use reject fot the timebeing coz it's not handled here
     */

    return new Promise((resolve, reject) => {
      switch (input) {
        default:
          resolve(true);
          break;
      }
    });
  };

  const handleValueChanges = (e) => {
    const targetInput = e.target;
    const inputName = targetInput.name;
    const inputValue = targetInput.value;

    if (inputName === 'tag_id') {
      let tag_no = targetInput.options[targetInput.selectedIndex].text;

      setNewData({
        ...newData,
        [inputName]: inputValue,
        tag_no: tag_no,
      });

      generateBarcode(tag_no);
    } else {
      setNewData({
        ...newData,
        [inputName]: inputValue,
      });
    }
  };

  const handleSubmit = async () => {
    if (checkBeforeSave() === false) return;
    await save();
  };

  const save = async () => {
    try {
      const response = await api.post('tag-changes/save').values(newData);
      if (response.data) {
        console.log(response.data);
        resetAll();
      }
      //   if (parseInt(response.data) > 0) {
      //     printReceipt(response.data, false);
      //   }
    } catch (err) {
      msg.error(err);
      return;
    }
  };

  const checkBeforeSave = () => {
    if (newData.tag_id === '') {
      msg.warning('Select Tag before save.');
      return false;
    }

    if (newData.new_tag_no === '') {
      msg.warning('Enter New Tag No before save.');
      return false;
    }

    return true;
  };

  const resetAll = async () => {
    setIsLoading({
      init: false,
    });

    setIsEdit(false);

    setNewData({
      user_id: cookie.get('user_id'),
      bc_no: cookie.get('user_branch'),

      ddate: newData.newDate,
      id: newData.newId,

      tag_id: '',
      tag_no: '',
      new_tag_no: '',
      memo: '',
    });

    return true;
  };

  const printReceipt = () => {
    let img = document.querySelector('img#barcode_print');

    let no_of_stickers_per_page = parseInt(2);

    /* For 50mm * 50mm sticker */
    let sticker_width = parseInt(40);
    let sticker_height = parseInt(40);
    let page_width = sticker_width;
    let page_height = sticker_height;
    let page_gap = parseFloat(26);

    if (no_of_stickers_per_page > 1) {
      page_width =
        page_width * no_of_stickers_per_page +
        (page_gap * no_of_stickers_per_page - 1);
    }

    let doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [page_width, page_height],
    });
    /*   format: [parseInt(50.8), parseInt(22.86)] inches 2 and 0.9  */
    doc.setFontSize(5);
    /*//                doc.addImage(img.src, 'JPEG', 10, 10, 180, 160);*/

    let x = 0;
    let y = 0;
    y += 1.5;
    // doc.addImage(img.src, 'JPEG', x, y, 25, 15); // with image width and height
    doc.addImage(img.src, 'JPEG', x, y); // without image width and height

    /* let item_name = '';
    if (this.form.s_description !== '') {
      item_name = this.form.s_description;
    } else {
      item_name = this.form.des;
    }
    let print_name_1 = item_name;
    let print_name_2 = '';

    if (item_name.length > 27) {
      print_name_1 = print_name_1.slice(0, 26);
      print_name_1 = print_name_1.slice(
        0,
        Math.min(print_name_1.length, print_name_1.lastIndexOf(' ')),
      );
      print_name_2 = item_name.slice(print_name_1.length, item_name.length);
    }

    let x = 0;
    let y = 0;
    let page_count = parseInt(this.form.qty / 2);
    if (parseInt(this.form.qty) % 2 > 0) {
      page_count++;
    }

    for (let l = 0; l < page_count; l++) {
      x = 0;
      for (let p = 0; p < no_of_stickers_per_page; p++) {
        y = 1.5;
        doc.text(x, y, 'Rs.' + this.form.max_price);
        y += 2;
        doc.setFontSize(5);
        doc.text(x, y, print_name_1);
        if (print_name_2 !== '') {
          y += 1.5;
          doc.text(x, y, print_name_2);
        }
        y += 2;
        doc.text(x, y, 'Manufactured: ');
        doc.text(x + 12, y, this.form.manufacture_date);
        y += 2;
        doc.text(x, y, 'Expired: ');
        doc.text(x + 12, y, this.form.expire_date);
        y += 2;
        doc.text(x, y, 'Reg.No.: ');
        doc.text(x + 12, y, this.company.var_reg_no);
        y += 1.5;
        doc.addImage(img.src, 'JPEG', x, y, 25, 15);

        x += 25 + page_gap / 2;
      }
      if (l < parseInt(page_count) - 1) {
        doc.addPage();
      }
    } */
    //                doc.text(x + 10, y, 'Rs.' + this.form.max_price);
    //                doc.addImage(img.src, 'JPEG', x, y);

    const pdfname = newData.tag_no + '.pdf'
    doc.save(pdfname);

    // doc.autoPrint(); // <<--------------------- !!    
    // let newWindow = window.open(doc.output("bloburl"), '_blank');
  };

  const generateBarcode = (text) => {
    JsBarcode('#barcode_print', text, {
      format: 'CODE128',
    });
  };

  /* --- End of component functions --- */

  /* --- Component renders --- */

  return (
    <div>
      <h5 className="text-center">{moduleName}</h5>
      <br />
      {isLoading.init ? (
        <Loader />
      ) : (
        <div>
          <div className="row mb-3">
            <div className="col-sm-9 px-0"></div>

            <div className="col-sm-3">
              {/* <div className="form-group row mb-0">
                <label htmlFor="ddate" className="col-sm-4 col-form-label px-0">
                  Date
                </label>
                <div className="col-sm-8">
                  <input
                    type="date"
                    className="form-control form-control-sm rounded-0"
                    id="ddate"
                    name="ddate"
                    value={newData.ddate}
                    onChange={handleValueChanges}
                  />
                </div>
              </div>

              <div className="form-group row mb-0">
                <label htmlFor="po_no" className="col-sm-4 col-form-label px-0">
                  No.
                </label>
                <div className="col-sm-8">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-0 text-right"
                    id="id"
                    name="id"
                    value={newData.id}
                    readOnly
                  />
                </div>
              </div>*/}
            </div>
          </div>

          <div className="row">
            <label htmlFor="tag_id" className="col-sm-1 col-form-label">
              Tag No
            </label>
            <div className="col-sm-3 px-0">
              <select
                id="tag_id"
                name="tag_id"
                className="form-control form-control-sm "
                required
                onChange={handleValueChanges}
                value={newData.tag_id}
              >
                <option value="">---</option>

                {tags
                  ? tags.map((obj) => {
                      return (
                        <option key={obj.id} value={obj.id}>
                          {obj.tag_no}
                        </option>
                      );
                    })
                  : null}
              </select>
            </div>

            <label
              htmlFor="new_tag_no"
              className="col-sm-2 col-form-label text-right"
            >
              New Tag No
            </label>
            <div className="col-sm-3">
              <input
                type="text"
                className="form-control form-control-sm "
                id="new_tag_no"
                name="new_tag_no"
                value={newData.new_tag_no}
                onChange={handleValueChanges}
              />
            </div>
          </div>

          <div className="row">
            <label htmlFor="notes" className="col-sm-1 col-form-label">
              Memo
            </label>
            <div className="col-sm-8 pl-0">
              <textarea
                name="memo"
                id="memo"
                rows="1"
                maxLength="100"
                className="form-control form-control-sm "
                value={newData.memo}
                onChange={handleValueChanges}
              ></textarea>
            </div>
          </div>

          <hr />
          <div className="row">
            <div className="col-sm-2">
              <SystemButton
                type="no-form-save"
                showText
                method={handleSubmit}
              />
            </div>

            <div className="col-sm-2">
              <SystemButton
                type="print"
                showText
                method={() => {
                  if (newData.tag_no !== '') {
                    printReceipt();
                  } else {
                    msg.warning(
                      'Select Tag and check the barcode was generated then click to print.',
                    );
                  }
                }}
              />
            </div>
            <div className="col-sm-2">
              <SystemButton type="reset" showText method={resetAll} />
            </div>
          </div>
          <hr />
          <div className="row">
            <img id="barcode_print" className="p-0 m-0" />
          </div>
        </div>
      )}
    </div>
  );

  /* --- End of component renders --- */
};

export default TagChange;
