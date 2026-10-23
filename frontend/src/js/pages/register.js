import "../../css/main.css";
import { api, ApiError } from "../core/api.js";
import { AUTH_ROUTES } from "../core/config.js";
import { redirectIfAuthenticated } from "../core/session.js";

redirectIfAuthenticated();

const form = document.getElementById("register-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const formError = document.getElementById("form-error");

function clearErrors() {
  formError.classList.add("hidden");
  formError.textContent = "";
  ["name", "email", "password"].forEach((id) => {
    const el = document.getElementById(`${id}-error`);
    el.classList.add("hidden");
    el.textContent = "";
  });
}

function fieldError(id, message) {
  const el = document.getElementById(`${id}-error`);
  el.textContent = message;
  el.classList.remove("hidden");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitLabel.textContent = loading ? "Creating account…" : "Create account";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  let hasError = false;
  if (!name) {
    fieldError("name", "Name is required.");
    hasError = true;
  }
  if (!email) {
    fieldError("email", "Email is required.");
    hasError = true;
  }
  if (!password) {
    fieldError("password", "Password is required.");
    hasError = true;
  } else if (password.length < 8) {
    fieldError("password", "Use at least 8 characters.");
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);
  try {
    await api.post(AUTH_ROUTES.register, { name, email, password }, { auth: false });
    location.href = `/index.html?registered=1&email=${encodeURIComponent(email)}`;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      fieldError("email", err.message);
    } else if (err instanceof ApiError) {
      formError.textContent = err.message;
      formError.classList.remove("hidden");
    } else {
      formError.textContent = "Something went wrong. Please try again.";
      formError.classList.remove("hidden");
    }
  } finally {
    setLoading(false);
  }
});
