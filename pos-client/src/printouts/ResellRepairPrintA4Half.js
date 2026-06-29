import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const ResellRepairPrintA4Half = {
  async load(trans_no, bc_no, is_dupplicate) {
    const response = await api.get(`resell-repair/${trans_no}/${bc_no}`);
    this.print_data = response.data.result;
    this.total_items = response.data.result.details.length;
    this.printPDF(is_dupplicate);
  },

  printPDF(is_dupplicate) {
    let page_number = 0; 

    let doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: [350 , 200]
      //format: 'a5',
    });

    doc.setFont('courier');
    doc.setFontSize(11);
    // doc.setFontType("normal");
    // // doc.setFontType("bold");
    doc.text(this.print_data.branch.name, 310, 10);
    doc.text(this.print_data.ddate, 310, 17);
    doc.setFontSize(14);
    doc.text('' + this.print_data.nno, 310, 24);

    let x = 3;
    let y = 38;
    let line_end = 347;
    let end_x = 347;

    doc.setFont('Arial');
    doc.setFontSize(14);
    // doc.setFontType("bold");

    doc.text('RE-SELL REPAIR', 300, 35);   

    doc.setFontSize(11);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 302, 40.5);
    } else {
      doc.text('ORIGINAL', 302, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(11);
    y += 3.5;

    doc.text('Supplier :', x, y);
    doc.text(
      this.print_data.vendor.description +
        '(' +
        this.print_data.vendor.code +
        ')',
      38,
      y,
    );

    y += 3.5;

    doc.text('Mobile No. :', x, y);
    doc.text(this.print_data.vendor.mobile, 38, y);

    y += 3.5;
    doc.text('Address :', x, y);
    doc.text(this.print_data.vendor.address, 38, y);
    y += 3.5;
    // doc.text('Salesman:', x, y);
    // doc.text(this.print_data.salesman.name, 38, y);
    // page_number++;
    // doc.text('Page No: ' + page_number, 178, y);

    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Item', x, y);
    doc.text('Design', 70, y, 'right');
    doc.text('Metal', 90, y, 'right');
    doc.text('Color', 105, y, 'right');
    doc.text('Gender', 125, y, 'right');
    doc.text('Qty', 140, y, 'right');
    doc.text('Weight', 160, y, 'right');
    doc.text('St Weight', 195, y, 'right');
    doc.text('Rate', 220, y, 'right');
    doc.text('LCV', 240, y, 'right');
    doc.text('Wastage(8g)', 270, y, 'right');
    doc.text('Total Wastage', 310, y, 'right');
    doc.text('Repair Cost', end_x, y, 'right');

    y += 2;
    doc.setLineWidth(0.17);
    doc.setLineDash([1.7, 1.7], 0);
    doc.line(x, y, line_end, y);

    y += 4;
    doc.setFont(undefined, 'normal');
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
        doc.text('' + this.print_data.nno, 183, 24);
        doc.setFont('courier');
        doc.setFontSize(11);
        doc.text('Page No: ' + page_number, 183, 31);
        y = 38;
      }

      item_count++;

      const chunk_text = this.chunkString(item.item.itemname, 50);

      doc.text(item_order + '. ' + chunk_text[0], x, y);
      doc.text(item.design.designname, 70, y, 'right');
      doc.text(item.metal.description, 90, y, 'right');
      doc.text(item.color.description, 105, y, 'right');
      doc.text(item.gender.description, 125, y, 'right');
      doc.text(String(item.qty), 140, y, 'right');
      doc.text(item.weight, 160, y, 'right');
      doc.text(item.stone_weight, 195, y, 'right');
      doc.text(item.gold_rate, 220, y, 'right');
      doc.text(item.la_cost, 240, y, 'right');
      doc.text(item.wastage_per_pound, 270, y, 'right');
      doc.text(item.tot_wastage, 310, y, 'right');
      doc.text(fun.numberWithCommas(item.repair_cost), end_x, y, 'right');

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
    y += 5;
    // doc.setFontType("bold");
    doc.text('Discount: ',280, y, 'left');
    doc.text(
      fun.numberWithCommas(this.print_data.discount),
      end_x,
      y,
      'right',
    );
    y += 5;
    doc.text('Total: ', 280, y, 'left');
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
    doc.line(300, y, line_end, y);
    y += 0.7;
    doc.line(300, y, line_end, y);

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

export default ResellRepairPrintA4Half;
