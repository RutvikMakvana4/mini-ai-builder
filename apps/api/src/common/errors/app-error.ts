export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public details?: string
  ) {
    super(message);
  }

  toJSON() {
    return {
      error: { code: this.code, message: this.message, details: this.details },
    };
  }
}