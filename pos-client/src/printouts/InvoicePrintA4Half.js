import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const InvoicePrint = {
  async loadInvoice(invoice_id, bc_no, is_dupplicate) {
    let trans_url = 'sales-invoices/get-details';
    let url_parameter = { invoice_id, bc_no }; 
    const response = await api.post(trans_url).values(url_parameter);
    if (response.data.invoice) {
      this.print_data = response.data.invoice;
      this.total_items = response.data.invoice.details.length;
      this.printPDFInvoice(is_dupplicate);
      return true;
    } else {
      return false;
    }
  },

  printPDFInvoice(is_dupplicate) {
    let page_number = 0;

    let doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a5',
    });

    doc.setFont('courier');
    doc.setFontSize(11);
    // doc.setFontType("normal");
    // // doc.setFontType("bold");
    doc.text(this.print_data.branch.name, 183, 10);
    doc.text(this.print_data.ddate, 183, 17);
    doc.setFontSize(14);
    doc.text('' + this.print_data.id, 183, 24);
    if(this.print_data.sales_order_id != 0){
      doc.text('SO - ' + this.print_data.sales_order_id, 183, 30);
    }

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(14);
    // doc.setFontType("bold");

    if (parseFloat(this.print_data.credit_amount)) {
      doc.text('CREDIT INVOICE', 162, 35);
    } else {
      doc.text('INVOICE', 162, 35);
    }

    doc.setFontSize(11);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 162, 40.5);
    } else {
      doc.text('ORIGINAL', 162, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(11);
    y += 3.5;

    doc.text('Customer :', x, y);
    doc.text(
      this.print_data.cusname + '(' + this.print_data.cus_nic + ')',
      38,
      y,
    );

    y += 3.5;

    doc.text('Mobile No. :', x, y);
    doc.text(this.print_data.mobile, 38, y);

    y += 3.5;
    doc.text('Address :', x, y);
    doc.text(this.print_data.address, 38, y);
    y += 3.5;
    doc.text('Salesman:', x, y);
    doc.text(this.print_data.salesman.name, 38, y);
    page_number++;
    doc.text('Page No: ' + page_number, 178, y);
    /* 
    y += 3.5;
    doc.text('Email :', x, y);
    doc.text(this.print_data.email, 38, y);
    doc.text('Contact No.:', 148, y);
    doc.text(this.print_data.salesman.contact_no1, 178, y); */

    y += 6;
    // doc.setFontType("bold");
    doc.text('Item', x, y);
    doc.text('Weight', 120, y, 'right');
    doc.text('Stone', 147, y, 'right');
    doc.text('Price', 176, y, 'right');
    doc.text('Agree Rate', end_x, y, 'right');

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
        doc.text(this.print_data.branch.name, 183, 10);
        doc.text(this.print_data.ddate, 183, 17);
        doc.setFontSize(14);
        doc.text('' + this.print_data.id, 183, 24);
        doc.setFont('courier');
        doc.setFontSize(11);
        doc.text('Page No: ' + page_number, 183, 31);
        y = 38;
      }

      item_count++;

      //                    let text1 = item.item.des
      //                    let len=item.item.des.length()
      //                    if(len>50){
      //
      //                    }

      let chunk_text = this.chunkString(item.tag.item_name, 50);

      doc.text(
        item_order +
          '. ' +
          chunk_text[0] +
          ' ' +
          item.tag.gold_type +
          ' (' +
          item.tag.tag_no +
          ')',
        x,
        y,
      );
      doc.text(item.weight, 120, y, 'right');
      doc.text(item.st_weight, 147, y, 'right');
      doc.text(fun.numberWithCommas(item.price), 176, y, 'right');
      doc.text(fun.numberWithCommas(item.agree_rate), end_x, y, 'right');

      if (chunk_text.length > 1) {
        for (let t = 1; t < chunk_text.length; t++) {
          y += 3.5;
          doc.text(' ' + chunk_text[t], x + 3.5, y);
          item_count++;
        }
      }

      y += 3.5;

      //           console.log(item_order, " ", item_count, " ", page_count, " ", page_number)
      if (page_count == 0 && page_number == 1 && item_count > 6) {
        item_count = 0;
        page_count++;
        page_number++;
        /*if (this.total_items == 7) {

                 } else {
                 y += 81
                 doc.text("Page No: " + page_number, 178, y - 5.3);
                 }*/
      } else if (item_count >= 16) {
        // if (page_number % 2 > 0) {
        //     y += 27
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
      fun.numberWithCommas(this.print_data.tot_amount),
      end_x,
      y,
      'right',
    );

    // doc.setFontType("normal");
    doc.setFontSize(11);

    y += 2.8;
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(179, y, line_end, y);
    y += 0.7;
    doc.line(179, y, line_end, y);

    if (parseFloat(this.print_data.cash_pay) > 0) {
      y += 7;
      doc.text('Cash', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.cash_pay),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.card_pay) > 0) {
      y += 7;
      doc.text('Card', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.card_pay),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.old_gold_pay) > 0) {
      y += 7;
      doc.text('Old Gold:', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.old_gold_pay),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.fc_amount) > 0) {
      y += 7;
      doc.text('Foreign Currency:', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.fc_amount),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.bank_deposit) > 0) {
      y += 7;
      doc.text('Bank Deposit:', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.bank_deposit),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.return_pay) > 0) {
      y += 7;
      doc.text('Return Settle:', 140, y, 'left');
      doc.text(
        fun.numberWithCommas(this.print_data.return_pay),
        end_x,
        y,
        'right',
      );
    }

    if (parseFloat(this.print_data.credit) > 0) {
      y += 7;
      doc.text('Balance due:', 140.5, y, 'left');
      doc.text(fun.numberWithCommas(this.print_data.credit), end_x, y, 'right');
    }

    y += 3.5;
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(179, y, line_end, y);
    //                y += 2
    //                doc.line(500, y, line_end, y);

    /*
         doc.setTextColor(140);
         doc.setFontSize(25);
         doc.text( 'Duplicate', 140, 300, 45, 'center' ); // Rotate text testing
         */

    //                doc.save('Invoice.pdf');
    doc.autoPrint(); // <<--------------------- !!
    // doc.output('dataurlnewwindow');
    let newWindow = window.open(doc.output('bloburl'), '_blank');
    //                window.open(doc.output('bloburl'));

    // setTimeout(function () {
    //   newWindow.close();
    // }, 120000);
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
