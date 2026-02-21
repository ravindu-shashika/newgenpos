import { jsPDF } from 'jspdf';
// import { default as cookie } from './cookie';
import moment from 'moment';
import numberToWords from 'number-to-words';

const receiptSize = [250, 120];

class Print {
  // Pawning bill
  pawningBill(billData) {
    // Capital value in words

    let amountInWords = '';

    const valBeforeDecPoint = billData[0].loan_capital.slice(
      0,
      parseFloat(billData[0].loan_capital).toFixed(2).indexOf('.'),
    );

    const valAfterDecPoint = billData[0].loan_capital.slice(
      parseFloat(billData[0].loan_capital).toFixed(2).indexOf('.') + 1,
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
    console.log(billData[0]);
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5',
    });
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text(`${billData[0].branch.name}`, 170, 25);
    doc.text(moment(billData[0].created_at).format(`HH:MM`), 192, 32);
    doc.text(`${billData[0].id}`, 192, 39);

    doc.text(moment(billData[0].created_at).format(`YYYY-MM-DD`), 12, 50);
    doc.text(`${billData[0].bill_type.des} | ${billData[0].bill_no}`, 60, 50);

    doc.text(`${billData[0].customer.name}`, 15, 65);
    doc.text(`${billData[0].customer.address_1}`, 15, 70);
    doc.text(`${billData[0].customer.nic}`, 15, 95);
    doc.text(`${billData[0].customer.telephone}`, 75, 95);

    let itemsY = 65;

    billData[0].loan_item.forEach((item) => {
      doc.text(`${item.item.name}`, 117, itemsY);
      doc.text(`${item.gold_weight}`, 157, itemsY);
      doc.text(`${item.gold_rate.gold_types.display_name}`, 195, itemsY);

      itemsY = parseInt(itemsY) + parseInt(5);
    });

    doc.text(`${billData[0].required_amount}`, 12, 110);
    doc.text(`${billData[0].bill_type.period.des}`, 110, 105);
    doc.text(`${billData[0].final_date}`, 185, 105);

    doc.text(amountInWords, 35, 117);

    if (billData[0].is_renew) {
      doc.setFont('times', 'italic', 'normal');
      doc.text(`RENEWD BILL`, 125, 46);
      doc.setFont('times', 'normal', 'normal');
      doc.text(`Previous bill - ${billData[0].prev_bill}`, 125, 50);
    }

    // doc.save(`pawning_bill_${billData[0].created_at}.pdf`);
    window.open(doc.output(`bloburl`));
  }

  // Part-payment receipt
  partPaymentBill(billData) {
    // Bill document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [250, 120],
    });
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text(
      billData.trans_type_id === 8 ? 'Part-payment' : 'Interest Payment',
      115,
      25,
    );

    doc.text(`${billData.loan.branch.name}`, 170, 15);
    doc.text(moment().format(`YYYY-MM-DD`), 198, 18);
    doc.text(moment().format(`HH:MM`), 198, 28);
    doc.text(`${billData.loan.id}`, 198, 34);

    doc.text(moment().format(`YYYY-MM-DD`), 35, 35);
    doc.text(
      `${billData.loan.bill_type.des} | ${billData.loan.bill_no}`,
      85,
      35,
    );

    doc.text(`${billData.loan.customer.name}`, 35, 50);
    doc.text(`${billData.loan.customer.address_1}`, 35, 54);
    doc.text(`${billData.loan.customer.telephone}`, 60, 75);

    doc.text(`${billData.amount}`, 170, 58);

    window.open(doc.output(`bloburl`));
  }

  // Redeem receipt
  redeemBill(billData) {
    // Discount
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

    // const totPaid = parseFloat(
    //   parseFloat(billData.redeem_amount) - parseFloat(discountTrans[0].amount),
    // ).toFixed(2);

    // Bill document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [250, 120],
    });
    doc.setFontSize(12);
    doc.setFont('times', 'normal', 'normal');

    doc.text('Redeemption', 115, 25);

    doc.text(`${billData.branch.name}`, 170, 15);
    doc.text(moment().format(`YYYY-MM-DD`), 198, 18);
    doc.text(moment().format(`HH:MM`), 198, 28);
    doc.text(`${billData.id}`, 198, 34);

    doc.text(moment().format(`YYYY-MM-DD`), 35, 35);
    doc.text(`${billData.bill_type.des} | ${billData.bill_no}`, 85, 35);

    doc.text(`${billData.customer.name}`, 35, 50);
    doc.text(`${billData.customer.address_1}`, 35, 54);
    doc.text(`${billData.customer.telephone}`, 60, 75);

    doc.text(`${redeemAmount}`, 170, 58);

    // Print discount (if any)
    if (discountTrans[0].amount !== '0.00') {
      doc.text(`DISCOUNT: `, 140, 65);
      doc.text(`${discountTrans[0].amount}`, 170, 65);
      doc.text(`TOTAL PAID: `, 140, 70);
      doc.text(`${paidAmt}`, 170, 70);
    } else if (billData.paying_amount != 0) {
      doc.text(`TOTAL PAID: `, 140, 70);
      doc.text(`${paidAmt}`, 170, 70);
    }

    window.open(doc.output(`bloburl`));
  }

  // Expense receipt
  expenseBill(billData) {
    console.log(billData[0]);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [4, 6],
    });

    doc.text('Redeem Receipt', 1, 0.2);
    doc.setFontSize(6);
    doc.text(
      `Dedigama Pawning (${billData[0].branch.name}), ${billData[0].branch.address} | TP: ${billData[0].branch.telephone} | Email: ${billData[0].branch.email}`,
      0.3,
      0.5,
    );

    doc.setFontSize(11);
    doc.text('Customer', 0.4, 0.7);
    doc.setFontSize(9);
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
}

export default new Print();
