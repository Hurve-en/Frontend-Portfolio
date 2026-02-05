// ============================================
// FORMVAULT - PROFESSIONAL FORM VALIDATOR
// ============================================

const form = document.getElementById("validationForm");
const formInputs = form.querySelectorAll(".form-input");
const formStatus = document.getElementById("formStatus");
const btnSubmit = form.querySelector(".btn-submit");
let isFormValid = false;

// ============================================
// VALIDATION RULES
// ============================================

const validationRules = {
  name: {
    pattern: /^[a-zA-Z\s]{2,}$|^[a-zA-Z\s]{2,}\s[a-zA-Z\s]{2,}$/,
    message: "Please enter a valid full name (first and last name)",
    check: (value) => {
      if (!value) return { valid: false, message: "Name is required" };
      if (!/^[a-zA-Z\s]+$/.test(value)) {
        return {
          valid: false,
          message: "Name can only contain letters and spaces",
        };
      }
      const names = value.trim().split(/\s+/);
      if (names.length < 2) {
        return { valid: false, message: "Please enter first and last name" };
      }
      if (names[0].length < 2 || names[1].length < 2) {
        return {
          valid: false,
          message: "First and last names must be at least 2 characters",
        };
      }
      return { valid: true, message: "Name looks good!" };
    },
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
    check: (value) => {
      if (!value) return { valid: false, message: "Email is required" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, message: "Please enter a valid email address" };
      }
      return { valid: true, message: "Email is valid!" };
    },
  },
  phone: {
    pattern: /^[0-9\s\-\+\(\)]{10,}$/,
    message: "Please enter a valid phone number",
    check: (value) => {
      if (!value) return { valid: false, message: "Phone number is required" };
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10) {
        return {
          valid: false,
          message: "Phone number must have at least 10 digits",
        };
      }
      return { valid: true, message: "Phone number is valid!" };
    },
  },
  password: {
    message: "Password must meet all requirements",
    check: (value) => {
      if (!value) return { valid: false, message: "Password is required" };

      const requirements = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
      };

      updatePasswordRequirements(requirements);

      const allMet = Object.values(requirements).every((req) => req);

      if (!allMet) {
        const unmet = Object.keys(requirements)
          .filter((key) => !requirements[key])
          .join(", ");
        return { valid: false, message: `Missing: ${unmet}` };
      }

      return { valid: true, message: "Strong password!" };
    },
  },
  match: {
    check: (value, input) => {
      if (!value)
        return { valid: false, message: "Please confirm your password" };
      const matchFieldId = input.getAttribute("data-match");
      const matchField = document.getElementById(matchFieldId);
      if (value !== matchField.value) {
        return { valid: false, message: "Passwords do not match" };
      }
      return { valid: true, message: "Passwords match!" };
    },
  },
  age: {
    check: (value) => {
      if (!value) return { valid: false, message: "Age is required" };
      const age = parseInt(value);
      if (isNaN(age) || age < 13) {
        return { valid: false, message: "You must be at least 13 years old" };
      }
      if (age > 120) {
        return { valid: false, message: "Please enter a valid age" };
      }
      return { valid: true, message: "Age is valid!" };
    },
  },
  url: {
    check: (value) => {
      if (!value) return { valid: true, message: "Optional field" };
      try {
        new URL(value);
        return { valid: true, message: "URL is valid!" };
      } catch {
        return { valid: false, message: "Please enter a valid URL" };
      }
    },
  },
  text: {
    check: (value) => {
      if (!value) return { valid: false, message: "Message is required" };
      if (value.length < 10) {
        return {
          valid: false,
          message: "Message must be at least 10 characters",
        };
      }
      return { valid: true, message: "Message looks good!" };
    },
  },
  checkbox: {
    check: (input) => {
      if (!input.checked) {
        return { valid: false, message: "You must agree to the terms" };
      }
      return { valid: true, message: "Accepted!" };
    },
  },
};

// ============================================
// PASSWORD STRENGTH CALCULATOR
// ============================================

function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 10;

  return Math.min(strength, 100);
}

function updatePasswordStrength(password) {
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const strength = calculatePasswordStrength(password);

  strengthBar.classList.remove("weak", "medium", "strong");

  if (strength < 40) {
    strengthBar.classList.add("weak");
    strengthText.textContent = "Too weak";
  } else if (strength < 70) {
    strengthBar.classList.add("medium");
    strengthText.textContent = "Medium strength";
  } else {
    strengthBar.classList.add("strong");
    strengthText.textContent = "Strong password";
  }

  strengthBar.style.width = strength + "%";
}

