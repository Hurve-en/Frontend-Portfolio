/* App Module - Orchestrator for form events and initialization */

const App = (() => {
  // Form elements
  let form;
  let formInputs;
  let formStatus;
  let btnSubmit;
  let isFormValid = false;

  // Initialize app
  function init() {
    form = document.getElementById("validationForm");
    formInputs = form.querySelectorAll(".form-input");
    formStatus = document.getElementById("formStatus");
    btnSubmit = form.querySelector(".btn-submit");

    setupEventListeners();
    setupSmoothScroll();
    setupNavbarScroll();
    console.log("🔐 FormVault loaded successfully!");
  }

  // Setup validation event listeners
  function setupEventListeners() {
    formInputs.forEach((input) => {
      // Real-time validation
      input.addEventListener("input", () => {
        Validators.validateField(input);
      });

      input.addEventListener("change", () => {
        Validators.validateField(input);
      });

      input.addEventListener("blur", () => {
        Validators.validateField(input);
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
    form.addEventListener("submit", handleFormSubmit);
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate all fields
    if (!Validators.validateForm(formInputs)) {
      console.log("Form validation failed");
      return;
    }

    // Show loading state
    UI.setButtonLoading(btnSubmit, true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save form data to storage
    const formData = new FormData(form);
    Storage.saveFormData(Object.fromEntries(formData));

    // Hide form and show success message
    UI.showFormStatus(true);

    // Log form data
    console.log("Form submitted successfully!");
    console.log("Form data:", Object.fromEntries(formData));

    // Reset button state
    UI.setButtonLoading(btnSubmit, false);
  }

  // Setup smooth scrolling for anchor links
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        Utils.goTo(this.getAttribute("href"));
      });
    });
  }

  // Add shadow to navbar on scroll
  function setupNavbarScroll() {
    window.addEventListener("scroll", () => {
      const navbar = document.querySelector(".navbar");
      if (window.pageYOffset > 50) {
        navbar.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.1)";
      } else {
        navbar.style.boxShadow = "none";
      }
    });
  }

  // Global function to reset form (can be called from HTML buttons)
  window.resetForm = function () {
    UI.resetForm(formInputs);
  };

  // Public API
  return {
    init,
  };
})();

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
