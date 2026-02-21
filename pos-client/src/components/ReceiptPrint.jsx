import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReceiptPrint = (title, data) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [parseInt(297), parseInt(210)],
  });

  const PawningReceipt = () => {
    doc.setFontSize(parseInt(18));

    doc.text(`Pawning Receipt`, 20, 20);

    doc.setFontSize(parseInt(12));
  };

  return <></>;
};

export default ReceiptPrint;
