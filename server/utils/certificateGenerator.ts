import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

export interface CertificateData {
  noticeId: string;
  noticeType: string;
  applicantName?: string;
  premisesName?: string;
  premisesAddress?: string;
  publishedDate: Date;
  publishedBy: string;
  publicationUrl: string;
  noticeText: string;
  representationsDeadline?: Date;
  certificateNumber?: string;
}

/**
 * Generate a PDF publication certificate for a notice
 * This serves as legal proof of publication
 */
export async function generatePublicationCertificate(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `Publication Certificate - ${data.noticeId}`,
          Author: 'CivicNotices',
          Subject: `Certificate of Publication for ${data.noticeType}`,
          Keywords: 'publication certificate, legal notice, public notice'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate certificate number if not provided
      const certificateNumber = data.certificateNumber ||
        `CERT-${data.noticeId.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      // Header with logo placeholder
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF PUBLICATION', {
          align: 'center'
        });

      doc.moveDown();

      // Certificate number
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Certificate Number: ${certificateNumber}`, {
          align: 'center'
        });

      doc.moveDown(2);

      // Certification statement
      doc.fontSize(12)
        .fillColor('#000000')
        .font('Helvetica')
        .text('This is to certify that the following public notice has been duly published in accordance with all applicable statutory requirements:', {
          align: 'justify'
        });

      doc.moveDown(2);

      // Notice details section
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('NOTICE DETAILS', {
          underline: true
        });

      doc.moveDown();

      // Notice information
      const details = [
        ['Notice Type:', data.noticeType],
        ['Notice ID:', data.noticeId],
        ['Published Date:', format(data.publishedDate, 'dd MMMM yyyy')],
        ['Published By:', data.publishedBy],
      ];

      if (data.applicantName) {
        details.push(['Applicant:', data.applicantName]);
      }

      if (data.premisesName) {
        details.push(['Premises:', data.premisesName]);
      }

      if (data.premisesAddress) {
        details.push(['Address:', data.premisesAddress]);
      }

      if (data.representationsDeadline) {
        details.push(['Representations Deadline:', format(data.representationsDeadline, 'dd MMMM yyyy')]);
      }

      doc.font('Helvetica');
      details.forEach(([label, value]) => {
        const currentY = doc.y;
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text(label, 50, currentY, { continued: true, width: 150 })
          .font('Helvetica')
          .text(` ${value}`, { width: 350 });
        doc.moveDown(0.5);
      });

      doc.moveDown();

      // Publication URL
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('PUBLICATION URL', {
          underline: true
        });

      doc.moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#0066cc')
        .text(data.publicationUrl, {
          link: data.publicationUrl,
          underline: true
        });

      doc.fillColor('#000000');
      doc.moveDown(2);

      // Notice text section
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('PUBLISHED NOTICE TEXT', {
          underline: true
        });

      doc.moveDown();

      // Box around notice text
      const textBoxTop = doc.y;
      const textBoxHeight = 200; // Approximate height

      doc.rect(50, textBoxTop, doc.page.width - 100, textBoxHeight)
        .stroke('#cccccc');

      // Notice text content (truncated if too long)
      const maxNoticeLength = 1500;
      const noticeText = data.noticeText.length > maxNoticeLength
        ? data.noticeText.substring(0, maxNoticeLength) + '...\n\n[Full text available at the publication URL]'
        : data.noticeText;

      doc.fontSize(9)
        .font('Helvetica')
        .text(noticeText, 60, textBoxTop + 10, {
          width: doc.page.width - 120,
          height: textBoxHeight - 20,
          ellipsis: true
        });

      // Move to after the box
      doc.y = textBoxTop + textBoxHeight + 20;

      // Legal statement
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('LEGAL COMPLIANCE', {
          underline: true
        });

      doc.moveDown(0.5);

      doc.fontSize(9)
        .font('Helvetica')
        .text('This notice has been published in compliance with the relevant statutory requirements including but not limited to:', {
          align: 'justify'
        });

      doc.moveDown(0.5);

      const legalRequirements = [
        '• The Licensing Act 2003 (where applicable)',
        '• The Gambling Act 2005 (where applicable)',
        '• The Town and Country Planning Act 1990 (where applicable)',
        '• Local Government Act 1972',
        '• All relevant secondary legislation and regulations'
      ];

      legalRequirements.forEach(req => {
        doc.text(req);
      });

      doc.moveDown(2);

      // Verification section
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('VERIFICATION', {
          underline: true
        });

      doc.moveDown(0.5);

      doc.fontSize(9)
        .font('Helvetica')
        .text('This certificate has been automatically generated and cryptographically signed. The authenticity of this certificate can be verified at:', {
          align: 'justify'
        });

      doc.moveDown(0.5);

      const verifyUrl = `https://civicnotices.co.uk/verify/${certificateNumber}`;
      doc.fillColor('#0066cc')
        .text(verifyUrl, {
          link: verifyUrl,
          underline: true
        });

      doc.fillColor('#000000');

      // Footer
      const footerY = doc.page.height - 100;

      doc.fontSize(8)
        .fillColor('#666666')
        .text('CivicNotices - Digital Public Notice Platform', 50, footerY, {
          align: 'center',
          width: doc.page.width - 100
        });

      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, {
        align: 'center',
        width: doc.page.width - 100
      });

      doc.text('This is an official publication certificate', {
        align: 'center',
        width: doc.page.width - 100
      });

      // Add page numbers if multiple pages
      const range = doc.bufferedPageRange();
      if (range && range.count > 0) {
        for (let i = 0; i < range.count; i++) {
          // PDFKit pages are 0-indexed but we need to check if the page exists
          if (doc.switchToPage) {
            try {
              doc.switchToPage(i);
              doc.fontSize(8)
                .fillColor('#999999')
                .text(`Page ${i + 1} of ${range.count}`,
                  50,
                  doc.page.height - 40,
                  {
                    align: 'center',
                    width: doc.page.width - 100
                  }
                );
            } catch (e) {
              // Page numbering failed, continue without it
              console.log('Could not add page numbers:', e);
            }
          }
        }
      }

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a simple receipt for payment
 */
export async function generatePaymentReceipt(data: {
  noticeId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  customerEmail: string;
  description: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('PAYMENT RECEIPT', {
          align: 'center'
        });

      doc.moveDown();

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Receipt Date: ${format(data.paymentDate, 'dd MMMM yyyy HH:mm')}`, {
          align: 'center'
        });

      doc.moveDown(2);

      // Payment details
      doc.fillColor('#000000')
        .fontSize(11);

      const paymentDetails = [
        ['Notice ID:', data.noticeId],
        ['Amount:', `${data.currency} ${data.amount.toFixed(2)}`],
        ['Payment Method:', data.paymentMethod],
        ['Customer Email:', data.customerEmail],
        ['Description:', data.description]
      ];

      paymentDetails.forEach(([label, value]) => {
        const currentY = doc.y;
        doc.font('Helvetica-Bold')
          .text(label, 50, currentY, { continued: true, width: 150 })
          .font('Helvetica')
          .text(` ${value}`, { width: 350 });
        doc.moveDown();
      });

      doc.moveDown(2);

      // Thank you message
      doc.fontSize(10)
        .font('Helvetica')
        .text('Thank you for using CivicNotices. Your notice has been published and is now publicly accessible.', {
          align: 'center',
          width: doc.page.width - 100
        });

      // Footer
      doc.fontSize(8)
        .fillColor('#666666')
        .text('CivicNotices - Digital Public Notice Platform', 50, doc.page.height - 80, {
          align: 'center',
          width: doc.page.width - 100
        });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}