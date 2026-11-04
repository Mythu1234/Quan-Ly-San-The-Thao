/**
 * Validation utilities for customer booking information.
 * Enforces strict business rules:
 * - Customer Name: minimum 5 characters, letters and spaces only (Vietnamese accents supported)
 * - Customer Phone: exactly 10 digits starting with Vietnamese mobile prefixes (03, 05, 07, 08, 09)
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates customer name:
 * - Must not be empty or whitespace
 * - Minimum 5 characters (e.g. "Bin" has 3 chars -> invalid)
 * - Only letters and spaces (supports Vietnamese diacritics)
 */
export const validateCustomerName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập họ và tên!' };
  }
  if (trimmed.length < 5) {
    return { isValid: false, error: 'Họ và tên phải có tối thiểu 5 ký tự!' };
  }
  // Unicode letters and spaces
  if (!/^[\p{L}\s]+$/u.test(trimmed)) {
    return { isValid: false, error: 'Họ và tên chỉ được chứa chữ cái và khoảng trắng!' };
  }
  return { isValid: true };
};

/**
 * Validates customer phone:
 * - Strips whitespace, dashes, and dots
 * - Must not be empty
 * - Must contain only digits
 * - Must be exactly 10 digits
 * - Must start with valid VN telecom mobile prefixes: 03, 05, 07, 08, 09
 */
export const validateCustomerPhone = (phone: string): ValidationResult => {
  const clean = phone.trim().replace(/[\s.-]/g, '');
  if (!clean) {
    return { isValid: false, error: 'Vui lòng nhập số điện thoại!' };
  }
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Số điện thoại chỉ được chứa các chữ số!' };
  }
  if (clean.length !== 10) {
    return {
      isValid: false,
      error: `Số điện thoại phải có đúng 10 chữ số (hiện có ${clean.length} số)!`,
    };
  }
  if (!/^(03|05|07|08|09)\d{8}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Số điện thoại phải bắt đầu bằng đầu số hợp lệ (03, 05, 07, 08, 09)!',
    };
  }
  return { isValid: true };
};
