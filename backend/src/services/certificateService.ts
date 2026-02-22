import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { Readable } from 'stream';

interface CertificateData {
  certificateNumber: string;
  certificateType: 'LIEN' | 'CUSTODY';
  issueDate: Date;
  status: string;
  assetId: string;
  assetType: string;
  assetValue: number;
  tokenId?: string;
  ownerName: string;
  ownerEmail: string;
  lockedDate: Date;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  lienHolder?: string;
  lienHolderEmail?: string;
  loanId?: string;
  verificationHash: string;
  verificationUrl: string;
}

export class CertificateService {
  /**
   * Generate a unique certificate number
   * Format: CERT-YYYY-NNNNNN
   */
  static async generateCertificateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const Certificate = (await import('../models/Certificate')).default;
    
    // Count certificates issued this year
    const count = await Certificate.countDocuments({
      certificate_number: new RegExp(`^CERT-${year}-`)
    });
    
    const sequentialNumber = (count + 1).toString().padStart(6, '0');
    return `CERT-${year}-${sequentialNumber}`;
  }

  /**
   * Calculate verification hash for certificate
   */
  static calculateHash(data: any): string {
    const hashData = JSON.stringify({
      certificateNumber: data.certificateNumber,
      assetId: data.assetId,
      userId: data.userId,
      issuedAt: data.issuedAt
    });
    
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Generate QR code as data URL
   */
  static async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate PDF certificate
   */
  static async generatePDF(data: CertificateData): Promise<Readable> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = new Readable({
          read() {}
        });

        doc.on('data', (chunk) => stream.push(chunk));
        doc.on('end', () => {
          stream.push(null);
          resolve(stream);
        });
        doc.on('error', reject);

        // Header with gradient effect (simulated with rectangles)
        doc.rect(0, 0, doc.page.width, 120).fill('#3b82f6');
        doc.rect(0, 0, doc.page.width, 120).fillOpacity(0.3).fill('#8b5cf6');

        // Title
        doc.fillColor('#FFFFFF')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('ASSETBRIDGE PLATFORM', 50, 30, { align: 'center' });
        
        doc.fontSize(18)
           .font('Helvetica')
           .text('LIEN/CUSTODIAN CERTIFICATE', 50, 65, { align: 'center' });

        // Reset fill color and opacity
        doc.fillOpacity(1).fillColor('#1f2937');

        // Certificate Info Section
        let yPos = 150;
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('Certificate Number:', 50, yPos);
        
        doc.font('Helvetica-Bold')
           .fillColor('#1f2937')
           .text(data.certificateNumber, 200, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .fillColor('#6b7280')
           .text('Issue Date:', 50, yPos);
        
        doc.font('Helvetica-Bold')
           .fillColor('#1f2937')
           .text(data.issueDate.toLocaleDateString('en-US', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric' 
           }), 200, yPos);

        yPos += 20;
        doc.font('Helvetica')
           .fillColor('#6b7280')
           .text('Status:', 50, yPos);
        
        doc.font('Helvetica-Bold')
           .fillColor(data.status === 'ACTIVE' ? '#10b981' : '#ef4444')
           .text(data.status, 200, yPos);

        // Asset Details Section
        yPos += 40;
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#3b82f6')
           .text('ASSET DETAILS', 50, yPos);
        
        doc.moveTo(50, yPos + 18)
           .lineTo(250, yPos + 18)
           .stroke('#3b82f6');

        yPos += 30;
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280');

        const assetDetails = [
          ['Asset ID:', data.assetId.substring(0, 20) + '...'],
          ['Asset Type:', data.assetType],
          ['Asset Value:', `$${data.assetValue.toLocaleString()}`],
          ...(data.tokenId ? [['Token ID:', data.tokenId]] : [])
        ];

        assetDetails.forEach(([label, value]) => {
          doc.text(label, 50, yPos);
          doc.font('Helvetica-Bold')
             .fillColor('#1f2937')
             .text(value, 200, yPos);
          doc.font('Helvetica')
             .fillColor('#6b7280');
          yPos += 18;
        });

        // Custody Information Section
        yPos += 20;
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#3b82f6')
           .text('CUSTODY INFORMATION', 50, yPos);
        
        doc.moveTo(50, yPos + 18)
           .lineTo(300, yPos + 18)
           .stroke('#3b82f6');

        yPos += 30;
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280');

        const custodyDetails = [
          ['Owner:', data.ownerName],
          ['Email:', data.ownerEmail],
          ['Locked Date:', data.lockedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })]
        ];

        custodyDetails.forEach(([label, value]) => {
          doc.text(label, 50, yPos);
          doc.font('Helvetica-Bold')
             .fillColor('#1f2937')
             .text(value, 200, yPos);
          doc.font('Helvetica')
             .fillColor('#6b7280');
          yPos += 18;
        });

        // Lien Information Section
        yPos += 20;
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#3b82f6')
           .text('LIEN INFORMATION', 50, yPos);
        
        doc.moveTo(50, yPos + 18)
           .lineTo(250, yPos + 18)
           .stroke('#3b82f6');

        yPos += 30;
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280');

        const lienDetails = [
          ['Credit Limit:', `$${data.creditLimit.toLocaleString()}`],
          ['Used Credit:', `$${data.usedCredit.toLocaleString()}`],
          ['Available Credit:', `$${data.availableCredit.toLocaleString()}`]
        ];

        if (data.lienHolder) {
          lienDetails.push(
            ['Lien Holder:', data.lienHolder],
            ...(data.lienHolderEmail ? [['Holder Email:', data.lienHolderEmail]] : []),
            ...(data.loanId ? [['Loan ID:', data.loanId.substring(0, 20) + '...']] : [])
          );
        } else {
          lienDetails.push(['Lien Holder:', 'None (No active loan)']);
        }

        lienDetails.forEach(([label, value]) => {
          doc.text(label, 50, yPos);
          doc.font('Helvetica-Bold')
             .fillColor('#1f2937')
             .text(value, 200, yPos);
          doc.font('Helvetica')
             .fillColor('#6b7280');
          yPos += 18;
        });

        // Verification Section with QR Code
        yPos += 30;
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#3b82f6')
           .text('VERIFICATION', 50, yPos);
        
        doc.moveTo(50, yPos + 18)
           .lineTo(200, yPos + 18)
           .stroke('#3b82f6');

        yPos += 30;

        // Generate and embed QR code
        const qrData = JSON.stringify({
          certificateNumber: data.certificateNumber,
          hash: data.verificationHash,
          verifyUrl: data.verificationUrl
        });

        const qrCodeDataUrl = await this.generateQRCode(qrData);
        const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        
        doc.image(qrCodeBuffer, 50, yPos, { width: 100, height: 100 });

        // Verification details next to QR code
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('Hash:', 170, yPos);
        
        doc.font('Helvetica-Bold')
           .fillColor('#1f2937')
           .fontSize(8)
           .text(data.verificationHash.substring(0, 32) + '...', 170, yPos + 12, { width: 350 });

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('Verify at:', 170, yPos + 35);
        
        doc.font('Helvetica-Bold')
           .fillColor('#3b82f6')
           .text(data.verificationUrl, 170, yPos + 47);

        // Footer
        yPos += 130;
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(
             'This certificate is issued by AssetBridge Platform and serves as proof of asset custody and lien status. This is a legally binding document.',
             50,
             yPos,
             { width: 500, align: 'center' }
           );

        yPos += 40;
        doc.fontSize(8)
           .text(`Digital Signature: ${data.verificationHash.substring(0, 40)}...`, 50, yPos, { align: 'center' });

        yPos += 15;
        doc.text(
          `Generated: ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })}`,
          50,
          yPos,
          { align: 'center' }
        );

        // Finalize PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}
