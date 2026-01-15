import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { format } from 'date-fns';

export interface BlueNoticeData {
  noticeId: string;
  noticeType: string;
  applicantName?: string;
  premisesName?: string;
  premisesAddress?: string;
  publishedDate: Date;
  representationsDeadline: Date;
  publicationUrl: string;
  councilName?: string;
  departmentName?: string;
  noticeText: string;
  licensableActivities?: string[];
  operatingHours?: string;
}

/**
 * Generate a Blue Notice PDF for premises licensing applications
 * This is designed to be printed and displayed at the premises
 */
export async function generateBlueNoticePDF(data: BlueNoticeData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 30,
          bottom: 30,
          left: 30,
          right: 30
        },
        info: {
          Title: `Blue Notice - ${data.premisesName || data.noticeId}`,
          Author: 'CivicNotices',
          Subject: `Licensing Notice for ${data.premisesName}`,
          Keywords: 'blue notice, licensing notice, premises licence'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Blue background
      doc.rect(0, 0, doc.page.width, doc.page.height)
        .fill('#0066CC');

      // White content area with rounded corners
      const contentMargin = 20;
      const contentX = contentMargin;
      const contentY = contentMargin;
      const contentWidth = doc.page.width - (contentMargin * 2);
      const contentHeight = doc.page.height - (contentMargin * 2);

      doc.roundedRect(contentX, contentY, contentWidth, contentHeight, 10)
        .fill('white');

      // Reset text color to black
      doc.fillColor('black');

      // Council header
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(data.councilName || 'LOCAL AUTHORITY', contentX + 20, contentY + 30, {
          align: 'center',
          width: contentWidth - 40
        });

      doc.fontSize(14)
        .font('Helvetica')
        .text(data.departmentName || 'Licensing Authority', {
          align: 'center'
        });

      doc.moveDown(1);

      // Main title
      doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#0066CC')
        .text('LICENSING ACT 2003', {
          align: 'center'
        });

      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('black')
        .text('NOTICE OF APPLICATION', {
          align: 'center'
        });

      doc.moveDown(1.5);

      // Notice type
      const noticeTypeText = data.noticeType.toUpperCase().replace(/-/g, ' ');
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(noticeTypeText, {
          align: 'center'
        });

      doc.moveDown(1);

      // Premises details
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PREMISES:', contentX + 20, doc.y);

      doc.font('Helvetica')
        .text(data.premisesName || 'N/A', contentX + 120, doc.y - 14);

      doc.moveDown(0.5);

      doc.font('Helvetica-Bold')
        .text('ADDRESS:', contentX + 20, doc.y);

      doc.font('Helvetica')
        .text(data.premisesAddress || 'N/A', contentX + 120, doc.y - 14, {
          width: contentWidth - 160
        });

      doc.moveDown(1.5);

      doc.font('Helvetica-Bold')
        .text('APPLICANT:', contentX + 20, doc.y);

      doc.font('Helvetica')
        .text(data.applicantName || 'N/A', contentX + 120, doc.y - 14);

      doc.moveDown(1.5);

      // Main notice text
      doc.fontSize(11)
        .font('Helvetica')
        .text('TAKE NOTICE that an application has been made to the Licensing Authority for:', contentX + 20, doc.y, {
          width: contentWidth - 40,
          align: 'justify'
        });

      doc.moveDown(0.5);

      // Licensable activities
      if (data.licensableActivities && data.licensableActivities.length > 0) {
        doc.font('Helvetica-Bold')
          .text('Licensable Activities:', contentX + 20, doc.y);

        doc.font('Helvetica');
        data.licensableActivities.forEach(activity => {
          doc.text(`• ${activity}`, contentX + 30, doc.y, {
            width: contentWidth - 60
          });
        });
      }

      doc.moveDown(1);

      // Operating hours if provided
      if (data.operatingHours) {
        doc.font('Helvetica-Bold')
          .text('Proposed Operating Hours:', contentX + 20, doc.y);

        doc.font('Helvetica')
          .text(data.operatingHours, contentX + 20, doc.y, {
            width: contentWidth - 40
          });

        doc.moveDown(1);
      }

      // Representations deadline
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#CC0000')
        .text('REPRESENTATIONS DEADLINE:', contentX + 20, doc.y);

      doc.fontSize(14)
        .text(format(data.representationsDeadline, 'dd MMMM yyyy'), {
          align: 'center'
        });

      doc.moveDown(1);

      // Legal text
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('black')
        .text(
          'Any person wishing to make representations in relation to this application may do so by writing to the Licensing Authority. ' +
          'Representations must be received no later than the date shown above. ' +
          'The full application can be viewed online or at the council offices during normal office hours.',
          contentX + 20,
          doc.y,
          {
            width: contentWidth - 40,
            align: 'justify'
          }
        );

      doc.moveDown(1.5);

      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(data.publicationUrl, {
        width: 120,
        margin: 0,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Position QR code at bottom center
      const qrSize = 120;
      const qrX = (doc.page.width - qrSize) / 2;
      const qrY = contentHeight - 200;

      doc.image(qrCodeData, qrX, qrY, {
        width: qrSize,
        height: qrSize
      });

      // QR code label
      doc.fontSize(10)
        .font('Helvetica')
        .text('Scan to view online and submit representations', qrX - 30, qrY + qrSize + 10, {
          width: qrSize + 60,
          align: 'center'
        });

      // Display instructions at the very bottom
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#0066CC')
        .text(
          'DISPLAY INSTRUCTIONS',
          contentX + 20,
          contentHeight - 50,
          {
            width: contentWidth - 40,
            align: 'center'
          }
        );

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('black')
        .text(
          `This notice must be displayed at or on the premises from ${format(data.publishedDate, 'dd MMMM yyyy')} to ${format(data.representationsDeadline, 'dd MMMM yyyy')}. ` +
          'The notice must be clearly visible and legible from outside the premises. ' +
          'It is recommended to display the notice in a window or on an external notice board protected from weather.',
          contentX + 20,
          contentHeight - 35,
          {
            width: contentWidth - 40,
            align: 'center'
          }
        );

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}