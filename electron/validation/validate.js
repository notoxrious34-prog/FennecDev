/**
 * Validation helper - wraps Zod schema parsing
 * Returns standardized error format
 */

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code
    }));
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errors
      }
    };
  }
  return { success: true, data: result.data };
}

module.exports = { validate };
