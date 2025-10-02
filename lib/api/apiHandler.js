/**
 * API Handler Wrapper
 * Standardized request handling with error handling and method validation
 */

import { handleApiError, ApiError } from './errorHandler.js';
import { withAuth } from '../middleware/auth-middleware.js';

/**
 * API handler wrapper with standardized error handling
 *
 * @param {Object} handlers - Object mapping HTTP methods to handler functions
 * @returns {Function} Express-style request handler
 *
 * @example
 * export default apiHandler({
 *   GET: async (req, res) => {
 *     const data = await fetchData();
 *     return res.status(200).json({ success: true, data });
 *   },
 *   POST: async (req, res) => {
 *     const result = await createData(req.body);
 *     return res.status(201).json({ success: true, result });
 *   }
 * });
 */
export function apiHandler(handlers) {
  return async (req, res) => {
    try {
      const method = req.method;
      const handler = handlers[method];

      // Check if method is supported
      if (!handler) {
        throw new ApiError(
          `Method ${method} not allowed`,
          405,
          { allowedMethods: Object.keys(handlers) }
        );
      }

      // Execute the handler
      return await handler(req, res);
    } catch (error) {
      // Standardized error handling
      return handleApiError(error, req, res);
    }
  };
}

/**
 * Protected API handler - requires authentication
 *
 * @param {Object} handlers - Object mapping HTTP methods to handler functions
 * @returns {Function} Express-style request handler with auth protection
 *
 * @example
 * export default protectedApiHandler({
 *   GET: async (req, res) => {
 *     // req.user is available here (from auth middleware)
 *     const userData = await getUserData(req.user.id);
 *     return res.status(200).json({ success: true, data: userData });
 *   }
 * });
 */
export function protectedApiHandler(handlers) {
  // Wrap each handler with auth middleware
  const protectedHandlers = {};

  for (const method in handlers) {
    if (handlers.hasOwnProperty(method)) {
      protectedHandlers[method] = withAuth(handlers[method]);
    }
  }

  return apiHandler(protectedHandlers);
}

/**
 * Admin-only API handler - requires authentication and admin role
 *
 * @param {Object} handlers - Object mapping HTTP methods to handler functions
 * @returns {Function} Express-style request handler with admin protection
 *
 * @example
 * export default adminApiHandler({
 *   GET: async (req, res) => {
 *     // Only admins can access this
 *     const allUsers = await getAllUsers();
 *     return res.status(200).json({ success: true, data: allUsers });
 *   }
 * });
 */
export function adminApiHandler(handlers) {
  // Wrap each handler with auth middleware and admin check
  const adminHandlers = {};

  for (const method in handlers) {
    if (handlers.hasOwnProperty(method)) {
      adminHandlers[method] = withAuth(async (req, res) => {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
          throw new ApiError(
            'Admin access required',
            403,
            { requiredRole: 'admin', userRole: req.user?.role }
          );
        }

        // Execute the handler
        return await handlers[method](req, res);
      });
    }
  }

  return apiHandler(adminHandlers);
}

/**
 * Helper function to create standardized success response
 *
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized response object
 */
export function successResponse(data, message = null, statusCode = 200) {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  return { response, statusCode };
}

/**
 * Helper to send success response
 *
 * @example
 * return sendSuccess(res, userData, 'User fetched successfully');
 */
export function sendSuccess(res, data, message = null, statusCode = 200) {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
}

/**
 * Helper to send paginated response
 *
 * @example
 * return sendPaginated(res, items, { page: 1, limit: 10, total: 100 });
 */
export function sendPaginated(res, data, pagination) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}