function updatePasswordRequirements(requirements) {
  Object.keys(requirements).forEach((key) => {
    const req = document.querySelector(`[data-requirement="${key}"]`);
    if (req) {
      if (requirements[key]) {
        req.classList.add("met");
      } else {
        req.classList.remove("met");
      }
    }
  });
}

// ============================================
// VALIDATION HANDLER
// ============================================

function validateField(input) {
  const validationType = input.getAttribute("data-validation");
  const value = input.value.trim();
  const formGroup = input.closest(".form-group");
  const validationMessage = formGroup.querySelector(".validation-message");
  const inputIcon = formGroup.querySelector(".input-icon");

  if (!validationType) return;

  // Handle checkbox
  if (input.type === "checkbox") {
    const rule = validationRules[validationType];
    const result = rule.check(input);
    updateFieldValidation(input, formGroup, validationMessage, result);
    return;
  }

  // Handle password strength
  if (validationType === "password" && value) {
    updatePasswordStrength(value);
  }

  // Get validation rule
  const rule = validationRules[validationType];
  if (!rule) return;

  let result;
  if (validationType === "match") {
    result = rule.check(value, input);
  } else {
    result = rule.check(value);
  }

  updateFieldValidation(input, formGroup, validationMessage, result);
}

function updateFieldValidation(input, formGroup, validationMessage, result) {
  if (result.valid) {
    input.classList.remove("error");
    input.classList.add("success");
    validationMessage.textContent = result.message;
    validationMessage.style.color = "var(--success)";
  } else {
    input.classList.remove("success");
    input.classList.add("error");
    validationMessage.textContent = result.message;
    validationMessage.style.color = "var(--danger)";
  }
}

// ============================================
// FORM VALIDATION
// ============================================

function validateForm() {
  isFormValid = true;

  formInputs.forEach((input) => {
    const validationType = input.getAttribute("data-validation");
    if (!validationType) return;

    const formGroup = input.closest(".form-group");
    const inputValue = input.type === "checkbox" ? input : input.value.trim();

    // Skip optional fields that are empty
    if (input.getAttribute("required") === "false" && !input.value.trim()) {
      input.classList.remove("error", "success");
      return;
    }

    // Validate field
    validateField(input);

    // Check if valid
    if (!input.classList.contains("success")) {
      isFormValid = false;
    }
  });

  return isFormValid;
}

// ============================================
// EVENT LISTENERS
// ============================================

formInputs.forEach((input) => {
  // Real-time validation
  input.addEventListener("input", () => {
    validateField(input);
  });

  input.addEventListener("change", () => {
    validateField(input);
  });

  input.addEventListener("blur", () => {
    validateField(input);
  });

  // Password toggle visibility
  if (input.id === "password" || input.id === "confirmPassword") {
    const icon = input.parentElement.querySelector(".toggle-password");
    if (icon) {
      icon.addEventListener("click", () => {
        const type = input.type === "password" ? "text" : "password";
        input.type = type;
        icon.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
      });
    }
  }
});

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validate all fields
  if (!validateForm()) {
    console.log("Form validation failed");
    return;
  }

  // Show loading state
  btnSubmit.classList.add("loading");
  btnSubmit.disabled = true;

  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Hide form and show success message
  form.style.display = "none";
  formStatus.classList.remove("hidden");

  // Log form data
  const formData = new FormData(form);
  console.log("Form submitted successfully!");
  console.log("Form data:", Object.fromEntries(formData));

  // Reset button state
  btnSubmit.classList.remove("loading");
  btnSubmit.disabled = false;
});

// ============================================
// RESET FORM
// ============================================

function resetForm() {
  form.style.display = "grid";
  formStatus.classList.add("hidden");
  form.reset();

  formInputs.forEach((input) => {
    input.classList.remove("success", "error");
    const formGroup = input.closest(".form-group");
    const validationMessage = formGroup.querySelector(".validation-message");
    validationMessage.textContent = "";
  });

  // Reset password strength
  const strengthBar = document.querySelector(".strength-bar");
  if (strengthBar) {
    strengthBar.classList.remove("weak", "medium", "strong");
    strengthBar.classList.add("weak");
    strengthBar.style.width = "0%";
  }

  const strengthText = document.querySelector(".strength-text");
  if (strengthText) {
    strengthText.textContent = "Too weak";
  }

  // Reset requirements
  document.querySelectorAll(".requirement").forEach((req) => {
    req.classList.remove("met");
  });

  // Focus first input
  document.getElementById("fullName").focus();
}

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.pageYOffset > 50) {
    navbar.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.boxShadow = "none";
  }
});

console.log("🔐 FormVault loaded successfully!");
