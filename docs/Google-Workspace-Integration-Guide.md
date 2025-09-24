# Google Workspace Integration Guide for Jorge's Supplier Sourcing

## Overview
This guide shows how to integrate Jorge's supplier sourcing workflow with Google Workspace (Gmail, Drive, Calendar).

## Current Implementation Status

### ✅ What's Built
- Full 4-stage supplier sourcing workflow UI
- Email composer with supplier templates
- Document upload interface
- Supplier comparison matrix
- Introduction tracking system

### ⚠️ What Needs Google Integration
1. **Gmail API** - Actually send emails to suppliers
2. **Google Drive API** - Store supplier response documents
3. **Google Calendar API** (optional) - Schedule follow-ups

---

## 1. Gmail API Integration

### Setup Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download credentials JSON file
6. Add to `.env.local`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### Update `/api/send-supplier-email.js`:
```javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// In handler function:
const email = [
  `To: ${to}`,
  `Subject: ${subject}`,
  '',
  body
].join('\n');

const encodedEmail = Buffer.from(email)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

await gmail.users.messages.send({
  userId: 'me',
  requestBody: {
    raw: encodedEmail,
  },
});
```

---

## 2. Google Drive API Integration

### Setup Steps:
1. Enable Google Drive API in same project
2. Create service account or use OAuth
3. Add credentials to `.env.local`

### Update `/api/upload-supplier-response.js`:
```javascript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// After file upload:
const fileMetadata = {
  name: fileName,
  parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Supplier Responses folder
};

const media = {
  mimeType: file.mimetype,
  body: fs.createReadStream(file.filepath),
};

const driveFile = await drive.files.create({
  requestBody: fileMetadata,
  media: media,
  fields: 'id, webViewLink',
});

// Return Drive link instead of local path
res.status(200).json({
  success: true,
  file_path: driveFile.data.webViewLink,
  drive_id: driveFile.data.id,
  // ...
});
```

---

## 3. Folder Structure in Google Drive

Create these folders in your Google Drive:
```
📁 Triangle Intelligence
  └── 📁 Jorge - Supplier Sourcing
      ├── 📁 Client Intake Forms
      ├── 📁 Supplier Responses
      │   ├── 📁 [Client Name]
      │   │   ├── 📄 Supplier_A_Quote.pdf
      │   │   ├── 📄 Supplier_B_Capabilities.pdf
      │   │   └── 📄 Supplier_C_Certifications.pdf
      └── 📁 Final Reports
```

Get folder IDs:
1. Open folder in Drive
2. Copy ID from URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`
3. Add to `.env.local`:
```
GOOGLE_DRIVE_INTAKE_FOLDER=folder_id_here
GOOGLE_DRIVE_RESPONSES_FOLDER=folder_id_here
GOOGLE_DRIVE_REPORTS_FOLDER=folder_id_here
```

---

## 4. Current Workflow with Google Integration

### Stage 1: Client Context
- ✅ Client fills intake form
- 📤 **Gmail**: Email confirmation to client
- 💾 **Drive**: Save intake form PDF to "Client Intake Forms"

### Stage 2: Network Research
- ✅ AI discovers suppliers
- 📧 **Gmail**: Send info request to each supplier
- 📥 **Gmail**: Track email status (sent/delivered/replied)
- 💾 **Drive**: Auto-save emails to Drive

### Stage 3: Validation Analysis
- 📁 **Drive**: Upload supplier responses (quotes, certs)
- ✅ Jorge scores in comparison matrix
- 📊 **Drive**: Store analysis notes

### Stage 4: Final Report
- ✅ Generate final report
- 📧 **Gmail**: Send introduction emails
- 💾 **Drive**: Save final deliverable to "Final Reports"
- 📧 **Gmail**: Email report to client

---

## 5. Quick Start (No Google Setup Yet)

The system works NOW without Google integration:
- Emails are logged to console (check terminal)
- Files saved to `public/uploads/supplier-responses/`
- You can test full workflow immediately

### To Enable Google Integration Later:
1. Install googleapis: `npm install googleapis`
2. Follow setup steps above
3. Update API files with Google code
4. Restart server

---

## 6. Alternative: Use Existing Google MCP Tools

If you already have Google MCP tools configured:
- Check `.claude/mcp_settings.json` for existing Google integrations
- Use MCP tools directly from workflow:
  - `mcp__google-gmail__send_email`
  - `mcp__google-drive__upload_file`
  - `mcp__google-calendar__create_event`

---

## 7. Testing the Workflow

### Test Without Google (Current):
```bash
# 1. Start supplier sourcing workflow
# 2. AI discovers suppliers
# 3. Click "Email Supplier" - email logged to console
# 4. Upload supplier response - saved to public/uploads
# 5. Score suppliers in matrix
# 6. Make introductions - logged to console
```

### Test With Google (After Setup):
```bash
# Same workflow but:
# - Emails actually sent via Gmail
# - Files saved to Google Drive
# - Calendar events created for follow-ups
```

---

## Next Steps

1. **Immediate**: Test current workflow (works without Google)
2. **Phase 1**: Set up Gmail API for actual email sending
3. **Phase 2**: Set up Drive API for cloud storage
4. **Phase 3**: Add Calendar API for automated follow-ups

The workflow is FULLY FUNCTIONAL now - Google integration just makes it production-ready! 🚀