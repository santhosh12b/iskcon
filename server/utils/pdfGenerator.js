const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const generateTicketPDF = async (booking, event) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const pageWidth = doc.page.width;
            const tW = 520; 
            const tH = 280; 
            const tX = (pageWidth - tW) / 2;
            const tY = 80;

            // ── Background & Border ────────────────────────────────────────
            doc.roundedRect(tX, tY, tW, tH, 8).fill('#FFFFFF');
            doc.roundedRect(tX, tY, tW, tH, 8).lineWidth(1).strokeColor('#DDDDDD').stroke();

            // ── Perforation & Stub (Right Side) ─────────────────────────────
            const stubW = 120;
            const stubX = tX + tW - stubW;
            
            // Stub Header (Dark Blue)
            doc.rect(stubX, tY, stubW, 280).fill('#1A2B3C');
            
            // Perforation Line
            doc.moveTo(stubX, tY).lineTo(stubX, tY + tH)
               .dash(2, { space: 2 })
               .strokeColor('#AAAAAA').lineWidth(0.5).stroke();
            doc.undash();

            // ── Header Section ──────────────────────────────────────────────
            // Artist Title
            doc.fillColor('#1A2B3C').fontSize(24).font('Helvetica-Bold')
               .text(event.artist || 'KIRTAN KOVAI BAND', tX + 20, tY + 25, { width: tW - stubW - 40, align: 'center' });

            // Event Subtitle Banner
            const bannerY = tY + 65;
            doc.rect(tX, bannerY, tW - stubW, 35).fill('#E6B84A');
            doc.fillColor('#1A2B3C').fontSize(11).font('Helvetica-Bold')
               .text(event.title.toUpperCase(), tX + 20, bannerY + 12, { width: tW - stubW - 40, align: 'center' });

            // ── Artistic / Middle Section ───────────────────────────────────
            const artY = bannerY + 35;
            const artH = 60;
            doc.rect(tX, artY, tW - stubW, artH).fill('#FDF5E6');
            
            // Text in middle
            doc.fillColor('#1A2B3C').fontSize(14).font('Helvetica-Bold')
               .text('KIRTAN KOVAI', tX, artY + 22, { width: tW - stubW, align: 'center' });

            // ── Information Grid ────────────────────────────────────────────
            const gridY = artY + artH + 20;
            const labelX = tX + 25;
            const valueX = labelX + 65;
            const col2X = tX + 260;
            const rowH = 28;

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#444444');

            // DATE
            doc.text('DATE:', labelX, gridY);
            doc.fillColor('#000000').text(event.date, valueX, gridY);
            doc.moveTo(valueX, gridY + 12).lineTo(col2X - 20, gridY + 12).strokeColor('#CCCCCC').lineWidth(0.5).stroke();

            // TIME
            doc.fillColor('#444444').text('TIME:', labelX, gridY + rowH);
            doc.fillColor('#000000').text(event.time, valueX, gridY + rowH);
            doc.moveTo(valueX, gridY + rowH + 12).lineTo(col2X - 20, gridY + rowH + 12).stroke();

            // VENUE
            doc.fillColor('#444444').text('VENUE:', labelX, gridY + rowH * 2);
            doc.fillColor('#000000').fontSize(9).text(event.location, valueX, gridY + rowH * 2, { width: col2X - valueX - 10 });
            doc.moveTo(valueX, gridY + rowH * 2 + 12).lineTo(col2X - 20, gridY + rowH * 2 + 12).stroke();

            // SEAT NO
            doc.fontSize(10).fillColor('#444444').text('SEAT NO:', labelX, gridY + rowH * 3);
            doc.fillColor('#000000').text('GENERAL', valueX, gridY + rowH * 3);
            doc.moveTo(valueX, gridY + rowH * 3 + 12).lineTo(col2X - 20, gridY + rowH * 3 + 12).stroke();

            // PRICE & NO
            doc.fillColor('#444444').text('TICKET PRICE:', col2X, gridY);
            doc.fillColor('#000000').text(`Rs. ${event.price}`, col2X + 90, gridY);
            doc.moveTo(col2X + 90, gridY + 12).lineTo(stubX - 90, gridY + 12).stroke();

            doc.fillColor('#444444').text('No.', col2X + 30, gridY + rowH * 2);
            doc.fillColor('#666666').fontSize(8).text(booking.bookingId, col2X + 55, gridY + rowH * 2);

            // ── QR Code Section ─────────────────────────────────────────────
            const qrSize = 65;
            const qrX = stubX - qrSize - 15;
            const qrY = gridY + 10;
            const qrData = JSON.stringify({ id: booking.bookingId });
            const qrCodeDataURL = await QRCode.toDataURL(qrData, { margin: 1 });
            doc.image(qrCodeDataURL, qrX, qrY, { width: qrSize });
            doc.fontSize(7).fillColor('#666666').text('SCAN FOR ENTRY', qrX, qrY + qrSize + 5, { width: qrSize, align: 'center' });

            // ── Admit One (Stamp style) ────────────────────────────────────
            doc.save();
            doc.rotate(-5, { origin: [tX + 320, tY + tH - 45] });
            doc.fillColor('#8C1C13').fontSize(14).font('Helvetica-Bold')
               .text('ADMIT ONE', tX + 280, tY + tH - 55);
            doc.restore();

            // ── Footer ──────────────────────────────────────────────────────
            doc.fillColor('#888888').fontSize(7).font('Helvetica')
               .text('GENERAL ADMISSION. NO REFUNDS. For inquiries: +91 98765 43210', tX + 25, tY + tH - 18);

            // ── Stub Info (White on Dark Blue) ──────────────────────────────
            const sTX = stubX + 15;
            doc.fillColor('#FFFFFF').font('Helvetica-Bold');
            
            doc.fontSize(8).text('DATE', sTX, tY + 30);
            doc.fontSize(10).text(event.date, sTX, tY + 42);

            doc.fontSize(8).text('TIME', sTX, tY + 75);
            doc.fontSize(10).text(event.time, sTX, tY + 87);

            doc.fontSize(8).text('VENUE', sTX, tY + 120);
            doc.fontSize(9).text(event.location.substring(0, 18) + '...', sTX, tY + 132);

            doc.fontSize(8).text('SEAT NO', sTX, tY + 165);
            doc.fontSize(10).text('GENERAL', sTX, tY + 177);
            
            doc.fontSize(7).font('Helvetica').text('TICKET ID', sTX, tY + 230);
            doc.fontSize(8).text(booking.bookingId.split('-')[1] || 'XXXX', sTX, tY + 242);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateTicketPDF };
