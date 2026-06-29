import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const OpeningStockPrint = {
  async load(trans_no, bc_no, is_dupplicate) {
    const response = await api.get(`opening-stock/${trans_no}/${bc_no}`);
    this.print_data = response.data;
    this.total_items = response.data.details.length;
    this.printPDF(is_dupplicate);
  },

  printPDF(is_dupplicate) {
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

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(14);
    // doc.setFontType("bold");

    doc.text('Opening Stock', 162, 35);

    doc.setFontSize(11);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 162, 40.5);
    } else {
      doc.text('ORIGINAL', 162, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(11);
    y += 3.5;
    doc.text('Stores :', x, y);
    doc.text(this.print_data.store.description, 38, y);
    
    y += 3.5;
    doc.text('Note :', x, y);
    doc.text(this.print_data.memo, 38, y);

    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Item', x, y);
    doc.text('Qty', 115, y, 'right');
    doc.text('Weight', 137, y, 'right');
    doc.text('Stone Weight', 174, y, 'right');
    doc.text('Cost', end_x, y, 'right');

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
        doc.text('' + this.print_data.id, 183, 24);
        doc.setFont('courier');
        doc.setFontSize(11);
        doc.text('Page No: ' + page_number, 183, 31);
        y = 38;
      }

      item_count++;

      const chunk_text = this.chunkString(item.item.itemname, 50);

      doc.text(item_order + '. ' + chunk_text[0], x, y);
      doc.text(String(item.qty), 115, y, 'right');
      doc.text(item.weight, 137, y, 'right');
      doc.text(item.stone_weight, 174, y, 'right');
      doc.text(fun.numberWithCommas(item.value), end_x, y, 'right');

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
    doc.text('Total: ', 155, y, 'left');
    doc.text(
      fun.numberWithCommas(this.print_data.total_value),
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

    doc.autoPrint();

    let newWindow = window.open(doc.output('bloburl'), '_blank');

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
};

export default OpeningStockPrint;
