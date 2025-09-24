// Store email drafts temporarily (in production, use database)
let emailDrafts = [];

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Return all drafts
    res.status(200).json({
      success: true,
      drafts: emailDrafts
    });
  } else if (req.method === 'POST') {
    // Create new draft
    const { request_id, form_type, email_subject, email_body } = req.body;

    const newDraft = {
      id: `draft_${Date.now()}`,
      request_id,
      form_type,
      email_subject,
      email_body,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    emailDrafts.push(newDraft);

    res.status(200).json({
      success: true,
      draft: newDraft
    });
  } else if (req.method === 'DELETE') {
    // Delete draft after sending
    const { id } = req.body;
    emailDrafts = emailDrafts.filter(draft => draft.id !== id);

    res.status(200).json({
      success: true,
      message: 'Draft deleted'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}