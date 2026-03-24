// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Vietnamese)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Password validation
export const isValidPassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar
  );
};

export const getPasswordStrength = (password) => {
  if (!password) {
    return { level: 'weak', text: '', color: 'bg-gray-300' };
  }

  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) {
    return { level: 'weak', text: 'Yếu', color: 'bg-red-500' };
  } else if (strength <= 4) {
    return { level: 'medium', text: 'Trung bình', color: 'bg-yellow-500' };
  } else {
    return { level: 'strong', text: 'Mạnh', color: 'bg-green-500' };
  }
};
