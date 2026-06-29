import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';

const IssueJewelleryForRepairA4Half = {
  async loadInvoice(invoice_id, bc_no, is_dupplicate) {
    let trans_url = 'issue-jewellery-repair/get-details';
    let url_parameter = { invoice_id, bc_no }; 
    const response = await api.post(trans_url).values(url_parameter);
    if (response.data.issue_jewellery) {
      this.print_data = response.data.issue_jewellery;
      this.total_items = response.data.issue_jewellery.details.length;
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

    doc.text(this.print_data.branch.name, 183, 10);
    doc.text(this.print_data.ddate, 183, 17);
    doc.setFontSize(14);
    doc.text('' + this.print_data.id, 183, 24);
    // if(this.print_data.sales_order_id != 0){
    //   doc.text('SO - ' + this.print_data.sales_order_id, 183, 30);
    // }

    let x = 3;
    let y = 38;
    let line_end = 212;
    let end_x = 209;

    doc.setFont('Arial');
    doc.setFontSize(14);

    if (parseFloat(this.print_data.credit_amount)) {
      doc.text('ISSUE JEWELERY TO REPAIR', 140, 35);
    } else {
      doc.text('ISSUE JEWELERY TO REPAIR', 140, 35);
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

    doc.text('Supplier :', x, y);
    doc.text(
      this.print_data.vendor.name + '(' + this.print_data.vendor.nic + ')',
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
    doc.text('Page No: ' + page_number, 178, y);


    y += 6;
    // doc.setFontType("bold");
    doc.text('Item', x, y);
    doc.text('Description', 80, y, 'right');
    doc.text('Design', 100, y, 'right');
    doc.text('Gold Type', 130, y, 'right');
    doc.text('Metal', 150, y, 'right');
    doc.text('Color', 170, y, 'right');
    doc.text('Gender', 190, y, 'right');
    doc.text('Weight', 210, y, 'right');

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

        y = 38;
      }

      item_count++;

      let chunk_text = this.chunkString(item.item_name, 50);

      doc.text(item_order +'. ' +chunk_text[0] ,x,y,);
      doc.text(item.description, 80, y, 'right');
      doc.text(item.design.designname, 100, y, 'right');
      doc.text(item.gold_type, 130, y, 'right');
      doc.text(item.metal.description, 150, y, 'right');
      doc.text(item.color.description, 170, y, 'right');
      doc.text(item.gender.description, 190, y, 'right');
      doc.text(item.weight, end_x, y, 'right');

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

    y += 2.8;

    let newWindow = window.open(doc.output('bloburl'), '_blank');
   
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

export default IssueJewelleryForRepairA4Half;
