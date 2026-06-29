import React from 'react';
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';

const BarcodePrinter = ({ labels, barcodeDetails, printSettings, businessName }) => {

    const generatePDF = async () => {
        // Convert inches to points (jsPDF default unit) -> 1 inch = 72 points
        const width = barcodeDetails.width * 72;
        const height = barcodeDetails.height * 72;

        // Create PDF with custom label size
        const doc = new jsPDF({
            orientation: width > height ? 'l' : 'p',
            unit: 'pt',
            format: [width, height]
        });

        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];

            // Add a new page for every label except the first one
            if (i > 0) doc.addPage([width, height]);

            let currentY = 10; // Starting Y position (padding)
            const centerX = width / 2;

            // 1. Business Name
            if (printSettings.business_name) {
                doc.setFontSize(printSettings.business_name_size || 12);
                doc.setFont('helvetica', 'bold');
                doc.text(businessName, centerX, currentY, { align: 'center' });
                currentY += (printSettings.business_name_size || 12) + 2;
            }

            // 2. Product Name
            if (printSettings.name) {
                doc.setFontSize(printSettings.name_size || 11);
                doc.setFont('helvetica', 'normal');
                doc.text(label.product_actual_name, centerX, currentY, { align: 'center' });
                currentY += (printSettings.name_size || 11) + 2;
            }

            // 3. Price
            if (printSettings.price) {
                doc.setFontSize(printSettings.price_size || 11);
                const priceText = label.currency_position === 'prefix'
                    ? `${label.currency} ${label.product_price}`
                    : `${label.product_price} ${label.currency}`;
                doc.text(priceText, centerX, currentY, { align: 'center' });
                currentY += (printSettings.price_size || 11) + 5;
            }

            // 4. Generate & Add Barcode
            try {
                const canvas = document.createElement('canvas');
                bwipjs.toCanvas(canvas, {
                    bcid: label.barcode_type.toLowerCase(), // e.g., 'code128'
                    text: label.sub_sku,
                    scale: 3,
                    height: 10,
                    includetext: false,
                });
                const barcodeData = canvas.toDataURL('image/png');

                // Calculate barcode dimensions (approx 40% of label height as per your CSS)
                const bcWidth = width * 0.8;
                const bcHeight = height * 0.3;
                doc.addImage(barcodeData, 'PNG', (width - bcWidth) / 2, currentY, bcWidth, bcHeight);

                // 5. SKU Text under barcode
                currentY += bcHeight + 8;
                doc.setFontSize(8);
                doc.text(label.sub_sku, centerX, currentY, { align: 'center' });
            } catch (e) {
                console.error("Barcode generation failed", e);
            }
        }

        // Output the PDF
        doc.autoPrint(); // Automatically opens print dialog
        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <div className="p-4">
            <button
                onClick={generatePDF}
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
            >
                Generate & Print Labels ({labels.length})
            </button>
        </div>
    );
};

export default BarcodePrinter;