/**
 * Operational errors sent to the client with an HTTP status code.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status
   * @param {string} message - Safe client-facing message
   * @param {boolean} [isOperational=true]
   */
  constructor(statusCode, message, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}
