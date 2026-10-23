import "../../css/main.css";
import { api, ApiError } from "../core/api.js";
import { GITHUB_ROUTES } from "../core/config.js";
import { requireAuth } from "../core/session.js";
import { renderNavbar } from "../components/navbar.js";
import { showToast } from "../components/toast.js";

requireAuth();
renderNavbar();

const form = document.getElementById("connect-form");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const formError = document.getElementById("form-error");

function clearErrors() {
  formError.classList.add("hidden");
  formError.textContent = "";
  ["githubUsername", "githubToken"].forEach((id) => {
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
  submitLabel.textContent = loading ? "Connecting…" : "Connect account";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const githubUsername = document.getElementById("githubUsername").value.trim();
  const githubToken = document.getElementById("githubToken").value.trim();

  let hasError = false;
  if (!githubUsername) {
    fieldError("githubUsername", "GitHub username is required.");
    hasError = true;
  }
  if (!githubToken) {
    fieldError("githubToken", "Personal access token is required.");
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);
  try {
    const data = await api.post(GITHUB_ROUTES.connect, { githubUsername, githubToken });
    showToast(data.message || "GitHub account connected.", { variant: "success" });
    location.href = "/repositories.html";
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      showToast(err.message, { variant: "info" });
      location.href = "/repositories.html";
      return;
    }
    if (err instanceof ApiError && err.status === 401) {
      fieldError("githubToken", err.message);
    } else if (err instanceof ApiError && err.status === 400) {
      fieldError("githubUsername", err.message);
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
