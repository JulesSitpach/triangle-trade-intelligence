/**
 * CRISIS MESSAGING API ENDPOINT
 * Exposes crisis messaging service functionality
 * NO HARDCODED MESSAGES - Database-driven messaging system
 */

import { crisisMessagingService } from '../../lib/services/crisis-messaging-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  const { action, data = {} } = req.body;
  const startTime = Date.now();

  try {
    logInfo('Crisis messaging API called', { action, data: Object.keys(data) });

    switch (action) {
      case 'get_message':
        const { messageKey, locale = 'en', variables = {} } = data;
        
        if (!messageKey) {
          return res.status(400).json({
            success: false,
            error: 'messageKey is required'
          });
        }

        const message = await crisisMessagingService.getCrisisMessage(messageKey, locale, variables);
        return res.status(200).json({
          success: true,
          message: message,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_context_messages':
        const { context, locale: contextLocale = 'en', variables: contextVariables = {} } = data;
        
        if (!context) {
          return res.status(400).json({
            success: false,
            error: 'context is required'
          });
        }

        const messages = await crisisMessagingService.getCrisisMessagesForContext(context, contextLocale, contextVariables);
        return res.status(200).json({
          success: true,
          messages: messages,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_landing_page_messages':
        const { locale: landingLocale = 'en', calculationData = {} } = data;
        
        const landingMessages = await crisisMessagingService.getLandingPageMessages(landingLocale, calculationData);
        return res.status(200).json({
          success: true,
          landing_messages: landingMessages,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_localized_text':
        const { contentKey, locale: textLocale = 'en', fallbackText = '' } = data;
        
        if (!contentKey) {
          return res.status(400).json({
            success: false,
            error: 'contentKey is required'
          });
        }

        const localizedText = await crisisMessagingService.getLocalizedText(contentKey, textLocale, fallbackText);
        return res.status(200).json({
          success: true,
          text: localizedText,
          processing_time_ms: Date.now() - startTime
        });

      case 'create_variant':
        const { messageKey: variantKey, variantContent, locale: variantLocale = 'en', testGroup = 'variant_a' } = data;
        
        if (!variantKey || !variantContent) {
          return res.status(400).json({
            success: false,
            error: 'messageKey and variantContent are required'
          });
        }

        const variantResult = await crisisMessagingService.createMessageVariant(
          variantKey,
          variantContent,
          variantLocale,
          testGroup
        );
        
        return res.status(200).json({
          success: variantResult.success,
          ...variantResult,
          processing_time_ms: Date.now() - startTime
        });

      case 'update_message':
        const { messageKey: updateKey, updates, locale: updateLocale = 'en' } = data;
        
        if (!updateKey || !updates) {
          return res.status(400).json({
            success: false,
            error: 'messageKey and updates are required'
          });
        }

        const updateResult = await crisisMessagingService.updateCrisisMessage(updateKey, updates, updateLocale);
        
        return res.status(200).json({
          success: updateResult.success,
          ...updateResult,
          processing_time_ms: Date.now() - startTime
        });

      case 'health_check':
        const healthCheck = await crisisMessagingService.healthCheck();
        return res.status(200).json({
          success: true,
          health: healthCheck,
          processing_time_ms: Date.now() - startTime
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown action',
          available_actions: [
            'get_message',
            'get_context_messages',
            'get_landing_page_messages',
            'get_localized_text',
            'create_variant',
            'update_message',
            'health_check'
          ]
        });
    }

  } catch (error) {
    logError('Crisis messaging API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Messaging service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}