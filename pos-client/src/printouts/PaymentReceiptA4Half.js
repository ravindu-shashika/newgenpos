import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const PaymentReceipt = {
  async load(id, bc_no, is_dupplicate) {
    let trans_url = 'payment-receipt-print/' + id;
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
    doc.text('' + this.print_data.nno, 183, 24);

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(16);
    // doc.setFontType('bold');

    doc.text('Receipt' + ' (' + this.print_data.type + ')', 162, 37);

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
    doc.text('Branch    : ' + this.print_data.branch.name,x,y,);

    y += 5;
    doc.text('Date      : ' + this.print_data.ddate,x,y,);
    
    y += 5;
    doc.text('Paid From : ' + this.print_data.paid_acc.code + ' - ' +this.print_data.paid_acc.description,x,y,);

    // y += 3.5
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    // doc.line(138, y + 1, 176.3, y + 1);
    y += 7;

    y += 6;
    // doc.setFontType("bold");
    doc.text('Account Details', x, y);
    doc.text('Amount', end_x, y, 'right');

    y += 2;
    doc.setLineWidth(0.17);
    doc.setLineDash([1.7, 1.7], 0);
    doc.line(x, y, line_end, y);

    y += 4;
    // doc.setFontType("normal");
    let item_count = 0;
    let page_count = 0;
    let item_order = 1;

    this.print_data.details.forEach((item) => {
      if (page_count >= 1) {
        doc.addPage();

        item_count = 0;
        page_count = 0;
        doc.text('Branch    : ' + this.print_data.branch.name,x,y,);

        y += 5;
        doc.text('Date      : ' + this.print_data.ddate,x,y,);
        
        y += 5;
        doc.text('Paid From : ' + this.print_data.paid_acc.code + ' - ' +this.print_data.paid_acc.description,x,y,);

      }

      item_count++;

      let chunk_text = this.chunkString(item.account.description, 50);

      doc.text(item_order +' . ' + item.acc_code + ' | ' + chunk_text[0],x,y,);
      doc.text(fun.numberWithCommas(item.amount), end_x, y, 'right');

      if (chunk_text.length > 1) {
        for (let t = 1; t < chunk_text.length; t++) {
          y += 3.5;
          doc.text(' ' + chunk_text[t], x + 3.5, y);
          item_count++;
        }
      }

      y += 3.5;

      if (page_count == 0 && page_number == 1 && item_count > 6) {
        item_count = 0;
        page_count++;
        page_number++;
    
      } else if (item_count >= 16) {
        item_count = 0;
        page_count++;
        page_number++;
      }

      item_order++;
    });

    doc.setFontSize(11);

    doc.setLineWidth(0.17);
    doc.setLineDash([1.7, 1.7], 0);
    doc.line(x, y, line_end, y);

    if (page_number % 2 > 0) {
      if (y > 211) {
        y = 102 + 148;
      } else {
        y = 102;
      }
    } else {
      if (y > 179) {
        y = 102 + 148;
      } else {
        y = 102;
      }
    }

    doc.setFontSize(11);
    y += 2;
    // doc.setFontType("bold");
    doc.text('Total: ', 140, y, 'left');
    doc.text(
      fun.numberWithCommas(this.print_data.cash_amount),
      end_x,
      y,
      'right',
    );

    doc.setFontSize(11);

    y += 2.8;
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(179, y, line_end, y);
    y += 0.7;
    doc.line(179, y, line_end, y);

    y +=12;
    doc.text('-----------------', x + 3, y);
    doc.text('-----------------', x + 80 + 3, y);
    doc.text('-----------------', x + 160 + 3, y);

    y +=5;
    doc.text('Prepared By', x + 10, y,);
    doc.text('System Approval', x + 80 + 6, y,);
    doc.text('1.Approval', x + 160 + 10, y,);

    y +=12;
    doc.text('-----------------', x + 3, y);
    doc.text('----------------------', x + 150 + 3, y);

    y +=5;
    doc.text('2.Approval', x + 10, y,);
    doc.text('Signature of Recipient', x + 150 + 3, y,);

    //                doc.save('Invoice.pdf');
    // doc.autoPrint(); // <<--------------------- !!
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

export default PaymentReceipt;
