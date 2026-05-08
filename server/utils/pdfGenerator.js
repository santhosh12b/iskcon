const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const generateTicketPDF = async (booking, event, seatRange = 'GENERAL') => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const pageWidth = doc.page.width;
            const tW = 400; 
            const tH = 800; // Increased height for maximum safety
            const tX = (pageWidth - tW) / 2;
            const tY = 40;

            // ── Main Background ──────────────────────────────────────────
            doc.rect(tX, tY, tW, tH).fill('#1A1A1A'); // Dark background container

            // ── Header Booking ID ──────────────────────────────────────────
            doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica')
               .text('Booking ID', tX + 25, tY + 15);
            doc.fontSize(14).font('Helvetica-Bold')
               .text(booking.bookingId.toUpperCase(), tX + 90, tY + 12);

            // ── Event Poster Banner (Full Width) ───────────────────────────
            const bannerH = 220;
            const bannerY = tY + 45;
            
            try {
                const imgPath = event.image ? path.join(__dirname, '..', event.image) : null;
                if (imgPath && fs.existsSync(imgPath)) {
                    doc.image(imgPath, tX, bannerY, { width: tW, height: bannerH, cover: [tW, bannerH] });
                } else {
                    doc.rect(tX, bannerY, tW, bannerH).fill('#333333');
                }
            } catch (e) {
                doc.rect(tX, bannerY, tW, bannerH).fill('#333333');
            }

            // ── White Ticket Area ──────────────────────────────────────────
            const ticketY = bannerY + bannerH;
            const ticketH = tH - (ticketY - tY) - 50;
            doc.rect(tX, ticketY, tW, ticketH).fill('#FFFFFF');

            // ── Title Section ──────────────────────────────────────────────
            let currentY = ticketY + 25;
            doc.fillColor('#000000').fontSize(18).font('Helvetica-Bold')
               .text(event.title, tX + 25, currentY, { width: tW - 50 });
            currentY = doc.y + 5;
            doc.fillColor('#666666').fontSize(11).font('Helvetica')
               .text('(Divine Musical Evening)', tX + 25, currentY);
            
            // Divider
            currentY += 25;
            doc.moveTo(tX + 25, currentY).lineTo(tX + tW - 25, currentY).strokeColor('#F0F0F0').lineWidth(1).stroke();

            // ── Info Grid (Date & Time) ────────────────────────────────────
            currentY += 15;
            doc.fillColor('#999999').fontSize(10).font('Helvetica').text('Date', tX + 25, currentY);
            doc.text('Time', tX + 220, currentY);
            
            currentY += 18;
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text(event.date, tX + 25, currentY);
            doc.text(event.time, tX + 220, currentY);

            // Divider
            currentY += 28;
            doc.moveTo(tX + 25, currentY).lineTo(tX + tW - 25, currentY).strokeColor('#F0F0F0').stroke();

            // ── Venue & Seats ──────────────────────────────────────────────
            currentY += 15;
            doc.fillColor('#999999').fontSize(10).font('Helvetica').text('Venue(s)', tX + 25, currentY);
            doc.text('Seats', tX + 220, currentY);
            
            currentY += 18;
            doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
               .text(event.location, tX + 25, currentY, { width: 180 });
            doc.text(seatRange, tX + 220, currentY);

            // ── BOTTOM-UP FIXED POSITIONING ───────────────────────────────
            const footerY = tY + tH;

            // 1. Black Bottom Bar
            const bBarH = 50;
            const bBarY = footerY - bBarH;
            doc.rect(tX, bBarY, tW, bBarH).fill('#1A1A1A');
            doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
               .text('Kirtan Kovai', tX + 25, bBarY + 18);
            doc.text('M-Ticket', tX, bBarY + 18, { width: tW - 25, align: 'right' });

            // 2. Cancellation Policy
            const polY = bBarY - 30;
            doc.moveTo(tX + 25, polY).lineTo(tX + tW - 25, polY).strokeColor('#F9F9F9').lineWidth(1).stroke();
            doc.fillColor('#777777').fontSize(9).font('Helvetica')
               .text('This transaction cannot be cancelled as per event cancellation policy.', tX + 40, polY + 10, { width: tW - 80, align: 'center' });
            // 3. Booking ID Text
            const bIdY = polY - 15;
            doc.fillColor('#999999').fontSize(9).font('Helvetica')
               .text(booking.bookingId.toUpperCase(), tX, bIdY, { width: tW, align: 'center' });


            // 4. QR Code
            const qSize = 135;
            const qY = bIdY - qSize - 8;
            const qX = tX + (tW - qSize) / 2;
            const validationUrl = `${process.env.FRONTEND_URL}/checkin/${booking.bookingId}`;
            const qrCodeDataURL = await QRCode.toDataURL(validationUrl, { 
                margin: 1,
                width: 400, // Higher resolution for scanning
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            doc.image(qrCodeDataURL, qX, qY, { width: qSize });


            // 5. Perforation (Notch Line)
            const nY = qY - 20;
            doc.circle(tX, nY, 12).fill('#1A1A1A');
            doc.circle(tX + tW, nY, 12).fill('#1A1A1A');
            doc.moveTo(tX + 15, nY).lineTo(tX + tW - 15, nY).dash(3, { space: 3 }).strokeColor('#EEEEEE').stroke();
            doc.undash();

            doc.end();




        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateTicketPDF };


