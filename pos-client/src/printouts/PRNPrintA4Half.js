import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const PRNPrint = {
  async load(trans_no, bc_no, is_dupplicate) {
    const response = await api.get(`purchase-returns/${trans_no}/${bc_no}`);
    //debugger
    this.print_data = response.data;
    this.total_items = response.data.details.length;
    this.printPDF(is_dupplicate);
  },

  printPDF(is_dupplicate) {
   // debugger
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
    doc.text('' + this.print_data.nno, 183, 24);

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(14);
    // doc.setFontType("bold");

      doc.text('Purchase Return Note', 162, 35);
    

    doc.setFontSize(11);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 162, 40.5);
    } else {
      doc.text('ORIGINAL', 162, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(11);
    y += 3.5;

    doc.text('Supplier :', x, y);
    doc.text(
      this.print_data.vendor.name +
        '(' +
        this.print_data.vendor.code +
        ')',
      38,
      y,
    );

    y += 3.5;

    doc.text('Description :', x, y);
    doc.text(this.print_data.vendor.description, 38, y);

    y += 5;
    doc.text('Store :', x, y);
    doc.text(this.print_data.store.description, 38, y);
    // y += 3.5;
    // doc.text('Salesman:', x, y);
    // doc.text(this.print_data.salesman.name, 38, y);
    // page_number++;
    // doc.text('Page No: ' + page_number, 178, y);

    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Item', x, y);
    doc.text('Qty', 115, y, 'right');
    doc.text('Weight', 137, y, 'right');
    doc.text('Stone Weight', 174, y, 'right');
    doc.text('Price', end_x, y, 'right');

    y += 2;
    doc.setLineWidth(0.17);
    doc.setLineDash([1.7, 1.7], 0);
    doc.line(x, y, line_end, y);

    y += 4;
    doc.setFont(undefined, 'normal');
    let item_count = 0;
    let page_count = 0;
    let item_order = 1;
    let tot_ret_qty = 0;

    this.print_data.details.forEach((item) => {
      if (page_count >= 1) {
        doc.addPage();

        item_count = 0;
        page_count = 0;
        doc.text(this.print_data.branch.name, 183, 10);
        doc.text(this.print_data.ddate, 183, 17);
        doc.setFontSize(14);
        doc.text('' + this.print_data.nno, 183, 24);
        doc.setFont('courier');
        doc.setFontSize(11);
        doc.text('Page No: ' + page_number, 183, 31);
        y = 38;
      }

      item_count++;

      const chunk_text = this.chunkString(item.item.itemname, 50);

      doc.text(item_order + '. ' + chunk_text[0], x, y);
      doc.text(String(item.ret_qty), 115, y, 'right');
      doc.text(item.ret_weight, 137, y, 'right');
      doc.text(item.ret_st_weight, 174, y, 'right');
      doc.text(fun.numberWithCommas(item.cost), end_x, y, 'right');

      tot_ret_qty += item.ret_qty; 

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

    y += 6;

    doc.setFont(undefined, 'bold');
    doc.text("" , x, y);
    doc.text(String(tot_ret_qty), 115, y, 'right');
    doc.text(this.print_data.total_stone_weight, 174, y, 'right');
    doc.text(fun.numberWithCommas(this.print_data.total_amount), end_x, y, 'right');
    doc.text(this.print_data.total_weight, 137, y, 'right');

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

 
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    y += 5;
    // doc.setFontType("bold");
    doc.text('Net Amount: ', 155, y, 'left');
    doc.text(
      fun.numberWithCommas(this.print_data.net_amount),
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

    // if (parseFloat(this.print_data.return_pay) > 0) {
    //   y += 5;
    //   doc.text('Return Settle', 155, y, 'left');
    //   doc.text(
    //     fun.numberWithCommas(this.print_data.return_pay),
    //     end_x,
    //     y,
    //     'right',
    //   );
    // }

    // if (parseFloat(this.print_data.card_pay) > 0) {
    //   y += 7;
    //   doc.text('Card', 155, y, 'left');
    //   doc.text(
    //     fun.numberWithCommas(this.print_data.card_pay),
    //     end_x,
    //     y,
    //     'right',
    //   );
    // }

    // if (parseFloat(this.print_data.old_gold_pay) > 0) {
    //   y += 7;
    //   doc.text('Old Gold Value', 155, y, 'left');
    //   doc.text(
    //     fun.numberWithCommas(this.print_data.old_gold_pay),
    //     end_x,
    //     y,
    //     'right',
    //   );
    // }

    // if (parseFloat(this.print_data.cash_pay) > 0) {
    //   y += 7;
    //   doc.text('Cash', 155, y, 'left');
    //   doc.text(
    //     fun.numberWithCommas(this.print_data.cash_pay),
    //     end_x,
    //     y,
    //     'right',
    //   );
    // }

    // if (parseFloat(this.print_data.credit) > 0) {
    //   y += 7;
    //   doc.text('Balance due', 155.5, y, 'left');
    //   doc.text(fun.numberWithCommas(this.print_data.credit), end_x, y, 'right');
    // }

    // y += 3.5;
    // doc.setLineWidth(0.17);
    // doc.setLineDash(0, 0);
    // doc.line(179, y, line_end, y);

    doc.autoPrint();

    let newWindow = window.open(doc.output('bloburl'), '_blank');

    setTimeout(function () {
      newWindow.close();
    }, 120000);
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

export default PRNPrint;

