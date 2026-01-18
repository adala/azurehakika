const multer = require('multer');
const path = require('path');
const fs = require('fs');

class FileService {

    constructor() {
        this.uploadDir = path.join(__dirname, '../../../uploads');
        this.bulkUploadDir = path.join(this.uploadDir, 'bulk');
        this.ensureUploadDirsExist();

        this.setupStorage();
        this.setupMulter();
    }

    ensureUploadDirsExist() {
        [this.uploadDir, this.bulkUploadDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    setupStorage() {
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                if (file.fieldname === 'bulkFile') {
                    cb(null, this.bulkUploadDir);
                } else {
                    cb(null, this.uploadDir);
                }
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const extension = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, extension);
                cb(null, baseName + '-' + uniqueSuffix + extension);
            }
        });
    }

    setupMulter() {
        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB limit for bulk files
            },
            fileFilter: (req, file, cb) => {
                if (file.fieldname === 'bulkFile') {
                    this.checkBulkFileType(file, cb);
                } else {
                    this.checkFileType(file, cb);
                }
            }
        });
    }

    checkBulkFileType(file, cb) {
        // Allowed extensions for bulk files
        const filetypes = /csv|xlsx|xls|json/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Only CSV, Excel, and JSON files are allowed for bulk upload!'));
        }
    }

    checkFileType(file, cb) {
        // Allow more file types for consent form
        if (file.fieldname === 'consentForm') {
            const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Error: Only images, PDF, and Word documents are allowed for consent forms!'));
            }
        } else {
            // For certificates
            const filetypes = /jpeg|jpg|png|pdf/;
            const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = filetypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Error: Only images and PDFs are allowed for certificates!'));
            }
        }
    }

    getMulterMiddleware() {
        return this.upload.fields([
            { name: 'certificate', maxCount: 1 },
            { name: 'consentForm', maxCount: 1 }
        ]);
    }

    async uploadFile(file) {
        console.log('Uploading file:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            filename: file.filename
        });

        // Check if file has path (multer diskStorage)
        if (file.path) {
            return file.path;
        }

        // If using memory storage or other, you might need to handle differently
        // For now, we'll create a path based on the upload directory
        const filePath = path.join(this.uploadDir, file.filename || file.originalname);

        // If file.buffer exists (memory storage), write it to disk
        if (file.buffer) {
            await fs.promises.writeFile(filePath, file.buffer);
            return filePath;
        }

        throw new Error('Unable to process file upload - no path or buffer available');
    }

    async uploadBulkFile(file) {
        // Additional processing for bulk files
        const fileInfo = {
            path: file.path,
            originalName: file.originalname,
            size: file.size,
            uploadDate: new Date()
        };

        // You could add file validation, parsing, etc. here
        return fileInfo;
    }

    getMulterMiddleware() {
        return this.upload.fields([
            { name: 'certificate', maxCount: 1 },
            { name: 'consentForm', maxCount: 1 }
        ]);
    }

    getBulkUploadMiddleware() {
        return this.upload.single('bulkFile');
    }

    async parseBulkFile(filePath) {
        const extension = path.extname(filePath).toLowerCase();

        try {
            switch (extension) {
                case '.csv':
                    return await this.parseCSV(filePath);
                case '.xlsx':
                case '.xls':
                    return await this.parseExcel(filePath);
                case '.json':
                    return await this.parseJSON(filePath);
                default:
                    throw new Error('Unsupported file format');
            }
        } catch (error) {
            throw new Error(`Failed to parse bulk file: ${error.message}`);
        }
    }

    async parseCSV(filePath) {
        // Simple CSV parsing (in production, use a proper CSV parser)
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('CSV file must contain at least a header and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const records = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const record = {};

            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });

            records.push(record);
        }

        return records;
    }

    async parseExcel(filePath) {
        // In production, use a library like 'xlsx'
        // For now, return mock data
        console.log('Parsing Excel file:', filePath);
        return [
            { institutionName: 'University A', studentName: 'John Doe' },
            { institutionName: 'University B', studentName: 'Jane Smith' }
        ];
    }

    async parseJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }

     async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                console.log('File deleted successfully:', filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }
}

module.exports = FileService;