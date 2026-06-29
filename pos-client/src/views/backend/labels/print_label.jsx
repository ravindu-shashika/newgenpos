import React from 'react';
import { jsPDF } from 'jspdf';
import bwipjs from 'bwip-js';

const MultiBarcodePrinter = ({ products, barcodeDetails, printSettings, businessName }) => {

    const generatePDF = async () => {
        // 1 inch = 72 points
        const IN_TO_PT = 72;

        // Label dimensions from barcodeDetails
        const labelW = barcodeDetails.width * IN_TO_PT;
        const labelH = barcodeDetails.height * IN_TO_PT;
        const colGap = (barcodeDetails.col_distance || 0) * IN_TO_PT;
        const rowGap = (barcodeDetails.row_distance || 0) * IN_TO_PT;
        const stickersPerRow = parseInt(barcodeDetails.stickers_in_one_row) || 1;

        // Standard A4 or Custom Page Size calculation
        // If it's a sheet, we usually use A4 (595 x 842 pt)
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        let currentX = 20; // Left margin
        let currentY = 20; // Top margin
        const startX = 20;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            // Calculate position in the grid
            const colIndex = i % stickersPerRow;
            const xPos = startX + (colIndex * (labelW + colGap));

            // If we are starting a new row (after the first one)
            if (i > 0 && colIndex === 0) {
                currentY += labelH + rowGap;
            }

            // Check if we need a new page (A4 height is ~842pt)
            if (currentY + labelH > 800) {
                doc.addPage();
                currentY = 20;
            }

            // --- Draw Sticker Content ---
            const centerX = xPos + (labelW / 2);
            let textY = currentY + 10;

            // 1. Business Name
            if (printSettings.business_name) {
                doc.setFontSize(printSettings.business_name_size || 10);
                doc.setFont('helvetica', 'bold');
                doc.text(businessName, centerX, textY, { align: 'center' });
                textY += (printSettings.business_name_size || 10) * 1.1;
            }

            // 2. Product Name
            if (printSettings.name) {
                doc.setFontSize(printSettings.name_size || 9);
                doc.setFont('helvetica', 'normal');
                // Truncate long names to fit label width
                const splitName = doc.splitTextToSize(product.product_actual_name, labelW - 10);
                doc.text(splitName, centerX, textY, { align: 'center' });
                textY += (splitName.length * (printSettings.name_size || 9));
            }

            // 3. Price (with Promo logic)
            if (printSettings.price) {
                doc.setFontSize(printSettings.price_size || 10);
                let priceTxt = "";
                if (product.product_promo_price && product.product_promo_price !== 'null') {
                    priceTxt = `${product.product_price} (Promo: ${product.product_promo_price}) ${product.currency}`;
                } else {
                    priceTxt = product.currency_position === 'prefix'
                        ? `${product.currency} ${product.product_price}`
                        : `${product.product_price} ${product.currency}`;
                }
                doc.text(priceTxt, centerX, textY, { align: 'center' });
                textY += 10;
            }

            // 4. Barcode
            try {
                const canvas = document.createElement('canvas');
                await bwipjs.toCanvas(canvas, {
                    bcid: product.barcode_type.toLowerCase().replace('code', 'code'), // Handle mapping
                    text: product.sub_sku,
                    scale: 2,
                    height: 10,
                    includetext: false,
                });

                const bcWidth = labelW * 0.8;
                const bcHeight = labelH * 0.25;
                doc.addImage(canvas.toDataURL('image/png'), 'PNG', xPos + (labelW - bcWidth) / 2, textY, bcWidth, bcHeight);

                // 5. SKU Text
                doc.setFontSize(8);
                doc.text(product.sub_sku, centerX, textY + bcHeight + 8, { align: 'center' });
            } catch (err) {
                console.error("Barcode Error:", err);
            }
        }

        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <button onClick={generatePDF} className="btn-print">
            Print Sheet Labels
        </button>
    );
};