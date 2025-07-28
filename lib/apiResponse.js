// lib/apiResponse.js

// 표준화된 API 응답 형식
export class ApiResponse {
  static success(data = null, message = '요청이 성공적으로 처리되었습니다.', meta = null) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (meta) {
      response.meta = meta;
    }
    
    return response;
  }

  static error(message, code = 'INTERNAL_ERROR', details = null, statusCode = 500) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        statusCode
      },
      timestamp: new Date().toISOString()
    };
  }

  static validationError(field, message, value = null) {
    return this.error(
      `입력값 검증 실패: ${message}`,
      'VALIDATION_ERROR',
      { field, value, message },
      400
    );
  }

  static notFound(resource = '리소스') {
    return this.error(
      `${resource}를 찾을 수 없습니다.`,
      'NOT_FOUND',
      { resource },
      404
    );
  }

  static unauthorized(message = '인증이 필요합니다.') {
    return this.error(
      message,
      'UNAUTHORIZED',
      null,
      401
    );
  }

  static forbidden(message = '접근 권한이 없습니다.') {
    return this.error(
      message,
      'FORBIDDEN',
      null,
      403
    );
  }

  static conflict(message = '중복된 데이터입니다.') {
    return this.error(
      message,
      'CONFLICT',
      null,
      409
    );
  }

  static methodNotAllowed(method, allowedMethods = []) {
    return this.error(
      `${method} 메서드는 허용되지 않습니다.`,
      'METHOD_NOT_ALLOWED',
      { method, allowedMethods },
      405
    );
  }
}

// 에러 응답 헬퍼 함수들
export function handleApiError(res, error, context = '') {
  console.error(`API Error ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // 개발 환경에서만 상세 에러 정보 제공
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.name === 'ValidationError') {
    const response = ApiResponse.validationError('입력값', error.message);
    return res.status(400).json(response);
  }
  
  if (error.message.includes('Duplicate entry')) {
    const response = ApiResponse.conflict('이미 존재하는 데이터입니다.');
    return res.status(409).json(response);
  }
  
  if (error.message.includes('Foreign key constraint')) {
    const response = ApiResponse.error(
      '관련 데이터가 존재하여 작업을 완료할 수 없습니다.',
      'FOREIGN_KEY_CONSTRAINT',
      isDevelopment ? error.message : null,
      400
    );
    return res.status(400).json(response);
  }
  
  // 기본 서버 에러
  const response = ApiResponse.error(
    '서버 내부 오류가 발생했습니다.',
    'INTERNAL_ERROR',
    isDevelopment ? error.message : null,
    500
  );
  
  return res.status(500).json(response);
}

// 공통 검증 함수들
export function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
  }
  
  return true;
}

export function validateFieldLength(value, fieldName, minLength = 0, maxLength = 255) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName}는 문자열이어야 합니다.`);
  }
  
  if (value.length < minLength) {
    throw new Error(`${fieldName}는 최소 ${minLength}자 이상이어야 합니다.`);
  }
  
  if (value.length > maxLength) {
    throw new Error(`${fieldName}는 최대 ${maxLength}자까지만 허용됩니다.`);
  }
  
  return true;
}

// HTTP 메서드 검증 미들웨어
export function validateMethod(req, res, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    const response = ApiResponse.methodNotAllowed(req.method, allowedMethods);
    res.setHeader('Allow', allowedMethods.join(', '));
    return res.status(405).json(response);
  }
  return null;
}

// 페이지네이션 헬퍼
export function createPaginationMeta(total, limit, offset) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    limit,
    offset,
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1
  };
}