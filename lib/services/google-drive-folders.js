/**
 * Google Drive Folder Management for Triangle Intelligence Admin Dashboards
 * Automatically creates and manages folder structure for document organization
 */

import { google } from 'googleapis';

class GoogleDriveFolders {
  constructor() {
    this.drive = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Google Drive API with service account
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      const authClient = await auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });
      this.initialized = true;

      console.log('✅ Google Drive API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  /**
   * Create main Triangle Intelligence folder structure
   */
  async setupMainFolderStructure() {
    await this.initialize();

    try {
      console.log('🗂️ Setting up Triangle Intelligence folder structure...');

      // Create main parent folder
      const mainFolder = await this.createFolder('Triangle Intelligence Admin', null);
      const mainFolderId = mainFolder.id;

      // Define folder structure based on dashboard audit
      const folderStructure = {
        'Broker Operations': [
          'Work Queue Documents',
          'Active Shipments',
          'Compliance Files',
          'Supplier Verification',
          'Crisis Reports'
        ],
        'Sales Operations': [
          'Lead Generation',
          'Pipeline Management',
          'Active Proposals',
          'Professional Services',
          'Market Intelligence'
        ],
        'Client Management': [
          'Customer Files',
          'Account Reports',
          'Support Documentation'
        ],
        'Development Operations': [
          'System Monitoring',
          'Performance Reports',
          'Error Documentation',
          'Configuration Management',
          'Analytics Export'
        ],
        'Mexico Trade Intelligence': [
          'USMCA Certificates',
          'Triangle Routes',
          'Compliance Documents',
          'Joint Projects'
        ]
      };

      const createdFolders = {};

      // Create department folders and subfolders
      for (const [department, subfolders] of Object.entries(folderStructure)) {
        console.log(`📁 Creating ${department} folder...`);

        const deptFolder = await this.createFolder(department, mainFolderId);
        createdFolders[department] = {
          id: deptFolder.id,
          name: department,
          subfolders: {}
        };

        // Create subfolders
        for (const subfolderName of subfolders) {
          console.log(`  📂 Creating ${subfolderName} subfolder...`);

          const subfolder = await this.createFolder(subfolderName, deptFolder.id);
          createdFolders[department].subfolders[subfolderName] = {
            id: subfolder.id,
            name: subfolderName
          };
        }
      }

      // Store folder structure in environment or database for reference
      const folderMapping = {
        main_folder_id: mainFolderId,
        departments: createdFolders,
        created_at: new Date().toISOString()
      };

      console.log('✅ Google Drive folder structure created successfully!');
      console.log('📊 Folder Summary:', {
        main_folder: mainFolder.name,
        departments: Object.keys(createdFolders).length,
        total_subfolders: Object.values(createdFolders).reduce((sum, dept) =>
          sum + Object.keys(dept.subfolders).length, 0
        )
      });

      return folderMapping;

    } catch (error) {
      console.error('❌ Error setting up folder structure:', error);
      throw error;
    }
  }

  /**
   * Create a single folder in Google Drive
   */
  async createFolder(name, parentId = null) {
    const folderMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    };

    try {
      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id,name,webViewLink'
      });

      console.log(`✅ Created folder: ${name} (ID: ${folder.data.id})`);
      return folder.data;
    } catch (error) {
      console.error(`❌ Failed to create folder ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get folder ID by dashboard type and action
   */
  async getFolderForAction(department, subfolder) {
    // This would typically read from database or config file
    // For now, return the folder mapping structure

    const folderMappings = {
      'broker': {
        'track_shipment': 'Active Shipments',
        'update_customs': 'Compliance Files',
        'generate_bol': 'Work Queue Documents',
        'supplier_verification': 'Supplier Verification'
      },
      'sales': {
        'schedule_demo': 'Pipeline Management',
        'send_assessment': 'Active Proposals',
        'lead_generation': 'Lead Generation',
        'market_research': 'Market Intelligence'
      },
      'client': {
        'customer_management': 'Customer Files',
        'account_reports': 'Account Reports',
        'support_documentation': 'Support Documentation'
      },
      'developer': {
        'system_monitoring': 'System Monitoring',
        'performance_reports': 'Performance Reports',
        'error_documentation': 'Error Documentation',
        'config_management': 'Configuration Management'
      },
      'mexico': {
        'usmca_certificates': 'USMCA Certificates',
        'triangle_routes': 'Triangle Routes',
        'compliance_documents': 'Compliance Documents'
      }
    };

    return folderMappings[department]?.[subfolder] || 'Work Queue Documents';
  }

  /**
   * Upload document to specific dashboard folder
   */
  async uploadDocument(filePath, fileName, department, subfolder, metadata = {}) {
    await this.initialize();

    try {
      const targetFolder = await this.getFolderForAction(department, subfolder);

      const fileMetadata = {
        name: fileName,
        parents: [targetFolder], // Would need actual folder ID from database
        description: `Generated from ${department} dashboard - ${metadata.action || 'Document upload'}`
      };

      // Upload file to Google Drive
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: {
          body: require('fs').createReadStream(filePath)
        },
        fields: 'id,name,webViewLink'
      });

      console.log(`✅ Uploaded ${fileName} to ${targetFolder}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Create sharing link for dashboard documents
   */
  async createSharableLink(fileId, permissions = 'view') {
    try {
      // Set file permissions
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: permissions === 'edit' ? 'writer' : 'reader',
          type: 'anyone'
        }
      });

      // Get shareable link
      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink,webContentLink'
      });

      return {
        view_link: file.data.webViewLink,
        download_link: file.data.webContentLink
      };
    } catch (error) {
      console.error('❌ Failed to create shareable link:', error);
      throw error;
    }
  }
}

export default new GoogleDriveFolders();