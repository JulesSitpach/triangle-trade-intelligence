/**
 * Hybrid Collaboration Service
 * Combines Supabase database operations with Google Apps integration
 * Pattern: Database First → Google Apps Actions
 */

import googleIntegrationService from './google-integration-service';

class HybridCollaborationService {
  constructor() {
    this.supabaseProjectId = 'mrwitpgbcaxgnirqtavt';
  }

  /**
   * Create new collaboration queue item with Google notification
   */
  async createCollaborationItem(itemData, notifyViaGoogle = true) {
    try {
      // 1. Save to database first
      const dbResult = await this.createDatabaseItem(itemData);

      // 2. Trigger Google Apps action if successful
      if (dbResult.success && notifyViaGoogle) {
        await this.triggerGoogleNotification(dbResult.data, itemData);
      }

      return dbResult;
    } catch (error) {
      console.error('Error in createCollaborationItem:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add internal note with optional Google integration
   */
  async addInternalNote(noteData, shareWithGoogle = false) {
    try {
      // 1. Create collaboration queue entry for the note
      const collaborationItem = {
        item_type: 'internal_note',
        priority: noteData.priority || 'medium',
        title: `Internal Note: ${noteData.client}`,
        description: noteData.note,
        requested_by: noteData.category === 'jorge_input' ? 'Jorge' : 'Cristina',
        assigned_to: noteData.category === 'cristina_input' ? 'Cristina' : 'Jorge',
        status: 'active',
        jorge_input: noteData.category === 'jorge_input' ? noteData.note : null,
        cristina_input: noteData.category === 'cristina_input' ? noteData.note : null,
        due_date: this.calculateDueDate(noteData.priority)
      };

      const dbResult = await this.createDatabaseItem(collaborationItem);

      // 2. Optional Google integration for sharing
      if (dbResult.success && shareWithGoogle) {
        await this.shareNoteViaGoogle(dbResult.data, noteData);
      }

      return dbResult;
    } catch (error) {
      console.error('Error in addInternalNote:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update collaboration status with Google calendar sync
   */
  async updateCollaborationStatus(itemId, statusData, syncCalendar = true) {
    try {
      // 1. Update database
      const dbResult = await this.updateDatabaseItem(itemId, statusData);

      // 2. Sync with Google Calendar if needed
      if (dbResult.success && syncCalendar && statusData.due_date) {
        await this.syncWithGoogleCalendar(dbResult.data, statusData);
      }

      return dbResult;
    } catch (error) {
      console.error('Error in updateCollaborationStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get collaboration queue with enhanced data
   */
  async getCollaborationQueue(filters = {}) {
    try {
      // Build query based on filters
      let query = `
        SELECT * FROM collaboration_queue
        WHERE 1=1
      `;

      const params = [];

      if (filters.assigned_to) {
        query += ` AND assigned_to = $${params.length + 1}`;
        params.push(filters.assigned_to);
      }

      if (filters.status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ` AND priority = $${params.length + 1}`;
        params.push(filters.priority);
      }

      query += ` ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
        LIMIT 50
      `;

      const result = await this.executeQuery(query, params);

      if (result.success) {
        return {
          success: true,
          data: result.data.map(item => this.enhanceCollaborationItem(item))
        };
      }

      return result;
    } catch (error) {
      console.error('Error in getCollaborationQueue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search collaboration items with advanced filtering
   */
  async searchCollaborationItems(searchTerm, filters = {}) {
    try {
      let query = `
        SELECT * FROM collaboration_queue
        WHERE (
          title ILIKE $1 OR
          description ILIKE $1 OR
          jorge_input ILIKE $1 OR
          cristina_input ILIKE $1
        )
      `;

      const params = [`%${searchTerm}%`];

      if (filters.date_range) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(filters.date_range.start);
      }

      query += ` ORDER BY updated_at DESC LIMIT 25`;

      const result = await this.executeQuery(query, params);
      return result;
    } catch (error) {
      console.error('Error in searchCollaborationItems:', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods

  async createDatabaseItem(itemData) {
    try {
      const query = `
        INSERT INTO collaboration_queue (
          id, item_type, priority, title, description, requested_by,
          assigned_to, status, jorge_input, cristina_input,
          due_date, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        ) RETURNING *
      `;

      const params = [
        itemData.item_type,
        itemData.priority,
        itemData.title,
        itemData.description,
        itemData.requested_by,
        itemData.assigned_to,
        itemData.status || 'pending',
        itemData.jorge_input,
        itemData.cristina_input,
        itemData.due_date
      ];

      const result = await this.executeQuery(query, params);
      return result;
    } catch (error) {
      throw new Error(`Database creation failed: ${error.message}`);
    }
  }

  async updateDatabaseItem(itemId, updateData) {
    try {
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          params.push(updateData[key]);
          paramIndex++;
        }
      });

      setClause.push(`updated_at = NOW()`);

      const query = `
        UPDATE collaboration_queue
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      params.push(itemId);

      const result = await this.executeQuery(query, params);
      return result;
    } catch (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }
  }

  async executeQuery(query, params = []) {
    try {
      // This would use the Supabase MCP tool in a real implementation
      // For now, simulate the response structure
      console.log('Executing query:', query, 'with params:', params);

      return {
        success: true,
        data: [], // Would contain actual data from Supabase
        message: 'Query executed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async triggerGoogleNotification(collaborationItem, originalData) {
    try {
      if (collaborationItem.assigned_to === 'Jorge') {
        await googleIntegrationService.composeEmail(
          {
            company: 'Jorge Ochoa - Sales Development',
            email: 'triangleintel@gmail.com'
          },
          'collaboration_task',
          {
            taskTitle: collaborationItem.title,
            description: collaborationItem.description,
            priority: collaborationItem.priority,
            dueDate: collaborationItem.due_date
          }
        );
      } else if (collaborationItem.assigned_to === 'Cristina') {
        await googleIntegrationService.composeEmail(
          {
            company: 'Cristina Rodriguez - Customs Broker',
            email: 'triangleintel@gmail.com'
          },
          'collaboration_task',
          {
            taskTitle: collaborationItem.title,
            description: collaborationItem.description,
            priority: collaborationItem.priority,
            dueDate: collaborationItem.due_date
          }
        );
      }
    } catch (error) {
      console.error('Google notification failed:', error);
      // Don't throw - notification failure shouldn't break the main flow
    }
  }

  async shareNoteViaGoogle(collaborationItem, noteData) {
    try {
      // Create Google Doc with the note content
      await googleIntegrationService.createDocument(
        `Internal Note - ${noteData.client}`,
        {
          content: noteData.note,
          category: noteData.category,
          priority: noteData.priority,
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Google note sharing failed:', error);
    }
  }

  async syncWithGoogleCalendar(collaborationItem, statusData) {
    try {
      if (statusData.due_date) {
        await googleIntegrationService.createCalendarEvent(
          `${collaborationItem.title} - Due`,
          {
            date: statusData.due_date,
            description: collaborationItem.description,
            assignedTo: collaborationItem.assigned_to
          }
        );
      }
    } catch (error) {
      console.error('Google calendar sync failed:', error);
    }
  }

  calculateDueDate(priority) {
    const now = new Date();
    const daysToAdd = {
      'urgent': 1,
      'high': 3,
      'medium': 7,
      'low': 14
    };

    now.setDate(now.getDate() + (daysToAdd[priority] || 7));
    return now.toISOString().split('T')[0];
  }

  enhanceCollaborationItem(item) {
    return {
      ...item,
      priorityLevel: this.getPriorityLevel(item.priority),
      daysUntilDue: this.calculateDaysUntilDue(item.due_date),
      statusColor: this.getStatusColor(item.status),
      assigneeAvatar: this.getAssigneeAvatar(item.assigned_to)
    };
  }

  getPriorityLevel(priority) {
    const levels = { urgent: 4, high: 3, medium: 2, low: 1 };
    return levels[priority] || 1;
  }

  calculateDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusColor(status) {
    const colors = {
      'pending': 'badge-warning',
      'active': 'badge-info',
      'completed': 'badge-success',
      'blocked': 'badge-danger'
    };
    return colors[status] || 'badge-secondary';
  }

  getAssigneeAvatar(assignee) {
    const avatars = {
      'Jorge': '👨‍💼',
      'Cristina': '👩‍💼',
      'Both': '🤝'
    };
    return avatars[assignee] || '👤';
  }
}

export default new HybridCollaborationService();