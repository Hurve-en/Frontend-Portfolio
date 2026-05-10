/* Storage Module - Handle form data persistence */

const Storage = (() => {
  const STORAGE_KEY = "formValidatorData";

  // Save form data
  function saveFormData(formData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      return true;
    } catch (error) {
      console.error("Failed to save form data:", error);
      return false;
    }
  }

  // Load form data
  function loadFormData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load form data:", error);
      return null;
    }
  }

  // Clear form data
  function clearFormData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear form data:", error);
      return false;
    }
  }

  // Public API
  return {
    saveFormData,
    loadFormData,
    clearFormData,
  };
})();
