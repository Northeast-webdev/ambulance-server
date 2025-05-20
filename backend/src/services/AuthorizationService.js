/**
 * AuthorizationService.js
 * Service for handling user authorization and permission checks
 */

// Role-based permissions map
const rolePermissions = {
  admin: ["read", "write", "update", "delete", "manage"],
  supervisor: ["read", "write", "update"],
  user: ["read", "write"],
  guest: ["read"],
};

class AuthorizationService {
  constructor() {
    // No initialization needed for static methods
  }

  /**
   * Checks if user has permission for the requested operation
   * @param {Object} request - Fastify request object
   * @param {String} permission - Required permission (read, write, update, delete, manage)
   * @returns {Boolean} - True if user has permission
   * @throws {Error} - If user doesn't have permission
   */
  static async checkPermission(request, permission) {
    // If no permission specified, allow the request
    if (!permission) return true;

    // Get user from request (set by authentication decorator)
    const user = request.user;

    // If no user found, deny access
    if (!user) {
      throw new Error("Authentication required");
    }

    // Get user's role
    const role = user.role || "guest";

    // Check if role has the required permission
    const permissions = rolePermissions[role] || [];

    if (!permissions.includes(permission) && !permissions.includes("manage")) {
      throw new Error(
        `Permission denied: ${permission} operation not allowed for ${role}`
      );
    }

    return true;
  }

  /**
   * Creates middleware for checking operation permissions
   * @param {String} permission - Required permission
   * @returns {Function} - Middleware function
   */
  static requirePermission(permission) {
    return async (request, reply) => {
      try {
        await AuthorizationService.checkPermission(request, permission);
      } catch (error) {
        reply.code(403).send({ error: error.message });
        return false;
      }
      return true;
    };
  }

  /**
   * Checks if user owns the resource
   * @param {Object} user - User object
   * @param {Object} resource - Resource to check
   * @param {String} field - Field to compare (default: 'user_id')
   * @returns {Boolean} - True if user owns the resource
   */
  static isOwner(user, resource, field = "user_id") {
    if (!user || !resource) return false;

    const userId = user.id || user._id?.toString();
    const resourceUserId = resource[field]?.toString();

    return userId === resourceUserId;
  }
}

module.exports = AuthorizationService;
