const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const IPDFService = require('../../domain/interfaces/IPDFService');

class PDFService extends IPDFService {
    constructor() {
        super();
        this.reportsDir = path.join(__dirname, '../../../reports');
        this.ensureReportsDirExists();

        // Load a custom font that supports Unicode
        this.fontPath = path.join(__dirname, 'fonts', 'DejaVuSans.ttf'); // Or any Unicode font
        this.hasUnicodeFont = fs.existsSync(this.fontPath);

        // Color scheme for Hakika
        this.colors = {
            primary: '#4F46E5',
            secondary: '#0EA5E9',
            success: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444',
            light: '#F8FAFC',
            dark: '#1E293B',
            accent: '#8B5CF6'
        };
    }

    ensureReportsDirExists() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    async generateVerificationReport(verificationData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Hakika Verification Report - ${verificationData.referenceNumber}`,
                        Author: 'Hakika Verification System',
                        Subject: 'Academic Certificate Verification',
                        Keywords: 'verification, academic, certificate, hakika',
                        Creator: 'Hakika Platform v1.0',
                        CreationDate: new Date()
                    }
                });

                // Register custom font if available
                if (this.hasUnicodeFont) {
                    doc.registerFont('UnicodeFont', this.fontPath);
                }

                const filename = `hakika-verification-${verificationData.referenceNumber || Date.now()}.pdf`;
                const filePath = path.join(this.reportsDir, filename);
                const writeStream = fs.createWriteStream(filePath);

                doc.pipe(writeStream);

                // Use custom font for Unicode or fallback to Helvetica
                this.useFont(doc, 'header');

                // Track page numbers
                let pageNumber = 0;

                // Listen for page added events
                doc.on('pageAdded', () => {
                    pageNumber++;
                });

                // Add footer with page numbers to each page
                doc.on('pageAdded', () => {
                    const bottom = doc.page.margins.bottom;
                    const pageCount = doc.bufferedPageRange().count;

                    // Save current position
                    const oldX = doc.x;
                    const oldY = doc.y;

                    // Go to bottom of page
                    doc.page.margins.bottom = 0;
                    doc.text('', 50, doc.page.height - 50);

                    // Add page number
                    doc.fontSize(10)
                        .fillColor('#666666')
                        .text(
                            `Page ${pageNumber} of ${pageCount}`,
                            doc.page.width - 100,
                            doc.page.height - 40,
                            { align: 'right' }
                        );

                    // Restore position
                    doc.x = oldX;
                    doc.y = oldY;
                    doc.page.margins.bottom = bottom;
                });

                // Track current Y position
                this.currentY = 50;

                // Add sections
                this.addHakikaHeader(doc);

                this.addReportTitle(doc, 'VERIFICATION REPORT');


                this.addVerificationOverview(doc, verificationData);
                this.addComparisonTable(doc, verificationData);

                // Check space before adding institution details
                if (this.currentY > 400) {
                    doc.addPage();
                    this.currentY = 50;
                    this.addHakikaHeader(doc, true);
                }

                this.addInstitutionDetails(doc, verificationData.Institution);

                // Check space before adding timeline
                if (this.currentY > 350) {
                    doc.addPage();
                    this.currentY = 50;
                    this.addHakikaHeader(doc, true);
                }
                this.addVerificationTimeline(doc, verificationData);

                // Add AI analysis if available
                if (verificationData.aiAgentResponse) {
                    if (this.currentY > 300) {
                        doc.addPage();
                        this.currentY = 50;
                        this.addHakikaHeader(doc, true);
                    }
                    this.addAIAnalysis(doc, verificationData.aiAgentResponse);
                }

                // FIXED: Always check space before conclusion section
                if (this.currentY > 200) {
                    doc.addPage();
                    this.currentY = 50;
                    this.addHakikaHeader(doc, true);
                }

                this.addConclusionWithStatus(doc, verificationData);

                this.addHakikaFooter(doc);

                // Manually trigger page count
                doc.flushPages();

                doc.end();


                writeStream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({
                        filePath,
                        filename,
                        fileSize: stats.size,
                        mimeType: 'application/pdf'
                    });
                });

                writeStream.on('error', reject);

            } catch (error) {
                reject(new Error(`PDF generation error: ${error.message}`));
            }
        });
    }

    // Add this method to your PDFService class
    async generateTransactionReport(transactionData, filters = {}) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Hakika Transaction Report`,
                        Author: 'Hakika Verification System',
                        Subject: 'Financial Transactions Report',
                        Keywords: 'transactions, financial, report, hakika',
                        Creator: 'Hakika Platform v1.0',
                        CreationDate: new Date()
                    }
                });

                const filename = `hakika-transactions-${new Date().toISOString().split('T')[0]}.pdf`;
                const filePath = path.join(this.reportsDir, filename);
                const writeStream = fs.createWriteStream(filePath);

                doc.pipe(writeStream);

                // ========== PAGE 1: COVER ==========
                this.addCoverPage(doc, 'TRANSACTION REPORT', 'Financial Transactions Summary', filters);

                // ========== PAGE 2: DETAILS ==========
                doc.addPage();
                this.currentY = 50;

                // Add page header
                // this.addPageHeader(doc, 'Transaction Details');

                // Add content
                this.addTransactionSummary(doc, transactionData);

                // Check if we need to add a page break
                if (this.checkPageBreak(doc, 200)) {
                    //this.addPageHeader(doc, 'Transaction Details (Continued)', true);
                }

                this.addTransactionDetails(doc, transactionData);

                // Check if we need to add a page break before analysis
                if (this.checkPageBreak(doc, 100)) {
                    this.addPageHeader(doc, 'Monthly Analysis', true);
                }

                this.addTransactionAnalysis(doc, transactionData);

                // Add footer WITHOUT creating blank pages
                this.addSmartFooter(doc, transactionData);

                doc.end();

                writeStream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({
                        filePath,
                        filename,
                        fileSize: stats.size,
                        mimeType: 'application/pdf'
                    });
                });

                writeStream.on('error', reject);

            } catch (error) {
                reject(new Error(`Transaction report generation error: ${error.message}`));
            }
        });
    }

    // Generic cover page method
    addCoverPage(doc, title, subtitle, filters) {
        const pageWidth = doc.page.width;
        const centerX = pageWidth / 2;

        // Background
        doc.rect(0, 0, pageWidth, doc.page.height)
            .fill(this.colors.primary);

        // Title
        doc.fillColor('white')
            .fontSize(34)
            .font('Helvetica-Bold')
            .text(title, centerX, 150, { align: 'center' });

        // Subtitle
        doc.fillColor('rgba(255, 255, 255, 0.9)')
            .fontSize(18)
            .font('Helvetica')
            .text(subtitle, centerX, 220, { align: 'center' });

        // Report details
        doc.fillColor('rgba(255, 255, 255, 0.8)')
            .fontSize(14)
            .text(`Generated: ${new Date().toLocaleDateString()}`, centerX, 300, { align: 'center' });

        // Hakika branding
        doc.fillColor('rgba(255, 255, 255, 0.6)')
            .fontSize(12)
            .text('Hakika Financial Systems', centerX, 400, { align: 'center' });

        // Page indicator
        doc.fillColor('rgba(255, 255, 255, 0.4)')
            .fontSize(10)
            .text('Page 1', centerX, doc.page.height - 100, { align: 'center' });
    }

    // Page header method
    addPageHeader(doc, title, isContinuation = false) {
        const pageWidth = doc.page.width;

        if (isContinuation) {
            doc.fillColor(this.colors.primary)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text(title, 50, this.currentY);
            this.currentY += 30;
        } else {
            doc.fillColor(this.colors.primary)
                .fontSize(20)
                .font('Helvetica-Bold')
                .text(title, { align: 'center', y: this.currentY });
            this.currentY += 40;

            // Add decorative line
            doc.moveTo(50, this.currentY)
                .lineTo(pageWidth - 50, this.currentY)
                .strokeColor(this.colors.secondary)
                .lineWidth(2)
                .stroke();
            this.currentY += 30;
        }
    }

    // Check for page break
    checkPageBreak(doc, requiredHeight = 100) {
        if (this.currentY + requiredHeight > doc.page.height - 100) {
            doc.addPage();
            this.currentY = 50;
            return true;
        }
        return false;
    }

    addSmartFooter(doc, transactionData) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        const currentPage = doc.bufferedPageRange().count;

        // Leave at least 60px at bottom for footer
        const minFooterSpace = 60;

        // If we're too close to bottom, just add minimal footer
        if (this.currentY > pageHeight - minFooterSpace) {
            // We're at the bottom, add simple footer
            this.currentY = pageHeight - 30;

            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica')
                .text('─', 50, this.currentY - 5, { width: pageWidth - 100, align: 'center' });

            doc.fillColor('#999999')
                .fontSize(8)
                .text(`Hakika Transaction Report • Page ${currentPage} • ${new Date().toLocaleDateString()}`,
                    pageWidth / 2, this.currentY + 5, { align: 'center' });

            return;
        }

        // We have space, add footer with some spacing
        this.currentY += 20;

        // Add separator line
        doc.moveTo(50, this.currentY)
            .lineTo(pageWidth - 50, this.currentY)
            .strokeColor('#E2E8F0')
            .lineWidth(1)
            .stroke();

        this.currentY += 10;

        // Footer text
        const totalTransactions = transactionData.transactions ? transactionData.transactions.length : 0;

        doc.fillColor('#666666')
            .fontSize(9)
            .font('Helvetica')
            .text(`Hakika Financial Systems • Transaction Report • ${totalTransactions} transactions`,
                50, this.currentY, { width: pageWidth - 100 });

        doc.fillColor('#999999')
            .fontSize(8)
            .text(`Page ${currentPage} • Generated: ${new Date().toLocaleDateString()}`,
                pageWidth - 50, this.currentY, { align: 'right' });

        this.currentY += 15;
    }


    // Report footer
    addReportFooter(doc, transactionData) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;

        // Position footer near bottom
        const footerY = pageHeight - 60;
        this.currentY = footerY;

        // Footer content
        doc.fillColor('#666666')
            .fontSize(9)
            .font('Helvetica')
            .text('Hakika Financial Transaction Report • Official Document',
                pageWidth / 2, this.currentY, { align: 'center' });

        doc.fillColor('#999999')
            .fontSize(8)
            .text(`Total Transactions: ${transactionData.transactions ? transactionData.transactions.length : 0} • Generated: ${new Date().toLocaleString()}`,
                pageWidth / 2, this.currentY + 15, { align: 'center' });

        // Page number
        const pageCount = doc.bufferedPageRange().count;
        doc.fillColor('#666666')
            .fontSize(9)
            .text(`Page ${pageCount}`, pageWidth - 100, this.currentY, { align: 'right' });
    }

    // Add these helper methods to the PDFService class
    addTransactionReportHeader(doc, filters) {
        const pageWidth = doc.page.width;
        const margin = 50;

        // Colored header background
        doc.rect(margin, this.currentY, pageWidth - 2 * margin, 120)
            .fill(this.colors.primary);

        // Hakika logo and title
        doc.fillColor('white')
            .fontSize(32)
            .font('Helvetica-Bold')
            .text('Hakika', margin + 20, this.currentY + 30);

        doc.fillColor('rgba(255, 255, 255, 0.8)')
            .fontSize(14)
            .font('Helvetica')
            .text('Financial Transactions Report', margin + 20, this.currentY + 70);

        // Report details
        doc.fillColor('rgba(255, 255, 255, 0.9)')
            .fontSize(10)
            .text(`Generated: ${new Date().toLocaleString()}`, margin + 20, this.currentY + 95)
            .text(`Report ID: TXN-${Date.now().toString().slice(-8)}`, margin + 250, this.currentY + 95);

        // Decorative line
        doc.moveTo(margin, this.currentY + 120)
            .lineTo(pageWidth - margin, this.currentY + 120)
            .strokeColor(this.colors.secondary)
            .lineWidth(3)
            .stroke();

        this.currentY += 140;

        // Filters applied section
        if (Object.keys(filters).length > 0) {
            doc.fillColor(this.colors.dark)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('Filters Applied:', 50, this.currentY);

            let filterY = this.currentY + 20;
            let filterX = 50;

            const filterEntries = [
                { label: 'Date Range:', value: filters.dateRange || 'All Time' },
                { label: 'Status:', value: filters.status || 'All Statuses' },
                { label: 'Payment Method:', value: filters.paymentMethod || 'All Methods' },
                { label: 'Institution:', value: filters.institution || 'All Institutions' }
            ].filter(entry => entry.value !== 'Not Set');

            filterEntries.forEach((filter, index) => {
                doc.fillColor('#475569')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(filter.label, filterX, filterY);

                doc.fillColor(this.colors.primary)
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .text(filter.value, filterX + 80, filterY);

                if (index % 2 === 1) {
                    filterX = 50;
                    filterY += 20;
                } else {
                    filterX = 300;
                }
            });

            if (filterX === 300) {
                filterY += 20;
            }

            this.currentY = filterY + 30;
        } else {
            this.currentY += 20;
        }
    }

    addTransactionSummary(doc, transactionData) {
        const startY = this.currentY;
        const pageWidth = doc.page.width;
        const margin = 50;

        // Summary title
        doc.fillColor(this.colors.primary)
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('FINANCIAL SUMMARY', margin, startY);

        this.currentY = startY + 30;

        // Calculate summary statistics
        const stats = this.calculateTransactionStats(transactionData);

        // Summary cards in a 2x2 grid
        const cardWidth = (pageWidth - 3 * margin) / 2;
        const cardHeight = 90;

        const summaryCards = [
            {
                title: 'Total Revenue',
                value: `$${stats.totalRevenue.toFixed(2)}`,
                icon: '[R]',
                color: this.colors.success,
                description: 'Completed transactions'
            },
            {
                title: 'Pending Amount',
                value: `$${stats.pendingAmount.toFixed(2)}`,
                icon: '[P]',
                color: this.colors.warning,
                description: 'Awaiting payment'
            },
            {
                title: 'Average Fee',
                value: `$${stats.averageFee.toFixed(2)}`,
                icon: '[A]',
                color: this.colors.info || this.colors.secondary,
                description: 'Per verification'
            },
            {
                title: 'Total Transactions',
                value: stats.totalTransactions.toString(),
                icon: '[T]',
                color: this.colors.primary,
                description: 'All transactions'
            }
        ];

        let cardY = this.currentY;
        let cardX = margin;

        summaryCards.forEach((card, index) => {
            this.drawSummaryCard(doc, cardX, cardY, cardWidth, cardHeight, card);

            if (index % 2 === 1) {
                cardX = margin;
                cardY += cardHeight + 20;
            } else {
                cardX += cardWidth + margin;
            }
        });

        this.currentY = cardY + 20;

        // Status distribution
        doc.fillColor(this.colors.primary)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Status Distribution:', margin, this.currentY);

        this.currentY += 25;

        const statusData = [
            { status: 'completed', count: stats.completed, color: this.colors.success },
            { status: 'pending', count: stats.pending, color: this.colors.warning },
            { status: 'failed', count: stats.failed, color: this.colors.danger },
            { status: 'refunded', count: stats.refunded, color: this.colors.secondary },
            { status: 'disputed', count: stats.disputed, color: this.colors.accent || '#8B5CF6' }
        ];

        const totalTransactions = stats.totalTransactions;

        statusData.forEach((item, index) => {
            const percentage = totalTransactions > 0 ?
                ((item.count / totalTransactions) * 100).toFixed(1) : 0;

            const barWidth = 200;
            const filledWidth = totalTransactions > 0 ? (item.count / totalTransactions) * barWidth : 0;

            // Status label
            doc.fillColor(this.colors.dark)
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(item.status.toUpperCase(), margin, this.currentY);

            // Status indicator
            doc.circle(margin - 15, this.currentY + 4, 4)
                .fill(item.color)
                .strokeColor('white')
                .lineWidth(1)
                .stroke();

            // Bar background
            doc.rect(margin + 100, this.currentY, barWidth, 10)
                .fill('#E2E8F0');

            // Filled portion
            doc.rect(margin + 100, this.currentY, filledWidth, 10)
                .fill(item.color);

            // Count and percentage
            doc.fillColor('#475569')
                .fontSize(10)
                .font('Helvetica')
                .text(`${item.count} (${percentage}%)`, margin + 310, this.currentY);

            this.currentY += 20;
        });

        this.currentY += 30;
    }

    addTransactionDetails(doc, transactionData) {
        const startY = this.currentY;
        const tableWidth = doc.page.width - 100;

        // Check if we need a new page
        if (this.currentY > 600) {
            doc.addPage();
            this.currentY = 50;
            this.addTransactionReportHeader(doc, {}, true);
        }

        // Section title
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('TRANSACTION DETAILS', 50, startY);

        doc.moveTo(50, startY + 20)
            .lineTo(250, startY + 20)
            .strokeColor(this.colors.secondary)
            .lineWidth(2)
            .stroke();

        this.currentY = startY + 40;

        if (!transactionData.transactions || transactionData.transactions.length === 0) {
            doc.fillColor(this.colors.warning)
                .fontSize(12)
                .font('Helvetica')
                .text('No transactions found for the selected criteria.', 50, this.currentY);
            this.currentY += 40;
            return;
        }

        // Table header
        const headerY = this.currentY;
        doc.rect(50, headerY, tableWidth, 30)
            .fill(this.colors.primary);

        doc.fillColor('white')
            .fontSize(10)
            .font('Helvetica-Bold');

        const headers = ['Transaction ID', 'Date', 'Description', 'Amount', 'Status', 'Method'];
        const colWidths = [100, 70, 120, 70, 80, 80];

        let xPos = 55;
        headers.forEach((header, index) => {
            doc.text(header, xPos, headerY + 12);
            xPos += colWidths[index];
        });

        // Transaction rows
        let rowY = headerY + 30;
        const transactionsToShow = transactionData.transactions.slice(0, 20); // Limit rows for readability

        transactionsToShow.forEach((transaction, index) => {
            // Check for page break
            if (rowY > doc.page.height - 100) {
                doc.addPage();
                this.currentY = 50;
                rowY = 50;
                this.addTransactionReportHeader(doc, {}, true);
            }

            const bgColor = index % 2 === 0 ? '#FFFFFF' : this.colors.light;

            // Row background
            doc.rect(50, rowY, tableWidth, 25)
                .fill(bgColor)
                .strokeColor('#E2E8F0')
                .lineWidth(0.5)
                .stroke();

            // Transaction ID
            doc.fillColor(this.colors.dark)
                .fontSize(9)
                .font('Helvetica')
                .text(transaction.transactionId || `TXN-${transaction.id}`, 55, rowY + 8, {
                    width: 90,
                    ellipsis: true
                });

            // Date
            const date = new Date(transaction.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            doc.fillColor('#475569')
                .fontSize(9)
                .text(formattedDate, 155, rowY + 8);

            // Description
            const description = transaction.description || 'Payment for verification';
            doc.fillColor('#475569')
                .fontSize(9)
                .text(description.substring(0, 25), 225, rowY + 8, {
                    ellipsis: true
                });

            // Amount
            const amount = parseFloat(transaction.amount) || 0;
            const isRefund = transaction.type === 'refund' || amount < 0;
            const amountColor = isRefund ? this.colors.danger : this.colors.success;
            const amountText = `${isRefund ? '-' : ''}$${Math.abs(amount).toFixed(2)}`;

            doc.fillColor(amountColor)
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(amountText, 345, rowY + 8);

            // Status
            const statusColor = this.getTransactionStatusColor(transaction.status);
            doc.fillColor(statusColor)
                .font('Helvetica-Bold')
                .fontSize(9)
                .text(transaction.status.toUpperCase(), 415, rowY + 8);

            // Payment Method
            doc.fillColor('#475569')
                .font('Helvetica')
                .fontSize(9)
                .text(this.formatPaymentMethod(transaction.paymentMethod), 495, rowY + 8);

            rowY += 25;
        });

        // Show more indicator if there are more transactions
        if (transactionData.transactions.length > 20) {
            rowY += 10;
            doc.fillColor('#64748B')
                .fontSize(9)
                .font('Helvetica-Italic')
                .text(`... and ${transactionData.transactions.length - 20} more transactions`,
                    50, rowY);
            rowY += 20;
        }

        this.currentY = rowY + 20;

        // Summary note
        doc.fillColor(this.colors.dark)
            .fontSize(10)
            .font('Helvetica')
            .text(`Showing ${Math.min(20, transactionData.transactions.length)} of ${transactionData.transactions.length} transactions • Generated on ${new Date().toLocaleDateString()}`,
                50, this.currentY);

        this.currentY += 30;
    }

    addTransactionAnalysis(doc, transactionData) {
        const startY = this.currentY;

        // Check if we need a new page
        if (this.currentY > 650) {
            doc.addPage();
            this.currentY = 50;
            this.addTransactionReportHeader(doc, {}, true);
        }

        // Section title
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('MONTHLY ANALYSIS', 50, startY);

        this.currentY = startY + 30;

        // Calculate monthly breakdown
        const monthlyData = this.calculateMonthlyBreakdown(transactionData);

        if (monthlyData.length === 0) {
            doc.fillColor('#64748B')
                .fontSize(11)
                .font('Helvetica')
                .text('Insufficient data for monthly analysis.', 50, this.currentY);
            this.currentY += 30;
            return;
        }

        // Draw monthly bars
        const maxAmount = Math.max(...monthlyData.map(m => m.amount));
        const barWidth = 30;
        const barSpacing = 40;
        let barX = 50;

        monthlyData.forEach((month, index) => {
            const barHeight = (month.amount / maxAmount) * 100;
            const barY = this.currentY + 100 - barHeight;

            // Bar
            doc.rect(barX, barY, barWidth, barHeight)
                .fill(this.colors.primary);

            // Month label
            doc.fillColor('#475569')
                .fontSize(9)
                .font('Helvetica')
                .text(month.month.substring(0, 3), barX, this.currentY + 110);

            // Amount label
            doc.fillColor(this.colors.dark)
                .fontSize(8)
                .font('Helvetica-Bold')
                .text(`$${month.amount.toFixed(0)}`, barX, barY - 15);

            barX += barWidth + barSpacing;
        });

        this.currentY += 140;

        // Monthly statistics
        doc.fillColor(this.colors.primary)
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Key Statistics:', 50, this.currentY);

        this.currentY += 20;

        const stats = this.calculateTransactionStats(transactionData);
        const statistics = [
            `Highest Month: $${stats.highestMonth?.amount?.toFixed(2) || '0.00'} (${stats.highestMonth?.month || 'N/A'})`,
            `Lowest Month: $${stats.lowestMonth?.amount?.toFixed(2) || '0.00'} (${stats.lowestMonth?.month || 'N/A'})`,
            `Monthly Average: $${stats.monthlyAverage?.toFixed(2) || '0.00'}`,
            `Growth Rate: ${stats.growthRate ? stats.growthRate.toFixed(1) + '%' : 'N/A'}`
        ];

        statistics.forEach((stat, index) => {
            doc.fillColor('#475569')
                .fontSize(10)
                .font('Helvetica')
                .text(stat, 70, this.currentY + (index * 15));
        });

        this.currentY += (statistics.length * 15) + 30;
    }

    // Helper methods
    calculateTransactionStats(transactionData) {
        const stats = {
            totalRevenue: 0,
            pendingAmount: 0,
            averageFee: 0,
            totalTransactions: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            refunded: 0,
            disputed: 0,
            highestMonth: null,
            lowestMonth: null,
            monthlyAverage: 0,
            growthRate: 0
        };

        if (!transactionData.transactions || transactionData.transactions.length === 0) {
            return stats;
        }

        let feeTotal = 0;
        let feeCount = 0;
        const monthlyTotals = {};
        const months = [];

        transactionData.transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount) || 0;
            const absAmount = Math.abs(amount);

            // Count total transactions
            stats.totalTransactions++;

            // Sum amounts for completed transactions (positive amounts only for revenue)
            if (transaction.status === 'completed' && transaction.type !== 'refund') {
                stats.totalRevenue += absAmount;
            }

            // Sum pending amounts
            if (transaction.status === 'pending') {
                stats.pendingAmount += absAmount;
            }

            // Count statuses
            if (stats[transaction.status] !== undefined) {
                stats[transaction.status]++;
            }

            // Calculate average fee (assuming verification fees)
            if (transaction.type === 'verification_fee') {
                feeTotal -= absAmount;
                feeCount++;
            }

            // Calculate monthly totals
            const date = new Date(transaction.createdAt);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            if (!monthlyTotals[monthKey]) {
                monthlyTotals[monthKey] = {
                    month: monthName,
                    amount: 0,
                    count: 0
                };
                months.push(monthKey);
            }

            if (transaction.status === 'completed' && transaction.type !== 'refund') {
                monthlyTotals[monthKey].amount += absAmount;
            }
            monthlyTotals[monthKey].count++;
        });

        // Calculate average fee
        stats.averageFee = feeCount > 0 ? feeTotal / feeCount : 0;

        // Calculate monthly statistics
        const monthlyAmounts = Object.values(monthlyTotals).map(m => m.amount);
        if (monthlyAmounts.length > 0) {
            stats.highestMonth = Object.values(monthlyTotals).reduce((max, month) =>
                month.amount > max.amount ? month : max, { amount: 0 });

            stats.lowestMonth = Object.values(monthlyTotals).reduce((min, month) =>
                month.amount < min.amount ? month : min, { amount: Infinity });

            stats.monthlyAverage = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;

            // Calculate growth rate if we have at least 2 months
            if (months.length >= 2) {
                const sortedMonths = months.sort();
                const firstMonth = monthlyTotals[sortedMonths[0]].amount;
                const lastMonth = monthlyTotals[sortedMonths[sortedMonths.length - 1]].amount;

                if (firstMonth > 0) {
                    stats.growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
                }
            }
        }

        return stats;
    }

    calculateMonthlyBreakdown(transactionData) {
        if (!transactionData.transactions || transactionData.transactions.length === 0) {
            return [];
        }

        const monthlyTotals = {};

        transactionData.transactions.forEach(transaction => {
            if (transaction.status === 'completed' && transaction.type !== 'refund') {
                const date = new Date(transaction.createdAt);
                const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                if (!monthlyTotals[monthKey]) {
                    monthlyTotals[monthKey] = {
                        month: monthName,
                        amount: 0
                    };
                }

                monthlyTotals[monthKey].amount += Math.abs(parseFloat(transaction.amount) || 0);
            }
        });

        // Sort by month (most recent first)
        return Object.values(monthlyTotals)
            .sort((a, b) => new Date(b.month) - new Date(a.month))
            .slice(0, 6); // Last 6 months
    }

    drawSummaryCard(doc, x, y, width, height, cardData) {
        // Card background
        doc.roundedRect(x, y, width, height, 8)
            .fill('#FFFFFF')
            .strokeColor(cardData.color)
            .lineWidth(2)
            .stroke();

        // Icon
        doc.fillColor(cardData.color)
            .fontSize(24)
            .text(cardData.icon, x + 15, y + 20);

        // Title
        doc.fillColor(this.colors.dark)
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(cardData.title, x + 60, y + 15);

        // Value
        doc.fillColor(cardData.color)
            .fontSize(22)
            .font('Helvetica-Bold')
            .text(cardData.value, x + 60, y + 40);

        // Description
        doc.fillColor('#64748B')
            .fontSize(9)
            .font('Helvetica')
            .text(cardData.description, x + 60, y + 70, {
                width: width - 70
            });
    }

    getTransactionStatusColor(status) {
        const statusLower = status?.toLowerCase();
        const colors = {
            'completed': this.colors.success,
            'pending': this.colors.warning,
            'failed': this.colors.danger,
            'refunded': this.colors.secondary,
            'disputed': this.colors.accent || '#8B5CF6',
            'cancelled': '#94A3B8',
            'processing': this.colors.info || '#0EA5E9'
        };
        return colors[statusLower] || this.colors.primary;
    }

    formatPaymentMethod(method) {
        const methodMap = {
            'card': 'Credit Card',
            'credit_card': 'Credit Card',
            'debit_card': 'Debit Card',
            'bank': 'Bank Transfer',
            'bank_transfer': 'Bank Transfer',
            'mobile': 'Mobile Money',
            'mobile_money': 'Mobile Money',
            'paypal': 'PayPal',
            'mpesa': 'M-Pesa',
            'airtel_money': 'Airtel Money',
            'cash': 'Cash',
            'wallet': 'Digital Wallet',
            'online': 'Online Payment'
        };
        return methodMap[method?.toLowerCase()] || method || 'Unknown';
    }

    addHakikaHeader(doc, isSecondary = false) {
        const pageWidth = doc.page.width;
        const margin = 50;

        // Colored header background
        doc.rect(margin, this.currentY, pageWidth - 2 * margin, isSecondary ? 60 : 100)
            .fill(this.colors.primary);

        // Hakika logo and title
        doc.fillColor('white')
            .fontSize(isSecondary ? 24 : 32)
            .font('Helvetica-Bold')
            .text('Hakika', margin + 20, this.currentY + (isSecondary ? 15 : 30));

        if (!isSecondary) {
            doc.fillColor('rgba(255, 255, 255, 0.8)')
                .fontSize(14)
                .font('Helvetica')
                .text('Academic Verification Platform', margin + 20, this.currentY + 70);
        }

        // Decorative element
        doc.moveTo(margin, this.currentY + (isSecondary ? 60 : 100))
            .lineTo(pageWidth - margin, this.currentY + (isSecondary ? 60 : 100))
            .strokeColor(this.colors.secondary)
            .lineWidth(3)
            .stroke();

        this.currentY += (isSecondary ? 80 : 120);
    }

    addReportTitle(doc, title) {
        doc.fillColor(this.colors.dark)
            .fontSize(24)
            .font('Helvetica-Bold')
            .text(title, { align: 'center', y: this.currentY });

        this.currentY += 10;
    }

    addVerificationOverview(doc, verification) {
        const boxY = this.currentY;
        const boxWidth = doc.page.width - 100;

        // Colored background box
        doc.rect(50, boxY, boxWidth, 150)
            .fill(this.colors.light)
            .strokeColor(this.colors.primary)
            .lineWidth(2)
            .stroke();

        // Title inside box
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('VERIFICATION OVERVIEW', 70, boxY + 20);

        // Two-column layout for details
        const detailsLeft = [
            ['Reference Number:', verification.referenceNumber || 'N/A'],
            ['Verification Date:', new Date(verification.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })],
            ['Status:', this.getStatusWithBadge(verification.status)],
            ['Student ID:', verification.studentId || 'N/A']
        ];

        const detailsRight = [
            ['Verification Fee:', `$${parseFloat(verification.fee || 0).toFixed(2)}`],
            ['Processing Time:', this.getProcessingTime(verification)],
            ['Confidence Score:', `${verification.verificationScore || 0}%`],
            ['Report ID:', `HAK-${Date.now().toString().slice(-8)}`]
        ];

        let yPos = boxY + 50;
        detailsLeft.forEach(([label, value], index) => {
            this.drawDetailRow(doc, label, value, 70, yPos + (index * 25));
        });

        detailsRight.forEach(([label, value], index) => {
            this.drawDetailRow(doc, label, value, 350, yPos + (index * 25));
        });

        this.currentY = boxY + 170;
    }

    addComparisonTable(doc, verification) {
        const startY = this.currentY + 20;
        const tableWidth = doc.page.width - 100;

        // Table header
        doc.rect(50, startY, tableWidth, 30)
            .fill(this.colors.primary);

        doc.fillColor('white')
            .fontSize(12)
            .font('Helvetica-Bold');

        const headers = ['Field', 'Submitted Data', 'Institution Data', 'Match'];
        const colWidths = [120, 150, 150, 150];

        let xPos = 55;
        headers.forEach((header, index) => {
            doc.text(header, xPos, startY + 10);
            xPos += colWidths[index];
        });

        // Comparison data
        const comparisonData = this.prepareComparisonData(verification);

        // Draw rows
        let rowY = startY + 30;
        comparisonData.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? '#FFFFFF' : this.colors.light;

            doc.rect(50, rowY, tableWidth, 25)
                .fill(bgColor)
                .strokeColor('#E2E8F0')
                .lineWidth(0.5)
                .stroke();

            // Field
            doc.fillColor(this.colors.dark)
                .fontSize(10)
                .font('Helvetica')
                .text(row.field, 55, rowY + 8);

            // Submitted data
            doc.text(row.submitted, 175, rowY + 8);

            // Institution data
            doc.text(row.institution, 325, rowY + 8);

            // Match status
            const matchColor = row.match ? this.colors.success : this.colors.danger;
            const matchText = row.match ? '√ MATCH' : 'x NO MATCH';

            doc.fillColor(matchColor)
                .font('Helvetica-Bold')
                .text(matchText, 475, rowY + 8);

            rowY += 25;
        });

        // Confidence scores
        if (comparisonData.some(row => row.confidence > 0)) {
            rowY += 20;
            doc.fillColor(this.colors.dark)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Confidence Scores:', 50, rowY);

            rowY += 20;
            comparisonData.forEach(row => {
                if (row.confidence) {
                    const confidence = row.confidence;
                    const confidenceColor = confidence >= 90 ? this.colors.success :
                        confidence >= 80 ? this.colors.warning : this.colors.danger;

                    doc.fillColor(this.colors.dark)
                        .fontSize(9)
                        .font('Helvetica')
                        .text(row.field, 70, rowY);

                    // Confidence bar
                    const barWidth = 100;
                    const filledWidth = (confidence / 100) * barWidth;

                    // Background
                    doc.rect(200, rowY - 5, barWidth, 8)
                        .fill('#E2E8F0');

                    // Filled portion
                    doc.rect(200, rowY - 5, filledWidth, 8)
                        .fill(confidenceColor);

                    // Percentage
                    doc.text(`${confidence}%`, 310, rowY);

                    rowY += 20;
                }
            });
        }

        this.currentY = rowY + 20;
    }

    addInstitutionDetails(doc, institution) {
        const startY = this.currentY + 20;

        // Section header
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('INSTITUTION INFORMATION', 50, startY);

        // Decorative line
        doc.moveTo(50, startY + 25)
            .lineTo(200, startY + 25)
            .strokeColor(this.colors.secondary)
            .lineWidth(2)
            .stroke();

        if (!institution) {
            doc.fillColor(this.colors.warning)
                .fontSize(12)
                .font('Helvetica')
                .text('Institution information not available or incomplete.', 70, startY + 50);

            this.currentY = startY + 80;
            return;
        }

        // Institution details with emoji icons
        const details = [
            { icon: '[L]', label: 'Institution Name', value: institution.name || 'Not Specified' },
            { icon: '[C]', label: 'Country', value: institution.country || 'Not Specified' },
            { icon: '$', label: 'Verification Fee', value: `$${parseFloat(institution.vFee || institution.fee || 0).toFixed(2)}` },
            { icon: '∞', label: 'Processing Time', value: `${institution.processingTime || 'Not Specified'}` },
            { icon: '@', label: 'Contact Email', value: institution.email || 'Not Available' },
            { icon: '[W]', label: 'Website', value: institution.website || institution.url || 'Not Available' }
        ];

        let yPos = startY + 60;
        let xPos = 50;
        const cardWidth = 250;
        const cardHeight = 70;
        const cardSpacing = 10;

        details.forEach((detail, index) => {
            // Check if we need to move to next row
            if (index % 2 === 0 && index !== 0) {
                yPos += cardHeight + cardSpacing;
                xPos = 50;
            }

            // Draw card
            this.drawInstitutionCard(doc, xPos, yPos, cardWidth, cardHeight, detail, index);

            // Move to next column
            xPos += cardWidth + cardSpacing;
        });

        // Calculate final Y position
        const rows = Math.ceil(details.length / 2);
        const totalCardsHeight = rows * cardHeight + (rows - 1) * cardSpacing;
        this.currentY = startY + 60 + totalCardsHeight + 20;
    }

    addVerificationTimeline(doc, verification) {
        const startY = this.currentY + 20;

        // Section header
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('VERIFICATION TIMELINE', 50, startY);

        const timelineSteps = [
            {
                status: 'Submitted',
                date: new Date(verification.createdAt),
                completed: true,
                description: 'Verification request submitted'
            },
            {
                status: 'Processing',
                date: verification.processingStartedAt ? new Date(verification.processingStartedAt) : null,
                completed: verification.status !== 'pending',
                description: 'Data processing initiated'
            },
            {
                status: 'Institution Review',
                date: verification.sentToInstitutionAt ? new Date(verification.sentToInstitutionAt) : null,
                completed: verification.status === 'completed' || verification.status === 'processing',
                description: 'Sent to institution for verification'
            },
            {
                status: 'Completed',
                date: verification.updatedAt ? new Date(verification.updatedAt) : null,
                completed: verification.status === 'completed',
                description: 'Verification process completed'
            }
        ];

        let yPos = startY + 40;
        const timelineX = 85;

        timelineSteps.forEach((step, index) => {
            // Timeline connector
            if (index > 0) {
                doc.moveTo(timelineX, yPos - 20)
                    .lineTo(timelineX, yPos + 20)
                    .strokeColor('#CBD5E1')
                    .lineWidth(2)
                    .stroke();
            }

            // Status indicator
            const indicatorColor = step.completed ? this.colors.success : '#CBD5E1';

            doc.circle(timelineX, yPos, 8)
                .fill(indicatorColor)
                .strokeColor('white')
                .lineWidth(2)
                .stroke();

            // Status text
            doc.fillColor(step.completed ? this.colors.success : '#64748B')
                .fontSize(12)
                .font(step.completed ? 'Helvetica-Bold' : 'Helvetica')
                .text(step.status, 110, yPos - 8);

            // Date
            if (step.date) {
                doc.fillColor('#94A3B8')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(step.date.toLocaleDateString(), 200, yPos - 8);
            }

            // Description
            doc.fillColor('#475569')
                .fontSize(9)
                .font('Helvetica')
                .text(step.description, 110, yPos + 10);

            yPos += 60;
        });

        this.currentY = yPos + 20;
    }

    addAIAnalysis(doc, aiResponse) {
        const analysis = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
        const startY = this.currentY + 20;

        // Section header
        doc.fillColor(this.colors.primary)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('AI ANALYSIS', 50, startY);

        if (analysis.confidenceScore) {
            const confidence = analysis.confidenceScore * 100;
            const confidenceColor = confidence >= 90 ? this.colors.success :
                confidence >= 80 ? this.colors.warning : this.colors.danger;

            doc.fillColor(this.colors.dark)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text(`Confidence Score: ${confidence.toFixed(1)}%`, 70, startY + 30);

            // Confidence meter
            const meterWidth = 300;
            const filledWidth = (confidence / 100) * meterWidth;

            // Background bar
            doc.rect(70, startY + 55, meterWidth, 15)
                .fill('#E2E8F0')
                .strokeColor('#CBD5E1')
                .lineWidth(1)
                .stroke();

            // Filled portion
            doc.rect(70, startY + 55, filledWidth, 15)
                .fill(confidenceColor);

            // Meter labels
            doc.fillColor('#64748B')
                .fontSize(8)
                .font('Helvetica')
                .text('Low', 70, startY + 75)
                .text('Medium', 70 + meterWidth / 2 - 15, startY + 75)
                .text('High', 70 + meterWidth - 20, startY + 75);

            let detailY = startY + 100;

            // Features analyzed
            if (analysis.featuresAnalyzed && analysis.featuresAnalyzed.length > 0) {
                doc.fillColor(this.colors.dark)
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Features Analyzed:', 70, detailY);

                detailY += 20;
                analysis.featuresAnalyzed.forEach(feature => {
                    doc.fillColor('#475569')
                        .fontSize(10)
                        .font('Helvetica')
                        .text(`• ${this.formatFeatureName(feature)}`, 90, detailY);
                    detailY += 15;
                });
            }

            // Issues and recommendations
            if (analysis.issues && analysis.issues.length > 0) {
                detailY += 10;
                doc.fillColor(this.colors.danger)
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Identified Issues:', 70, detailY);

                detailY += 20;
                analysis.issues.forEach(issue => {
                    doc.fillColor('#475569')
                        .fontSize(10)
                        .font('Helvetica')
                        .text(`• ${issue}`, 90, detailY);
                    detailY += 15;
                });
            }

            if (analysis.recommendations && analysis.recommendations.length > 0) {
                detailY += 10;
                doc.fillColor(this.colors.success)
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Recommendations:', 70, detailY);

                detailY += 20;
                analysis.recommendations.forEach(recommendation => {
                    doc.fillColor('#475569')
                        .fontSize(10)
                        .font('Helvetica')
                        .text(`• ${recommendation}`, 90, detailY);
                    detailY += 15;
                });
            }

            this.currentY = detailY + 20;
        } else {
            this.currentY = startY + 50;
        }
    }

    addConclusionWithStatus(doc, verification) {
        const startY = this.currentY + 20;
        const pageWidth = doc.page.width;

        // Status color
        const statusColor = this.getStatusColor(verification.status);

        // Conclusion box
        doc.rect(50, startY, pageWidth - 100, 100)
            .fill(statusColor)
            .strokeColor(statusColor)
            .lineWidth(2)
            .stroke();

        // Status badge
        const status = verification.status.toUpperCase();
        doc.fillColor('white')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text(status, 70, startY + 20);

        // Conclusion text
        const conclusionText = this.getConclusionText(verification.status, verification);
        doc.fillColor('white')
            .fontSize(11)
            .font('Helvetica')
            .text(conclusionText, 70, startY + 50, {
                width: pageWidth - 140,
                lineGap: 5
            });

        this.currentY = startY + 120;
    }

    addHakikaFooter(doc) {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 50;

        // Footer background
        doc.rect(0, footerY, doc.page.width, 50)
            .fill(this.colors.dark);

        // Footer text
        doc.fillColor('white')
            .fontSize(9)
            .font('Helvetica')
            .text('Hakika Academic Verification Platform • Official Report',
                { align: 'center', y: footerY + 15 });

        doc.fillColor('rgba(255, 255, 255, 0.7)')
            .fontSize(8)
            .text(`Generated on: ${new Date().toLocaleString()} • Report ID: HAK-${Date.now().toString().slice(-8)}`,
                { align: 'center', y: footerY + 30 });

        doc.fillColor('rgba(255, 255, 255, 0.5)')
            .text('This is an official verification report. For inquiries, contact support@hakika.com',
                { align: 'center', y: footerY + 42 });
    }

    // ========== HELPER METHODS ==========

    // Helper method to use appropriate font
    useFont(doc, context = 'normal') {
        if (this.hasUnicodeFont) {
            switch (context) {
                case 'header':
                    doc.font('UnicodeFont').fontSize(32);
                    break;
                case 'title':
                    doc.font('UnicodeFont').fontSize(24);
                    break;
                case 'body':
                    doc.font('UnicodeFont').fontSize(10);
                    break;
                case 'bold':
                    doc.font('UnicodeFont').fontSize(10).font('UnicodeFont-Bold');
                    break;
            }
        } else {
            // Fallback to standard fonts with ASCII replacements
            switch (context) {
                case 'header':
                    doc.font('Helvetica-Bold').fontSize(32);
                    break;
                case 'title':
                    doc.font('Helvetica-Bold').fontSize(24);
                    break;
                case 'body':
                    doc.font('Helvetica').fontSize(10);
                    break;
                case 'bold':
                    doc.font('Helvetica-Bold').fontSize(10);
                    break;
            }
        }
    }


    drawDetailRow(doc, label, value, x, y) {
        doc.fillColor(this.colors.dark)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(label, x, y);

        doc.fillColor('#475569')
            .fontSize(10)
            .font('Helvetica')
            .text(value, x + 120, y);
    }

    drawInstitutionCard(doc, x, y, width, height, detail, index) {
        const bgColor = index % 2 === 0 ? this.colors.light : '#FFFFFF';

        // Draw card background
        doc.roundedRect(x, y, width, height, 8)
            .fill(bgColor)
            .strokeColor('#E2E8F0')
            .lineWidth(1)
            .stroke();

        // Icon (emojis now work with PDFKit)
        doc.fillColor(this.colors.primary)
            .fontSize(24)
            .text(detail.icon, x + 15, y + 20);

        // Label
        doc.fillColor(this.colors.dark)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(detail.label, x + 60, y + 15, {
                width: width - 70,
                ellipsis: true
            });

        // Value
        doc.fillColor('#64748B')
            .fontSize(12)
            .font('Helvetica')
            .text(detail.value, x + 60, y + 35, {
                width: width - 70,
                height: 30,
                ellipsis: true,
                lineBreak: false
            });
    }

    prepareComparisonData(verification) {
        const institutionResponse = verification.verification || {};
        const responseData = institutionResponse.responseData || {};
        const dataPoints = responseData.dataPoints || {};

        return [
            {
                field: 'Student Name',
                submitted: `${verification?.firstName || ''} ${verification?.lastName || ''}`,
                institution: responseData?.studentName || 'Pending',
                match: dataPoints?.name_match || false,
                confidence: dataPoints?.name_confidence || 0
            },
            {
                field: 'Student ID',
                submitted: verification?.studentId || 'N/A',
                institution: responseData?.studentId || 'Pending',
                match: dataPoints?.studentId_match || false,
                confidence: dataPoints?.studentId_confidence || 0
            },
            {
                field: 'Course Name',
                submitted: verification?.courseName || 'N/A',
                institution: responseData?.courseName || 'Pending',
                match: dataPoints?.courseName_match || false,
                confidence: dataPoints?.courseName_confidence || 0
            },
            {
                field: 'Degree Type',
                submitted: verification?.degreeType || 'N/A',
                institution: responseData?.degreeType || 'Pending',
                match: dataPoints?.degreeType_match || false,
                confidence: dataPoints?.degreeType_confidence || 0
            },
            {
                field: 'Classification',
                submitted: verification?.classification || 'N/A',
                institution: responseData?.classification || 'Pending',
                match: dataPoints?.classification_match || false,
                confidence: dataPoints?.classification_confidence || 0
            },
            {
                field: 'Graduation Year',
                submitted: verification?.graduationYear?.toString() || 'N/A',
                institution: responseData?.graduationYear || 'Pending',
                match: dataPoints?.graduationYear_match || false,
                confidence: dataPoints?.graduationYear_confidence || 0
            }
        ];
    }

    getStatusWithBadge(status) {
        const statusConfig = {
            'completed': { color: this.colors.success, text: '[√] COMPLETED' },
            'failed': { color: this.colors.danger, text: '× FAILED' },
            'processing': { color: this.colors.warning, text: '⏳ PROCESSING' },
            'pending': { color: '#64748B', text: '⏸️ PENDING' },
            'requires_review': { color: this.colors.secondary, text: '🔍 REVIEW REQUIRED' }
        };

        const config = statusConfig[status] || { color: '#64748B', text: status.toUpperCase() };
        return config.text;
    }

    getStatusColor(status) {
        const colors = {
            'completed': this.colors.success,
            'failed': this.colors.danger,
            'processing': this.colors.warning,
            'pending': '#CBD5E1',
            'requires_review': this.colors.secondary
        };
        return colors[status] || this.colors.primary;
    }

    getProcessingTime(verification) {
        if (verification.createdAt && verification.updatedAt) {
            const start = new Date(verification.processingStartedAtAt);
            const end = new Date(verification.processingEndedAt);
            const diffMs = end - start;
            const diffMin = Math.round(diffMs / (1000 * 60));

            if (diffMin > 60) {
                const hours = Math.floor(diffMin / 60);
                const minutes = diffMin % 60;
                return `${hours}h ${minutes}m`;
            } else if (diffMin > 0) {
                return `${diffMin} minutes`;
            } else {
                return `${Math.round(diffMs / 1000)} seconds`;
            }
        }
        return '';
    }

    formatFeatureName(feature) {
        const featureMap = {
            'document_authenticity': 'Document Authenticity',
            'institution_verification': 'Institution Verification',
            'signature_validation': 'Signature Validation',
            'security_features': 'Security Features',
            'data_consistency': 'Data Consistency',
            'pattern_analysis': 'Pattern Analysis'
        };
        return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getConclusionText(status, verification) {
        const conclusions = {
            'completed': `The certificate has been successfully verified with a confidence score of ${verification.verificationScore || 0}%. All security checks and institutional verification processes have been completed successfully. This certificate appears to be authentic and valid.`,
            'failed': 'The certificate verification could not be completed successfully. Multiple verification checks failed to validate the authenticity of the document. Please review the identified issues and consider manual verification or contact the issuing institution directly.',
            'processing': 'The certificate verification is currently in progress. Our system is analyzing the document and contacting the issuing institution for validation. Please check back later for complete results.',
            'pending': 'The certificate verification is pending processing. The document has been received and will be processed shortly according to our verification queue.',
            'requires_review': 'The certificate requires additional manual review. While most automated checks passed, some aspects require human verification for complete confidence. Our review team will contact you with results within 24-48 hours.'
        };
        return conclusions[status] || 'Verification process completed. Please review the detailed results above.';
    }

    // ========== CLEANUP AND UTILITY METHODS ==========

    async cleanupOldReports(maxAgeHours = 24) {
        try {
            const files = await fsPromises.readdir(this.reportsDir);
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;

            for (const file of files) {
                if (file.endsWith('.pdf')) {
                    const filePath = path.join(this.reportsDir, file);
                    const stats = await fsPromises.stat(filePath);

                    if (now - stats.mtime.getTime() > maxAge) {
                        await fsPromises.unlink(filePath);
                    }
                }
            }
        } catch (error) {
            console.error('Error cleaning up old reports:', error);
        }
    }

    validatePDF(filePath) {
        try {
            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                return { valid: false, error: 'File is empty' };
            }

            // Check if file starts with PDF header
            const buffer = fs.readFileSync(filePath, { encoding: null });
            const header = buffer.toString('ascii', 0, 5);

            if (header !== '%PDF-') {
                return { valid: false, error: 'Invalid PDF header' };
            }

            return { valid: true, size: stats.size };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async generateBulkVerificationReport(bulkVerificationData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: `Hakika Bulk Verification Report - ${bulkVerificationData.id}`,
                        Author: 'Hakika Verification System',
                        Subject: 'Bulk Academic Certificate Verification',
                        Keywords: 'bulk, verification, academic, certificate, hakika',
                        Creator: 'Hakika Platform v2.0'
                    }
                });

                const filename = `hakika-bulk-${bulkVerificationData.id}-${Date.now()}.pdf`;
                const filePath = path.join(this.reportsDir, filename);
                const writeStream = fs.createWriteStream(filePath);

                doc.pipe(writeStream);

                this.currentY = 50;
                this.addHakikaHeader(doc);

                doc.fillColor(this.colors.dark)
                    .fontSize(24)
                    .font('Helvetica-Bold')
                    .text('BULK VERIFICATION REPORT', { align: 'center', y: this.currentY });

                this.currentY += 40;

                // Add summary
                if (bulkVerificationData.summary) {
                    const summary = bulkVerificationData.summary;
                    doc.fillColor(this.colors.primary)
                        .fontSize(16)
                        .font('Helvetica-Bold')
                        .text('Summary:', 50, this.currentY);

                    this.currentY += 30;

                    const summaryText = [
                        `Total Verifications: ${summary.total || 0}`,
                        `Completed: ${summary.completed || 0}`,
                        `Failed: ${summary.failed || 0}`,
                        `Processing: ${summary.processing || 0}`,
                        `Success Rate: ${summary.successRate || 0}%`
                    ];

                    summaryText.forEach((text, index) => {
                        doc.fillColor(this.colors.dark)
                            .fontSize(12)
                            .font('Helvetica')
                            .text(text, 70, this.currentY + (index * 20));
                    });

                    this.currentY += (summaryText.length * 20 + 30);
                }

                this.addHakikaFooter(doc);
                doc.end();

                writeStream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({
                        filePath,
                        filename,
                        fileSize: stats.size,
                        mimeType: 'application/pdf'
                    });
                });

                writeStream.on('error', reject);

            } catch (error) {
                reject(new Error(`Bulk report generation error: ${error.message}`));
            }
        });
    }

    // ========== PDF MANIPULATION METHODS ==========

    async addPageNumbers(pdfPath) {
        try {
            // Read the existing PDF
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // Embed standard font for page numbers
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();
            const totalPages = pages.length;

            // Add page numbers to each page
            pages.forEach((page, index) => {
                const { width, height } = page.getSize();

                // Format page number (e.g., "Page 1 of 10")
                const pageText = `Page ${index + 1} of ${totalPages}`;

                // Calculate position (bottom center, with margin)
                const textWidth = 50; // Approximate width of text
                const x = (width - textWidth) / 2; // Center horizontally
                const y = 30; // 30 points from bottom

                // Draw page number
                page.drawText(pageText, {
                    x: x,
                    y: y,
                    size: 10,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5), // Gray color
                });

                // Optional: Add a decorative line above page number
                page.drawLine({
                    start: { x: x - 20, y: y + 15 },
                    end: { x: x + textWidth + 20, y: y + 15 },
                    thickness: 0.5,
                    color: rgb(0.8, 0.8, 0.8),
                });
            });

            // Save the modified PDF
            const modifiedPdfBytes = await pdfDoc.save();

            // Create new filename
            const parsedPath = path.parse(pdfPath);
            const numberedPath = path.join(
                parsedPath.dir,
                `${parsedPath.name}-numbered${parsedPath.ext}`
            );

            await fsPromises.writeFile(numberedPath, modifiedPdfBytes);

            return numberedPath;

        } catch (error) {
            throw new Error(`Page numbering error: ${error.message}`);
        }
    }

    async addWatermark(pdfPath, watermarkText, options = {}) {
        try {
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Default options
            const {
                opacity = 0.1,
                rotation = -45,
                fontSize = 48,
                color = rgb(0.7, 0.7, 0.7),
                position = 'diagonal' // 'diagonal', 'center', 'bottom-right', etc.
            } = options;

            pages.forEach((page) => {
                const { width, height } = page.getSize();

                // Calculate position based on option
                let x, y;
                switch (position) {
                    case 'center':
                        x = width / 2;
                        y = height / 2;
                        break;
                    case 'bottom-right':
                        x = width - 100;
                        y = 100;
                        break;
                    case 'top-left':
                        x = 100;
                        y = height - 100;
                        break;
                    case 'diagonal':
                    default:
                        // Place at center for diagonal watermark
                        x = width / 2;
                        y = height / 2;
                        break;
                }

                page.drawText(watermarkText, {
                    x: x,
                    y: y,
                    size: fontSize,
                    font,
                    color,
                    opacity,
                    rotate: degrees(rotation),
                });
            });

            const watermarkedBytes = await pdfDoc.save();
            const watermarkedPath = pdfPath.replace('.pdf', '-watermarked.pdf');
            await fsPromises.writeFile(watermarkedPath, watermarkedBytes);

            return watermarkedPath;
        } catch (error) {
            throw new Error(`Watermark error: ${error.message}`);
        }
    }

    async mergePDFs(pdfPaths, outputPath) {
        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfPath of pdfPaths) {
                if (!fs.existsSync(pdfPath)) {
                    throw new Error(`PDF file not found: ${pdfPath}`);
                }

                const pdfBytes = await fsPromises.readFile(pdfPath);
                const pdf = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();

            // If outputPath is not provided, generate one
            if (!outputPath) {
                const timestamp = Date.now();
                outputPath = path.join(this.reportsDir, `merged-${timestamp}.pdf`);
            }

            await fsPromises.writeFile(outputPath, mergedPdfBytes);

            // Return information about the merged PDF
            const stats = await fsPromises.stat(outputPath);
            return {
                filePath: outputPath,
                fileSize: stats.size,
                pageCount: mergedPdf.getPageCount(),
                mimeType: 'application/pdf'
            };

        } catch (error) {
            throw new Error(`PDF merge error: ${error.message}`);
        }
    }

    async extractTextFromPDF(pdfPath) {
        try {
            // For text extraction, we'll use pdf-parse which is better for text extraction
            // First, check if pdf-parse is available
            let pdfParse;
            try {
                pdfParse = require('pdf-parse');
            } catch (e) {
                // Fallback to basic metadata extraction if pdf-parse is not installed
                return await this.extractMetadata(pdfPath);
            }

            const pdfBytes = await fsPromises.readFile(pdfPath);
            const data = await pdfParse(pdfBytes);

            return {
                text: data.text,
                pageCount: data.numpages,
                info: data.info,
                metadata: data.metadata,
                textByPage: data.text.split(/\n\s*\n/).filter(text => text.trim()), // Split by paragraphs
            };

        } catch (error) {
            // Fallback to metadata extraction
            return await this.extractMetadata(pdfPath);
        }
    }

    async extractMetadata(pdfPath) {
        try {
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            return {
                pageCount: pdfDoc.getPageCount(),
                author: pdfDoc.getAuthor(),
                title: pdfDoc.getTitle(),
                subject: pdfDoc.getSubject(),
                keywords: pdfDoc.getKeywords(),
                creator: pdfDoc.getCreator(),
                producer: pdfDoc.getProducer(),
                creationDate: pdfDoc.getCreationDate(),
                modificationDate: pdfDoc.getModificationDate(),
            };
        } catch (error) {
            throw new Error(`PDF metadata extraction error: ${error.message}`);
        }
    }

    async splitPDF(pdfPath, options = {}) {
        try {
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const totalPages = pdfDoc.getPageCount();

            const {
                pageRanges = '1-last', // '1-3,5,7-10' or 'all' or '1-last'
                outputDir = this.reportsDir,
                prefix = 'split-page'
            } = options;

            const splitFiles = [];

            // Parse page ranges
            const pagesToExtract = this.parsePageRanges(pageRanges, totalPages);

            // Create individual PDFs for each page
            for (const pageNumber of pagesToExtract) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNumber - 1]); // 0-indexed
                newPdf.addPage(copiedPage);

                const newPdfBytes = await newPdf.save();
                const outputPath = path.join(outputDir, `${prefix}-${pageNumber}.pdf`);

                await fsPromises.writeFile(outputPath, newPdfBytes);
                splitFiles.push(outputPath);
            }

            return {
                splitFiles,
                totalPages: totalPages,
                pagesExtracted: pagesToExtract.length
            };

        } catch (error) {
            throw new Error(`PDF split error: ${error.message}`);
        }
    }

    parsePageRanges(rangeStr, totalPages) {
        if (rangeStr === 'all' || rangeStr === '1-last') {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = new Set();
        const ranges = rangeStr.split(',');

        for (const range of ranges) {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(num => {
                    if (num.toLowerCase() === 'last') return totalPages;
                    return parseInt(num.trim());
                });

                for (let i = start; i <= Math.min(end, totalPages); i++) {
                    pages.add(i);
                }
            } else {
                const pageNum = parseInt(range.trim());
                if (pageNum <= totalPages) {
                    pages.add(pageNum);
                }
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    }

    async compressPDF(pdfPath, options = {}) {
        try {
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes, {
                ignoreEncryption: true,
                updateMetadata: false
            });

            const {
                quality = 'medium', // 'low', 'medium', 'high'
                removeMetadata = false,
                outputPath = pdfPath.replace('.pdf', '-compressed.pdf')
            } = options;

            // Set compression options
            const saveOptions = {};

            switch (quality) {
                case 'low':
                    saveOptions.useObjectStreams = false;
                    saveOptions.imagesCompression = 'JPEG';
                    saveOptions.imagesCompressionQuality = 0.3;
                    break;
                case 'medium':
                    saveOptions.useObjectStreams = true;
                    saveOptions.imagesCompression = 'JPEG';
                    saveOptions.imagesCompressionQuality = 0.6;
                    break;
                case 'high':
                    saveOptions.useObjectStreams = true;
                    saveOptions.imagesCompression = 'JPEG';
                    saveOptions.imagesCompressionQuality = 0.8;
                    break;
            }

            if (removeMetadata) {
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer('');
                pdfDoc.setCreator('');
            }

            const compressedBytes = await pdfDoc.save(saveOptions);
            await fsPromises.writeFile(outputPath, compressedBytes);

            const originalStats = await fsPromises.stat(pdfPath);
            const compressedStats = await fsPromises.stat(outputPath);

            return {
                filePath: outputPath,
                originalSize: originalStats.size,
                compressedSize: compressedStats.size,
                reduction: ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(2) + '%'
            };

        } catch (error) {
            throw new Error(`PDF compression error: ${error.message}`);
        }
    }

    async protectPDF(pdfPath, password, options = {}) {
        try {
            const pdfBytes = await fsPromises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            const {
                ownerPassword = password, // Owner password (for full access)
                userPassword = password,  // User password (for restricted access)
                permissions = {
                    printing: 'lowResolution', // 'lowResolution' or 'highResolution'
                    modifying: false,
                    copying: false,
                    annotating: true,
                    fillingForms: true,
                    contentAccessibility: true,
                    documentAssembly: false
                },
                outputPath = pdfPath.replace('.pdf', '-protected.pdf')
            } = options;

            // Encrypt the PDF
            pdfDoc.encrypt({
                userPassword: userPassword,
                ownerPassword: ownerPassword,
                permissions: permissions
            });

            const protectedBytes = await pdfDoc.save();
            await fsPromises.writeFile(outputPath, protectedBytes);

            return {
                filePath: outputPath,
                protected: true,
                hasUserPassword: !!userPassword,
                hasOwnerPassword: !!ownerPassword
            };

        } catch (error) {
            throw new Error(`PDF protection error: ${error.message}`);
        }
    }

    async createPDFFromImages(images, options = {}) {
        try {
            const pdfDoc = await PDFDocument.create();

            const {
                outputPath = path.join(this.reportsDir, `images-${Date.now()}.pdf`),
                pageSize = 'A4',
                margin = 50,
                imageQuality = 0.8
            } = options;

            for (const imagePath of images) {
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found: ${imagePath}`);
                }

                const imageBytes = await fsPromises.readFile(imagePath);
                let image;

                // Determine image type and embed accordingly
                const ext = path.extname(imagePath).toLowerCase();
                if (ext === '.jpg' || ext === '.jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (ext === '.png') {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    throw new Error(`Unsupported image format: ${ext}`);
                }

                // Create a new page for each image
                const page = pdfDoc.addPage([595.28, 841.89]); // A4

                // Calculate dimensions to fit image on page with margins
                const maxWidth = page.getWidth() - (2 * margin);
                const maxHeight = page.getHeight() - (2 * margin);

                const widthRatio = maxWidth / image.width;
                const heightRatio = maxHeight / image.height;
                const scale = Math.min(widthRatio, heightRatio);

                const width = image.width * scale;
                const height = image.height * scale;

                // Center the image on the page
                const x = (page.getWidth() - width) / 2;
                const y = (page.getHeight() - height) / 2;

                page.drawImage(image, {
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                });

                // Optional: Add image filename as caption
                if (options.addCaptions) {
                    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                    page.drawText(path.basename(imagePath), {
                        x: margin,
                        y: margin / 2,
                        size: 10,
                        font: font,
                        color: rgb(0.3, 0.3, 0.3),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            await fsPromises.writeFile(outputPath, pdfBytes);

            return {
                filePath: outputPath,
                pageCount: pdfDoc.getPageCount(),
                imagesCount: images.length
            };

        } catch (error) {
            throw new Error(`Create PDF from images error: ${error.message}`);
        }
    }

    // Add this method to check for page breaks
    checkPageBreak(doc, requiredHeight = 100) {
        if (this.currentY + requiredHeight > doc.page.height - 100) {
            doc.addPage();
            this.currentY = 50;
            this.addHakikaHeader(doc, true); // Add minimal header
            return true;
        }
        return false;
    }
}

module.exports = PDFService;