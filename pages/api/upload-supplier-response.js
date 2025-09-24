/**
 * API: Upload Supplier Response
 * Handles supplier document uploads (quotes, certifications, capabilities)
 * Can integrate with Google Drive for storage
 */

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'supplier-responses');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: err.message
        });
      }

      const file = files.file[0];
      const supplierName = fields.supplier_name[0];
      const requestId = fields.request_id[0];

      const timestamp = Date.now();
      const fileName = `${supplierName.replace(/\s+/g, '_')}_${timestamp}${path.extname(file.originalFilename)}`;
      const newPath = path.join(uploadDir, fileName);

      fs.renameSync(file.filepath, newPath);

      const publicPath = `/uploads/supplier-responses/${fileName}`;

      console.log(`✅ Supplier response uploaded: ${fileName}`);
      console.log(`Supplier: ${supplierName}`);
      console.log(`Request ID: ${requestId}`);

      // TODO: Upload to Google Drive for better storage
      // Use Google Drive API with your credentials

      res.status(200).json({
        success: true,
        file_path: publicPath,
        file_name: fileName,
        supplier_name: supplierName,
        request_id: requestId,
        uploaded_at: new Date().toISOString()
      });
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
}