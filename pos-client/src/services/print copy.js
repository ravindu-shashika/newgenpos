import { jsPDF } from 'jspdf';
// import { default as cookie } from './cookie';
import moment from 'moment';

const numberToWords = require('number-to-words');

const receiptSize = [250, 120];

class Print {
  // * Pawning bill
  pawningBill(billData, isRePrint, isFromRedeem, renewDetails, status) {
    let amountInWords = '';

    const valBeforeDecPoint = billData[0].required_amount.slice(
      0,
      parseFloat(billData[0].required_amount).toFixed(2).indexOf('.'),
    );

    const valAfterDecPoint = billData[0].required_amount.slice(
      parseFloat(billData[0].required_amount).toFixed(2).indexOf('.') + 1,
    );

    if (valAfterDecPoint === '00') {
      amountInWords = `${numberToWords
        .toWords(valBeforeDecPoint)
        .toUpperCase()} RUPEES ONLY`;
    } else {
      amountInWords = `${numberToWords
        .toWords(valBeforeDecPoint)
        .toUpperCase()} RUPEES AND ${numberToWords
        .toWords(valAfterDecPoint)
        .toUpperCase()} CENTS ONLY`;
    }

    // Bill document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [230, 120],
      // format: 'a5',
    });

    let first = [];
    let newarr = billData[0].loan_item;
    let arrlength = billData[0].loan_item.length;
    var i = 0;
    var j = 8;
    let requiredPages = 0;
    let new_words = [];
    let lines = 0;
    while (true) {
      if (i < arrlength) {
        let new_word = newarr.slice().splice(i, j);
        first.push(new_word);
        requiredPages += 1;
      } else {
        break;
      }
      i += 8;
    }
    let count = 0;
    let total_weight = 0;
    for (var i = 0; i < requiredPages; i++) {
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal', 'normal');
      doc.text(`${billData[0].branch.address}`, 24, 25);
      // doc.text(`${billData[0].branch.address}`, 33, 22); left
      doc.setFontSize(12);
      doc.text(`${billData[0].branch.telephone}`, 24, 30);
      // doc.text(`${billData[0].branch.telephone}`, 33, 27); left
      doc.setFontSize(11);
      doc.text(
        `${('000' + billData[0].branch.code).slice(-3)} ${
          billData[0].branch.name
        }`,
        191,
        // 205, left
        20,
        'right',
      );
      doc.text(moment(billData[0].created_at).format('hh:mm A'), 183, 29); //190 left
      doc.text(`${billData[0].id}`, 183, 39); //190 left
      if (isFromRedeem === 0) {
        doc.text(`${billData[0].user.user_code}`, 182, 48); // 185 left
      }
      if (isRePrint === 1) {
        doc.text(`RE-PRINT`, 162, 48); // 185 left
      }
      doc.setFontSize(11);
      console.log('renewdet' + renewDetails);
      doc.text(moment(billData[0].ddate).format(`YYYY-MM-DD`), 5, 48); // 14 left
      if (status == 'RENEW') {
        doc.text(`${billData[0].bill_type.des} ${billData[0].bill_no}`, 53, 48); // 62 left
        doc.text(`RE No. : ${renewDetails[0]} ${renewDetails[1]}`, 120, 48); // 130 left
      } else if (renewDetails[0]) {
        doc.text(`${billData[0].bill_type.des} ${billData[0].bill_no}`, 53, 48); // 62 left
        doc.text(`RE No. : ${renewDetails[0]} ${renewDetails[1]}`, 120, 48); // 130 left
      } else {
        doc.text(`${billData[0].bill_type.des} ${billData[0].bill_no}`, 53, 48); // 62 left
      }

      doc.setFontSize(9);

      doc.setFontSize(10);
      doc.text(`${billData[0].customer.title}`, 7, 58); // 15 left
      doc.text(`${billData[0].customer.name}`, 16, 58); // 15 left
      doc.text(`${billData[0].customer.address_1}`, 7, 63); // 15 left

      doc.setFontSize(11);
      doc.text(`${billData[0].customer.nic}`, 7, 92); // 15 left
      doc.text(`${billData[0].customer.telephone}`, 67, 92); // 76 left

      let itemsY = 62;

      doc.setFontSize(8);
      let itemweight = 0;
      let totalval = 0;
      first[i].forEach((item) => {
        console.log(item);
        // doc.text(
        //   `${item.item.name} (${item.qty}) , ${item.condition_note}`,
        //   // `${item.item.name} (${item.qty}) - ${item.condition.code} , ${item.condition_note}` // item conditon removed by customer requirment,
        //   109,
        //   // 117, left
        //   itemsY,
        // );
        let itemText = `${item.item.name} (${item.qty})`;

        if (item.condition_note) {
          itemText += `, ${item.condition_note}`;
        }

        doc.text(itemText, 109, itemsY);

        doc.text(
          `${item.gold_rate.gold_types.display_name}`,
          191,
          itemsY,
          'right',
        ); // 205 left
        itemsY += 1;
        itemsY = parseInt(itemsY) + parseInt(3);
        itemweight += parseFloat(item.gold_weight);
        total_weight += parseFloat(item.gold_weight);
        totalval += item.gold_value;
      });

      if (i == requiredPages - 1) {
        doc.setFontSize(11);
        doc.text(
          `Total Weight : ${parseFloat(itemweight).toFixed(3)}g`,
          109,
          // 117, left
          92,
        );
      }

      doc.text(`${billData[0].required_amount}`, 33, 102); // 42 left
      doc.text(`${billData[0].bill_type.period.des}`, 100, 101); // 110 left
      doc.text(`${billData[0].final_date}`, 176, 101); // 185 left

      doc.setFontSize(7);
      doc.text(amountInWords, 28, 113); // 35 left
      doc.addPage();
      count = count++;
    }
    var pageCount = doc.internal.getNumberOfPages();
    doc.deletePage(pageCount);
    var print_window = window.open(doc.output(`bloburl`));

    setTimeout(function () {
      print_window.close();
    }, 30000);
  }

  // * Part-payment receipt
  partPaymentBill(billData) {
    // Bill document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
    });
    /* format: [250, 120], */
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text(`${billData.loan.branch.address}`, 23, 28);
    doc.text(`${billData.loan.branch.telephone}`, 23, 33);
    doc.text(
      billData.trans_type_id === 8
        ? 'PART-PAYMENT' + (billData.status === 'Reprint' ? ' (REPRINT)' : '')
        : 'INTEREST PAYMENT' +
            (billData.status === 'Reprint' ? ' (REPRINT)' : ''),
      112,
      23,
      'center',
    );

    doc.text(`${billData.loan.branch.name}`, 165, 10);
    doc.text(moment().format(`YYYY-MM-DD`), 175, 22);
    doc.text(moment().format(`HH:MM`), 175, 31);
    doc.text(`${billData.loan.id}`, 190, 37);

    doc.text(moment().format(`YYYY-MM-DD`), 35, 38);
    doc.text(
      `${billData.loan.bill_type.des} | ${billData.loan.bill_no}`,
      85,
      38,
    );
    doc.text(`${billData.loan.customer.title}`, 27, 52);
    doc.text(`${billData.loan.customer.name}`, 27, 52);
    doc.text(`${billData.loan.customer.address_1}`, 27, 56);
    doc.text(`${billData.loan.customer.telephone}`, 60, 73);

    doc.text(`${billData.amount}`, 180, 57);

    var print_window = window.open(doc.output(`bloburl`));
    setTimeout(function () {
      print_window.close();
    }, 30000);
  }

  // * Redeem receipt
  redeemBill(billData, isRePrint) {
    const discountTrans = billData.loan_trans.filter(
      (trans) => trans.trans_type_id === 13,
    );

    const redeemAmount = parseFloat(
      parseFloat(billData.redeem_amount) + parseFloat(discountTrans[0].amount),
    ).toFixed(2);

    // Amount
    const paidAmt =
      billData.paying_amount != 0
        ? parseFloat(billData.paying_amount).toFixed(2)
        : parseFloat(billData.redeem_amount).toFixed(2);

    // Bill document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
    });

    doc.setFontSize(10);
    doc.setFont('times', 'normal', 'normal');

    doc.text(`${billData.branch.address}`, 23, 28);
    doc.text(`${billData.branch.telephone}`, 23, 33);
    doc.text('REDEEM PAYMENT', 112, 23, 'center');

    doc.text(`${billData.branch.name}`, 205, 10, 'right');
    doc.text(moment(billData.redeem_date).format(`YYYY-MM-DD`), 173, 23);
    doc.text(moment(billData.created_at).format('hh:mm A'), 173, 31);
    doc.text(`${billData.id}`, 190, 37);

    doc.text(moment(billData.ddate).format(`YYYY-MM-DD`), 55, 39, 'center');
    doc.text(
      `${billData.bill_type.des} | ${billData.bill_no}`,
      105,
      39,
      'center',
    );

    // doc.text(`${billData.customer.title}`, 35, 51);
    doc.text(`${billData.customer.name}`, 26, 52);
    doc.text(`${billData.customer.address_1}`, 26, 57);
    doc.text(`${billData.customer.telephone}`, 27, 79);
    doc.text(`${billData.customer.nic}`, 116, 79, 'right');

    if (isRePrint === 1) {
      doc.setFontSize(10);
      doc.text(`RE-PRINT`, 195, 47, 'right');
      doc.setFontSize(10);
    }

    doc.text(`${redeemAmount}`, 180, 56);

    // Print discount (if any)
    if (discountTrans[0].amount !== '0.00') {
      doc.text(`TOTAL PAID: `, 145, 67);
      doc.text(`${paidAmt}`, 200, 67, 'right');
      doc.text(`DISCOUNT: `, 145, 72);
      doc.text(`${discountTrans[0].amount}`, 200, 72, 'right');
      if (billData.jp_note == true) {
        doc.text(`JP NOTE: `, 145, 77);
        doc.text(`${billData.jp_number}`, 200, 77, 'right');
      }
    } else if (billData.paying_amount != 0) {
      doc.text(`TOTAL PAID: `, 145, 67);
      doc.text(`${paidAmt}`, 200, 67, 'right');
      if (billData.jp_note == true) {
        doc.text(`JP NOTE: `, 145, 72);
        doc.text(`${billData.jp_number}`, 200, 72, 'right');
      }
    }

    var print_window = window.open(doc.output(`bloburl`));
    setTimeout(function () {
      print_window.close();
    }, 30000);
  }

  // * Expense receipt
  expenseBill(billData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [4, 6],
    });

    doc.text('Expense Receipt', 1, 0.2);
    doc.setFontSize(6);
    doc.text(
      `Dedigama Pawning (${billData.branch.name}), ${billData.branch.address} | TP: ${billData.branch.telephone} | Email: ${billData.branch.email}`,
      0.3,
      0.5,
    );

    doc.setFontSize(11);
    doc.text('Customer', 0.4, 0.7);
    doc.setFontSize(9);
    doc.text(`${billData[0].customer.title}`, 0.5, 0.9);
    doc.text(`Name: ${billData[0].customer.name}`, 0.5, 0.9);
    doc.text(`NIC: ${billData[0].customer.nic}`, 0.5, 1.1);
    doc.text(`Telephone: ${billData[0].customer.telephone}`, 0.5, 1.3);

    doc.setFontSize(11);
    doc.text('Pawning', 0.4, 1.6);
    doc.setFontSize(9);
    doc.text(
      `Bill No: ${billData[0].bill_type.des} | ${billData[0].bill_no}`,
      0.5,
      1.8,
    );
    doc.text(`Total Gold Value: ${billData[0].gold_value}`, 0.5, 2);
    doc.text(`Total Gold Weight: ${billData[0].total_weight}`, 0.5, 2.2);
    doc.text(`Loan Amount: ${billData[0].required_amount}`, 0.5, 2.5);
    doc.text(`Final Date: ${billData[0].final_date}`, 0.5, 2.7);

    doc.save(`pawning_bill_${billData[0].created_at}.pdf`);
  }

  // * cash transfer
  cashTransfer(billData) {
    // Bill document

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [250, 120],
    });
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text('Cash Transfer', 115, 25);

    const valBeforeDecPoint = billData.amount.slice(
      0,
      parseFloat(billData.amount).toFixed(2).indexOf('.'),
    );

    const valAfterDecPoint = billData.amount.slice(
      parseFloat(billData.amount).toFixed(2).indexOf('.') + 1,
    );

    var amountInWords = '';
    if (valAfterDecPoint === '00') {
      amountInWords = `${numberToWords
        .toWords(valBeforeDecPoint)
        .toUpperCase()} RUPEES ONLY`;
    } else {
      amountInWords = `${numberToWords
        .toWords(valBeforeDecPoint)
        .toUpperCase()} RUPEES AND ${numberToWords
        .toWords(valAfterDecPoint)
        .toUpperCase()} CENTS ONLY`;
    }

    doc.text(`${billData.to_branch.name}`, 170, 15);
    doc.text(moment().format(`YYYY-MM-DD`), 198, 18);
    doc.text(moment().format(`hh:mm A`), 198, 28);
    doc.text(`${billData.id}`, 198, 34);

    doc.text(`${billData.ddate}`, 35, 35);
    // doc.text(
    //   `${billData.loan.bill_type.des} | ${billData.loan.bill_no}`,
    //   85,
    //   35,
    // );

    doc.text(`From Branch: ${billData.branch.name}`, 35, 50);
    doc.text(`Account: ${billData.account.des}`, 35, 54);
    doc.text('' + amountInWords, 35, 70);
    doc.text(`Note: ${billData.receive_note}`, 35, 75);

    doc.text(`${billData.amount}`, 170, 58);

    var signature_panel_start_position_x = 35;
    var signature_panel_start_position_y = 95;
    //  * cashier
    doc.line(
      signature_panel_start_position_x,
      signature_panel_start_position_y,
      signature_panel_start_position_x + 50,
      signature_panel_start_position_y,
    );
    doc.text(
      `Cashier`,
      signature_panel_start_position_x,
      signature_panel_start_position_y + 5,
    );
    //  *manager
    signature_panel_start_position_x += 70;
    doc.line(
      signature_panel_start_position_x,
      signature_panel_start_position_y,
      signature_panel_start_position_x + 50,
      signature_panel_start_position_y,
    );
    doc.text(
      `Manager`,
      signature_panel_start_position_x,
      signature_panel_start_position_y + 5,
    );

    var print_window = window.open(doc.output(`bloburl`));
    setTimeout(function () {
      print_window.close();
    }, 30000);
  }

  // * cheque transfer
  chequeTransfer(billData) {
    // Bill document

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [250, 120],
    });
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text('Cheque Transfer', 115, 25);

    // doc.text(`${billData.to_branch.name}`, 170, 15);
    doc.text(moment().format(`YYYY-MM-DD`), 198, 18);
    doc.text(moment().format(`HH:MM`), 198, 28);
    // doc.text(`${billData.id}`, 198, 34);

    doc.text(billData.cheque_date, 35, 35);
    // doc.text(
    //   `${billData.loan.bill_type.des} | ${billData.loan.bill_no}`,
    //   85,
    //   35,
    // );

    doc.text(`Issue Cheque To: ${billData.issue_to_branch_name}`, 35, 50);
    doc.text(`Issue Account: ${billData.issue_account_name}`, 35, 55);
    doc.text(`Note: ${billData.acc_des}`, 35, 75);

    doc.text(`Cheque Bank: ${billData.bank_branch_name}`, 160, 50);
    doc.text(`Cheque Date: ${billData.cheque_date}`, 160, 55);
    doc.text(`Cheque No.: ${billData.cheque_no}`, 160, 60);
    doc.text(`Rs. ${billData.amount} /=`, 160, 65);
    var print_window = window.open(doc.output(`bloburl`));
    setTimeout(function () {
      print_window.close();
    }, 30000);
  }

  //   * cheque receive
  chequeReceive(billData) {
    // Bill document

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [250, 120],
    });

    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text('Cheque Receive', 115, 25);

    // doc.text(`${billData.to_branch.name}`, 170, 15);
    doc.text(moment().format(`YYYY-MM-DD`), 198, 18);
    doc.text(moment().format(`HH:MM`), 198, 28);
    // doc.text(`${billData.id}`, 198, 34);

    doc.text(billData.cheque_date, 35, 35);
    // doc.text(
    //   `${billData.loan.bill_type.des} | ${billData.loan.bill_no}`,
    //   85,
    //   35,
    // );

    doc.text(`Cheque Received From: ${billData.issue_branch}`, 35, 50);
    doc.text(`Received Account: ${billData.received_account}`, 35, 55);
    doc.text(`Note: ${billData.acc_des}`, 35, 75);

    doc.text(`Cheque Bank: ${billData.bank}`, 160, 50);
    doc.text(`Cheque Date: ${billData.cheque_date}`, 160, 55);
    doc.text(`Cheque No.: ${billData.cheque_no}`, 160, 60);
    doc.text(`Rs. ${billData.amount} /=`, 160, 65);

    var print_window = window.open(doc.output(`bloburl`));
    setTimeout(function () {
      print_window.close();
    }, 30000);
  }
}

export default new Print();
