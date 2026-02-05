import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
export class ValidationError extends AppError {
  constructor(message: string = 'خطأ في التحقق من البيانات') {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'غير مصرح') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'غير مسموح') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'غير موجود') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'البيانات موجودة مسبقاً') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'تم تجاوز عدد الطلبات') {
    super(message, 429);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = 'حدث خطأ في الخادم';
  let error = 'Internal Server Error';

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.constructor.name;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'البيانات موجودة مسبقاً';
        error = 'UniqueConstraintViolation';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'البيانات المرتبطة غير موجودة';
        error = 'ForeignKeyConstraintViolation';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'السجل غير موجود';
        error = 'RecordNotFound';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'خطأ في العلاقة بين البيانات';
        error = 'RelationViolation';
        break;
      default:
        statusCode = 400;
        message = 'خطأ في قاعدة البيانات';
        error = 'DatabaseError';
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'رمز المصادقة غير صالح';
    error = 'InvalidToken';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'انتهت صلاحية رمز المصادقة';
    error = 'TokenExpired';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    error = 'ValidationError';
  }

  // Handle syntax errors (JSON parsing)
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'تنسيق JSON غير صالح';
    error = 'InvalidJSON';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    error,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler for specific resources
export const notFoundHandler = (resourceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`${resourceName} غير موجود`));
  };
};
