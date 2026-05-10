/* UI Manager Module - Handle all UI rendering and updates */

const UI = (() => {
  // Update password strength display
  function updatePasswordStrength(strength) {
    const strengthBar = document.querySelector(".strength-bar");
    const strengthText = document.querySelector(".strength-text");

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

  // Update password requirement indicators
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

  // Update validation UI for a field
  function updateFieldValidation(input, result) {
    const formGroup = input.closest(".form-group");
    const validationMessage = formGroup.querySelector(".validation-message");

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

  // Show form status message
  function showFormStatus(isSuccess) {
    const form = document.getElementById("validationForm");
    const formStatus = document.getElementById("formStatus");

    form.style.display = "none";
    formStatus.classList.remove("hidden");
  }

  // Reset form
  function resetForm(formInputs) {
    const form = document.getElementById("validationForm");
    const formStatus = document.getElementById("formStatus");

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

  // Update submit button loading state
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }

  // Public API
  return {
    updatePasswordStrength,
    updatePasswordRequirements,
    updateFieldValidation,
    showFormStatus,
    resetForm,
    setButtonLoading,
  };
})();
