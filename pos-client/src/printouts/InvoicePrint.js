import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const InvoicePrint = {
  async loadInvoice(nno, is_dupplicate) {
    let trans_url = 'sales-invoices/get-details';
    let url_parameter = { invoice_id: nno };
    const response = await api.post(trans_url).values(url_parameter);
    this.print_data = response.data.invoice;
    this.total_items = response.data.invoice.details.length;
    this.printPDFInvoice(is_dupplicate);
  },

  printPDFInvoice(is_dupplicate) {
    let page_number = 0;

    let doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [595, 830],
    });

    doc.setFont('courier');
    doc.setFontSize(10);
    // doc.setFontType("normal");
    // doc.setFontType('bold');
    doc.text(this.print_data.branch.name, 510, 30);
    doc.text(this.print_data.ddate, 510, 50);
    doc.setFontSize(14);
    doc.text('' + this.print_data.nno, 510, 70);

    let x = 20;
    let y = 110;

    doc.setFont('Arial');
    doc.setFontSize(14);
    // doc.setFontType('bold');

    if (parseFloat(this.print_data.credit_amount)) {
      doc.text('CREDIT INVOICE', 460, 105);
    } else {
      doc.text('INVOICE', 460, 105);
    }

    //                doc.setFontSize(18);
    //                doc.text('DUPLICATE', 350, 90, 'center');
    doc.setFontSize(10);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 460, 115);
    } else {
      doc.text('ORIGINAL', 460, 115);
    }

    doc.setFont('courier');
    doc.setFontSize(10);
    y += 10;
    // doc.setFontType("normal");
    /*doc.text('No. :', 430, y);
         doc.text("" + this.print_data.nno, 505, y);*/
    doc.text('Customer :', x, y);
    doc.text(
      this.print_data.customer_title +
        ' ' +
        this.print_data.customer_name +
        '(' +
        this.print_data.cus_id +
        ')',
      110,
      y,
    );
    
    y += 10;
    /*doc.text('Date :', 430, y);
         doc.text(this.print_data.ddate, 505, y);*/
    doc.text('Mobile No. :', x, y);
    doc.text(this.print_data.mobile, 110, y);

    y += 10;
    doc.text('Address :', x, y);
    doc.text(this.print_data.address, 110, y);
    doc.text('Salesperson:', 430, y);
    doc.text(this.print_data.salesman.name, 505, y);

    // y += 10;
    // doc.text('Email :', x, y);
    // doc.text(this.print_data.email, 110, y);
    // doc.text('Contact No.:', 430, y);
    // doc.text(this.print_data.salesman.contact_no1, 505, y);

    y += 10;
    page_number++;
    doc.text('Page No: ' + page_number, 505, y);

    y += 20;
    // doc.setFontType('bold');
    doc.text('Item', x, y);
    doc.text('Weight', 400, y, 'right');
    doc.text('Price', 480, y, 'right');
    doc.text('Amount', 580, y, 'right');

    y += 5;
    doc.setLineWidth(0.5);
    doc.setLineDash([5, 5], 0);
    doc.line(x, y, 590, y);

    y += 20;
    // doc.setFontType("normal");
    let item_count = 0;
    let page_count = 0;
    let item_order = 1;

    this.print_data.details.forEach((item) => {
      if (page_count >= 2) {
        doc.addPage();
        y = 90;
        item_count = 0;
        page_count = 0;
        doc.text('Page No: ' + page_number, 505, y - 15);
      }

      item_count++;

      //                    let text1 = item.item.des
      //                    let len=item.item.des.length()
      //                    if(len>50){
      //
      //                    }

      let chunk_text = this.chunkString(item.tag.item_name, 50);

      doc.text(item_order + '. ' + chunk_text[0], x, y);
      doc.text(item.weight, 400, y, 'right');
      doc.text(item.price, 480, y, 'right');
      doc.text(item.agree_rate, 580, y, 'right');

      if (chunk_text.length > 1) {
        for (let t = 1; t < chunk_text.length; t++) {
          y += 10;
          doc.text(' ' + chunk_text[t], x + 10, y);
          item_count++;
        }
      }

      y += 10;

      //                    console.log(item_order, " ", item_count, " ", page_count, " ", page_number)
      if (page_count == 0 && page_number == 1 && item_count > 6) {
        item_count = 0;
        page_count++;
        page_number++;
        if (this.total_items == 7) {
        } else {
          y += 230;
          doc.text('Page No: ' + page_number, 505, y - 15);
        }
      } else if (item_count >= 16) {
        if (page_number % 2 > 0) {
          y += 220;
          item_count = 0;
          page_count++;
          page_number++;
          doc.text('Page No: ' + page_number, 505, y - 15);
        } else {
          page_count++;
          page_number++;
        }
      }

      /*
             if (page_count == 0 && page_number == 1 && item_count > 6) {
             //                        doc.addPage();
             y += 220
             item_count = 0
             page_count++
             page_number++
             doc.text("Page No: " + page_number, 505, y - 10);
             }
             else if (page_count > 0 && item_count >= 16) {
             //                        doc.addPage();
             //                        y += 220
             //                        item_count = 0
             page_count++
             page_number++
             }
             */

      item_order++;
    });

    for (let p = 2; p <= page_number; p++) {
      doc.setFontSize(10);
      if (p % 2 > 0) {
        doc.text(this.print_data.branch.name, 510, 30);
        doc.text(this.print_data.ddate, 510, 50);
        doc.setFontSize(14);
        doc.text('' + this.print_data.nno, 510, 70);
      } else {
        doc.text(this.print_data.branch.name, 510, 30 + 400);
        doc.text(this.print_data.ddate, 510, 50 + 400);
        doc.setFontSize(14);
        doc.text('' + this.print_data.nno, 510, 70 + 400);
      }
    }
    doc.setFontSize(10);

    doc.setLineWidth(0.5);
    doc.setLineDash([5, 5], 0);
    doc.line(x, y, 590, y);

    if (page_number % 2 > 0) {
      if (y > 600) {
        y = 290 + 420;
      } else {
        y = 290;
      }
    } else {
      if (y > 510) {
        y = 290 + 420;
      } else {
        y = 290;
      }
      /*if (item_order <= 8) {
             y = 290;
             } else {
             y = 290 + 420;
             }*/
    }

    // y += 10
    // doc.setLineWidth(0.5);
    // doc.setLineDash(0, 0);
    // doc.line(500, y, 590, y);

    doc.setFontSize(12);
    y += 15;
    //   doc.setFontType('bold');
    doc.text('Total: ', 445, y, 'left');
    doc.text(fun.numberWithCommas(this.print_data.tot_amount), 580, y, 'right');

    // doc.setFontType("normal");
    doc.setFontSize(10);

    y += 8;
    doc.setLineWidth(0.5);
    doc.setLineDash(0, 0);
    doc.line(520, y, 590, y);
    y += 2;
    doc.line(520, y, 590, y);

    if (parseFloat(this.print_data.return_pay) > 0) {
      y += 15;
      doc.text('Return Settle', 445, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.return_pay),
        580,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.card_pay) > 0) {
      y += 20;
      doc.text('Card', 445, y, 'left');
      doc.text(fun.numberWithCommas(this.print_data.card_pay), 580, y, 'right');
    }

    if (parseFloat(this.print_data.cash_pay) > 0) {
      let cash_pay = parseFloat(this.print_data.cash_pay).toFixed(2);
      y += 20;
      doc.text('Cash', 445, y, 'left');
      doc.text(fun.numberWithCommas(cash_pay), 580, y, 'right');
    }

    if (parseFloat(this.print_data.credit) > 0) {
      y += 20;
      doc.text('Balance due', 445, y, 'left');
      doc.text(fun.numberWithCommas(this.print_data.credit), 580, y, 'right');
    }

    y += 10;
    doc.setLineWidth(0.5);
    doc.setLineDash(0, 0);
    doc.line(520, y, 590, y);
    //                y += 2
    //                doc.line(500, y, 590, y);

    /*
         doc.setTextColor(150);
         doc.setFontSize(25);
         doc.text( 'Duplicate', 140, 300, 45, 'center' ); // Rotate text testing
         */

    //                doc.save('Invoice.pdf');
    doc.autoPrint(); // <<--------------------- !!
    // doc.output('dataurlnewwindow');
    let newWindow = window.open(doc.output('bloburl'), '_blank');
    //                window.open(doc.output('bloburl'));

    // newWindow.onafterprint = () => {
    //     newWindow.close()
    // }
    setTimeout(function () {
      newWindow.close();
    }, 60000);
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

  /* numberWithCommas(x) {
     var parts = x.toString().split(".");
     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
     return parts.join(".");
     }*/
};

export default InvoicePrint;
