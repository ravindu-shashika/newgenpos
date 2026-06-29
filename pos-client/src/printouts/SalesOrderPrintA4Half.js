import fun from './fun';
import { api } from '../services';
import { jsPDF } from 'jspdf';
// import axios from 'axios';
// import CookieService from '../services/cookie';

const SalesOrderPrint = {
  async load(trans_no, bc_no, is_dupplicate) {
    let trans_url = 'sales-orders/get-details';
    let url_parameter = { trans_no, bc_no };
    const response = await api.post(trans_url).values(url_parameter);
    this.print_data = response.data.sales_order;
    this.total_items = response.data.sales_order.details.length;
    this.printPDFInvoice(is_dupplicate);
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
    // doc.setFontType("bold");
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

    doc.text('SALES ORDER', 162, 35);

    doc.setFontSize(11);
    if (is_dupplicate) {
      doc.text('DUPLICATE', 162, 40.5);
    } else {
      doc.text('ORIGINAL', 162, 40.5);
    }

    doc.setFont('courier');
    doc.setFontSize(11);
    y += 3.5;

    doc.setFont('courier', 'bold');
    doc.text('Customer :', x, y);
    doc.text(
      this.print_data.customer.cusname +
        '(' +
        this.print_data.customer.nicno +
        ')',
      38,
      y,
    );

    doc.setFont('courier', 'normal');
    y += 4;
    doc.text('Mobile No. :', x, y);
    doc.text(this.print_data.customer.mobile, 38, y);

    y += 3.5;
    doc.text('Address :', x, y);
    doc.text(this.print_data.customer.address, 38, y);
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

    if (this.print_data.order_type === 'T') {
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
        doc.text(item.weight + 'g', 120, y, 'right');
        doc.text(item.st_weight + 'g', 147, y, 'right');
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

      doc.setLineWidth(0.17);
      doc.setLineDash([1.7, 1.7], 0);
      doc.line(x, y, line_end, y);
    } else {
      y += 10;
      doc.setFont('courier', 'bold');
      doc.text('Item Descriptions:', x, y);
      doc.setFont('courier', 'normal');
      y += 4;
      doc.text(this.print_data.item_description, 38, y);
      
      y += 4;
      // doc.textWithLink('Design Attached', x + 20, 120, {
      //   url: api.getMainImagePath() + this.print_data.design_url,
      // });

      window.open(api.getMainImagePath() + this.print_data.design_url);

      // var img = new Image();
      // img.src =
      //   api.getMainImagePath() +
      //   this.print_data.design_url +
      //   '?r=' +
      //   Math.floor(Math.random() * 100000);

      // axios
      //   .get(api.getMainImagePath() + this.print_data.design_url, {
      //     responseType: 'stream',
      //     headers: { Authorization: CookieService.get('access_token') }
      //   })
      //   .then((response) => {
      //     const buffer = Buffer.from(response.data, 'base64');
      //     doc.addImage(buffer, 'JPEG', 10, 78, 12, 15);
      //   })
      //   .catch((ex) => {
      //     console.error(ex);
      //   });
    }

    doc.setFont('courier');
    doc.setFontSize(11);

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
    doc.setFont('courier', 'bold');
    doc.text('Total: ', 155, y, 'left');
    doc.text(
      fun.numberWithCommas(this.print_data.tot_amount),
      end_x,
      y,
      'right',
    );

    y += 2.8;
    doc.setLineWidth(0.17);
    doc.setLineDash(0, 0);
    doc.line(179, y, line_end, y);
    y += 0.7;
    doc.line(179, y, line_end, y);

    //                doc.save('Invoice.pdf');
    doc.autoPrint(); // <<--------------------- !!
    // doc.output('dataurlnewwindow');
    let newWindow = window.open(doc.output('bloburl'), '_blank');
    //                window.open(doc.output('bloburl'));

    // newWindow.onafterprint = () => {
    //     newWindow.close()
    // }

    /* setTimeout(function () {
      newWindow.close();
    }, 120000); */
  },

  toDataURL(url, callback) {
    
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      var reader = new FileReader();
      reader.onloadend = function () {
        callback(reader.result);
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
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

export default SalesOrderPrint;
