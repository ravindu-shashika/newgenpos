import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const AdvanceRefund = {
  async load(id, bc_no, is_dupplicate) {
    let trans_url = 'advance-refunds/' + id;
    // let url_parameter = {'invoice_id': id}

    const response = await api.get(trans_url);
    this.print_data = response.data.entities;
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

    doc.text('Advance Refund', 162, 37);

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
    doc.text(
      'Customer : ' +
        this.print_data.customer.cusname +
        '(' +
        this.print_data.customer.nicno +
        ')',
      x,
      y,
    );

    // y += 5;
    // doc.text(
    //   'Refund a sum of ' + toWords.convert(this.print_data.amount) + '.',
    //   x,
    //   y,
    // );

    doc.text(
      'Advance Payment No. ' + this.print_data.advance_payment_id,
      x,
      y + 5,
    );

    // y += 3.5
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(138, y + 1, 176.3, y + 1);
    y += 7;
    doc.setFontSize(14);
    // doc.text("Paid Total :", 480, y, 'right')
    doc.text(
      ' Rs ' + fun.numberWithCommas(this.print_data.amount),
      176,
      y,
      'right',
    );

    y += 3;
    doc.setLineWidth(0.1);
    doc.setLineDash(0, 0);
    doc.line(138, y, 176.3, y);
    y += 0.5;
    doc.line(138, y, 176.3, y);

    y += 12;
    doc.setLineWidth(0.1);
    doc.setLineDash([0.5, 0.5], 0);
    doc.line(x, y, x + 40, y);
    doc.line(x + 60, y, x + 90, y);

    y += 4;
    doc.text('Manager', x + 3, y);
    doc.text('Customer', x + 60 + 3, y);

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

export default AdvanceRefund;
