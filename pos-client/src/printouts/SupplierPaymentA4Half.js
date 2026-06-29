import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const SupplierPaymentA4Half = {
  async load(trans_no, bc_no, is_dupplicate) {
    let trans_url = `supplier-payments/${trans_no}/${bc_no}`;
    // let url_parameter = {'invoice_id': id}

    const response = await api.get(trans_url);
    this.print_data = response.data.entities;
    this.settlements = response.data.settlements;
    this.gold_move = response.data.gold_move;
    this.printPDF(is_dupplicate);
  },

  printPDF(is_dupplicate) {
    let page_number = 0;

    let doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a5',
      // format: '[139.7 , 250]'
    });
    doc.setFont('courier');
    doc.setFontSize(10);
    // doc.setFontType('normal');
    doc.text(this.print_data.branch.name, 183, 10);
    doc.text(this.print_data.ddate, 183, 17);
    doc.text('' + this.print_data.id, 183, 24);

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(16);
    // doc.setFontType('bold');

    doc.text('Payment Voucher', 162, 36);

    //                doc.setFontSize(18);
    //                doc.text('DUPLICATE', 350, 90, 'center');
    doc.setFontSize(8);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 162, 40.5);
    } else {
      doc.text('ORIGINAL', 162, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(10);
    // doc.setFontType('normal');

    y += 7;
    page_number++;
    doc.text('Page No: ' + page_number, 178, y);

    y += 7;
    /*
        doc.text('No. :', 430, y);
        doc.text("" + this.print_data.nno, 505, y);
    */
    doc.text('Pay To : ' + this.print_data.vendor.name, x, y);

    y += 7;
    doc.text('Note : ' + this.print_data.memo, x, y);

    // y += 5;
    // doc.text(
    //   'a sum of ' + toWords.convert(this.print_data.amount) + '.',
    //   x,
    //   y,
    // );

    if (this.settlements.length != 0) {
      y += 15;
      let invoice_nos = '';
      this.settlements.forEach((item) => {
        if (invoice_nos) invoice_nos += '/ ';
        // invoice_nos += item.grn.supplier_invoice_no;
        invoice_nos += item.trans_no;
      });
      doc.text('Paid for Purchase No(s): ' + invoice_nos, x, y);
    }

    y += 7;
    // doc.setFontType('bold');
    let payments = '';
    if (parseFloat(this.print_data.cash_pay) > 0) {
      payments += 'Pay by Cash: ' + this.print_data.cash_pay;
    }

    if (parseFloat(this.print_data.old_gold_pay) > 0) {
      if (payments) payments += ' / ';
      else payments += 'Pay by';
      payments += ' Gold Value: ' + this.print_data.old_gold_pay;
    }

    /*  if (parseFloat(this.print_data.pay_cheque) > 0) {
        if (payments) payments += ' /';
        payments += ' Cheque: ' + this.print_data.pay_cheque;
        // doc.text("/ Cheque: " + this.print_data.pay_cheque, x + 100, y)
    }
 */
    /*   
        if (parseFloat(this.print_data.pay_bank) > 0) {
        if (payments) payments += ' /';
        payments += ' Bank: ' + this.print_data.pay_bank;
        // doc.text("/ Bank: " + this.print_data.pay_bank, x + 150, y)
    } 
    */

    doc.text(payments, x, y);

    if (this.gold_move) {
      y += 7;
      doc.text(
        '(' + this.gold_move.gold_type + ' / ' + this.gold_move.weight_out + 'g )',
        x + 10,
        y,
      );
    }

    // y += 3.5
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(138, y, 176.3, y);
    y += 7;
    doc.setFontSize(14);
    // doc.text("Paid Total :", 480, y, 'right')
    doc.text(
      ' Rs ' + fun.numberWithCommas(this.print_data.total_pay),
      176,
      y,
      'right',
    );

    y += 3.5;
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(138, y, 176.3, y);
    y += 2;
    doc.line(138, y, 176.3, y);

    let tl = y - 3.5;
    doc.setFont('courier');
    doc.setFontSize(10);
    // doc.setFontType('normal');
    doc.setLineWidth(0.2);

    /*
         doc.setTextColor(150);
         doc.setFontSize(25);
         doc.text( 'Duplicate', 140, 300, 45, 'center' ); // Rotate text testing
         */

    //                doc.save('Invoice.pdf');
    doc.autoPrint(); // <<--------------------- !!
    //                doc.output('dataurlnewwindow');
    let newWindow = window.open(doc.output('bloburl'), '_blank');
    //                window.open(doc.output('bloburl'));

    //                newWindow.onafterprint = () => {
    //                    newWindow.close()
    //                }
    //                setTimeout(function(){
    //                    newWindow.close();
    //                }, 2000);
  },

  chunkString(str, len) {
    const size = Math.ceil(str.length / len);
    const r = Array(size);
    let offset = 0;

    for (let i = 0; i < size; i++) {
      r[i] = str.substr(offset, len);
      offset += len;
    }

    return r;
  },
};

export default SupplierPaymentA4Half;
