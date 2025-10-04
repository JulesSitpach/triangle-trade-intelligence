/**
 * Google APIs Integration for Triangle Trade Intelligence
 * Supports Gmail, Drive, Calendar, and Sheets APIs
 */

import { google } from 'googleapis';

// Initialize Google Auth with environment variables
const getGoogleAuth = () => {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentials) {
    // Use service account JSON from environment variable
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });
    return auth;
  }

  if (keyFile) {
    // Use service account key file
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFile,
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    });
    return auth;
  }

  // OAuth2 for development (requires user consent)
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  return oauth2Client;
};

// Initialize Google services
const auth = getGoogleAuth();

export const gmail = google.gmail({ version: 'v1', auth });
export const drive = google.drive({ version: 'v3', auth });
export const calendar = google.calendar({ version: 'v3', auth });
export const sheets = google.sheets({ version: 'v4', auth });

// Email sending function using Gmail API
export const sendGmailMessage = async ({ to, subject, message, from = 'Jorge Martinez <triangleintel@gmail.com>' }) => {
  try {
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `From: ${from}`,
      '',
      message
    ].join('\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return {
      success: true,
      messageId: result.data.id,
      message: 'Email sent successfully via Gmail API'
    };
  } catch (error) {
    console.error('Gmail API error:', error);

    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Drive file operations
export const listDriveFiles = async (folderId = null) => {
  try {
    const result = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : undefined,
      fields: 'files(id, name, mimeType, modifiedTime, size)'
    });

    return {
      success: true,
      files: result.data.files
    };
  } catch (error) {
    console.error('Drive API error:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

// Calendar events
export const getCalendarEvents = async (timeMin = new Date().toISOString()) => {
  try {
    const result = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return {
      success: true,
      events: result.data.items
    };
  } catch (error) {
    console.error('Calendar API error:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

// Sheets data reading
export const readSheetData = async (spreadsheetId, range) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });

    return {
      success: true,
      values: result.data.values
    };
  } catch (error) {
    console.error('Sheets API error:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  gmail,
  drive,
  calendar,
  sheets,
  sendGmailMessage,
  listDriveFiles,
  getCalendarEvents,
  readSheetData
};