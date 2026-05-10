/* Validators Module - All validation rules and logic */

const Validators = (() => {
  // Validation rules for each input type
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
          return {
            valid: false,
            message: "Please enter a valid email address",
          };
        }
        return { valid: true, message: "Email is valid!" };
      },
    },
    phone: {
      pattern: /^[0-9\s\-\+\(\)]{10,}$/,
      message: "Please enter a valid phone number",
      check: (value) => {
        if (!value)
          return { valid: false, message: "Phone number is required" };
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

        UI.updatePasswordRequirements(requirements);

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

  // Calculate password strength score
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

  // Validate a single field
  function validateField(input) {
    const validationType = input.getAttribute("data-validation");
    const value = input.value.trim();

    if (!validationType) return;

    // Handle checkbox
    if (input.type === "checkbox") {
      const rule = validationRules[validationType];
      const result = rule.check(input);
      UI.updateFieldValidation(input, result);
      return;
    }

    // Handle password strength
    if (validationType === "password" && value) {
      const strength = calculatePasswordStrength(value);
      UI.updatePasswordStrength(strength);
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

    UI.updateFieldValidation(input, result);
  }

  // Validate entire form
  function validateForm(formInputs) {
    let isValid = true;

    formInputs.forEach((input) => {
      const validationType = input.getAttribute("data-validation");
      if (!validationType) return;

      // Skip optional fields that are empty
      if (input.getAttribute("required") === "false" && !input.value.trim()) {
        input.classList.remove("error", "success");
        return;
      }

      // Validate field
      validateField(input);

      // Check if valid
      if (!input.classList.contains("success")) {
        isValid = false;
      }
    });

    return isValid;
  }

  // Public API
  return {
    validationRules,
    calculatePasswordStrength,
    validateField,
    validateForm,
  };
})();
