import "../../css/main.css";
import { api, ApiError } from "../core/api.js";
import { AUTH_ROUTES } from "../core/config.js";
import { setSession, redirectIfAuthenticated } from "../core/session.js";
import { resolvePostLoginDestination } from "../core/flow.js";
import { showToast } from "../components/toast.js";

redirectIfAuthenticated();

const initialParams = new URLSearchParams(location.search);
if (initialParams.get("registered") === "1") {
  showToast("Account created. Log in to continue.", { variant: "success" });
  const emailField = document.getElementById("email");
  const prefill = initialParams.get("email");
  if (prefill) emailField.value = prefill;
}

const form = document.getElementById("login-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const formError = document.getElementById("form-error");

function clearErrors() {
  formError.classList.add("hidden");
  formError.textContent = "";
  document.getElementById("email-error").classList.add("hidden");
  document.getElementById("password-error").classList.add("hidden");
}

function fieldError(id, message) {
  const el = document.getElementById(`${id}-error`);
  el.textContent = message;
  el.classList.remove("hidden");
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitLabel.textContent = loading ? "Logging in…" : "Log in";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  let hasError = false;
  if (!email) {
    fieldError("email", "Email is required.");
    hasError = true;
  }
  if (!password) {
    fieldError("password", "Password is required.");
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);
  try {
    const data = await api.post(AUTH_ROUTES.login, { email, password }, { auth: false });
    setSession(data.token, data.user);

    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    location.href = next && next.startsWith("/") ? next : await resolvePostLoginDestination();
  } catch (err) {
    if (err instanceof ApiError) {
      formError.textContent = err.message;
    } else {
      formError.textContent = "Something went wrong. Please try again.";
    }
    formError.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
});
