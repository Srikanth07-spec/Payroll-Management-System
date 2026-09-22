import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";

import "./Auth.css";

/* =========================
   USER ICON
========================= */
function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="field-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
    </svg>
  );
}

/* =========================
   LOCK ICON
========================= */
function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="field-icon"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* =========================
   EYE ICON
========================= */
function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="eye-icon"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c5 0 8.7 3.2 10 7-0.5 1.5-1.5 2.8-2.7 3.9" />
        <path d="M6.1 6.1C4.5 7.2 3.3 8.8 2 12c1.3 3.8 5 7 10 7 1.5 0 2.8-.3 4-.8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="eye-icon"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* =========================
   GOOGLE MULTICOLOR G
========================= */
function GoogleIcon() {
  return (
    <svg
      className="google-icon"
      viewBox="0 0 48 48"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.5 4 24 4 14.1 4 6.1 11.9 6.1 21.8S14.1 39.6 24 39.6c10.9 0 18.1-7.7 18.1-18.4 0-1.2-.1-2-.5-2.7z"
      />

      <path
        fill="#FF3D00"
        d="M6.1 14.6l6.6 4.8C14.5 16 18.8 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 7.1 29.5 5 24 5 16.3 5 9.6 9.3 6.1 14.6z"
      />

      <path
        fill="#4CAF50"
        d="M24 39.6c5.4 0 10-1.8 13.3-4.9l-6.2-5.1C29.4 31.1 26.9 32 24 32c-5.1 0-9.5-3.3-11.1-7.8l-6.5 5C9.7 35.3 16.3 39.6 24 39.6z"
      />

      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.7 5.2-6.9 6.1l6.2 5.1c-.4.4 6.4-4.7 6.4-14.4 0-1.2-.1-2.1-.4-2.8z"
      />
    </svg>
  );
}

/* =========================
   LOGIN PAGE
========================= */
export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================
     EMAIL LOGIN
  ========================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const email = username.trim();

    if (!email || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setLoading(true);

      /*
        Firebase authentication only.
        Dashboard.jsx decides whether the
        logged-in user is Admin or Employee.
      */
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else if (
        err.code === "auth/too-many-requests"
      ) {
        setError(
          "Too many login attempts. Please try again later."
        );
      } else if (
        err.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        err.code === "auth/user-disabled"
      ) {
        setError(
          "This account has been disabled. Please contact the administrator."
        );
      } else {
        setError(
          "Unable to login. Please check your credentials and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     GOOGLE LOGIN
  ========================= */
  const handleGoogleLogin = async () => {
    setError("");

    try {
      setLoading(true);

      await signInWithPopup(
        auth,
        googleProvider
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("Google login error:", err);

      if (
        err.code === "auth/popup-closed-by-user"
      ) {
        setError("Google login was cancelled.");
      } else if (
        err.code === "auth/popup-blocked"
      ) {
        setError(
          "Google login popup was blocked. Please allow popups and try again."
        );
      } else {
        setError(
          "Google login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FORGOT PASSWORD
  ========================= */
  const handleForgotPassword = async () => {
    setError("");

    const email = username.trim();

    if (!email) {
      setError(
        "Enter your email address first."
      );
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        email
      );

      setError(
        "Password reset email sent. Please check your inbox."
      );
    } catch (err) {
      console.error(
        "Password reset error:",
        err
      );

      if (
        err.code === "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        err.code === "auth/user-not-found"
      ) {
        setError(
          "No account was found with this email address."
        );
      } else {
        setError(
          "Unable to send password reset email."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">

        {/* =========================
            LEFT SIDE IMAGE
        ========================= */}
        <section
          className="auth-visual"
          aria-hidden="true"
        />

        {/* =========================
            RIGHT SIDE LOGIN
        ========================= */}
        <section className="auth-form-section">

          <div className="auth-card login-card">

            {/* TITLE */}
            <div className="auth-title-row">

              <h2>
                Login
              </h2>

              <Link
                to="/"
                className="back-home-link"
              >
                ← Back to Home
              </Link>

            </div>

            {/* DESCRIPTION */}
            <p className="form-description">
              Enter your credentials to access
              <br />
              your account
            </p>

            <form onSubmit={handleLogin}>

              {/* EMAIL */}
              <label>
                Email Address
              </label>

              <div className="input-wrapper">

                <UserIcon />

                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}
              <label>
                Password
              </label>

              <div className="input-wrapper">

                <LockIcon />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <EyeIcon
                    hidden={showPassword}
                  />
                </button>

              </div>

              {/* OPTIONS */}
              <div className="form-options">

                <label className="remember">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="link-button"
                  onClick={
                    handleForgotPassword
                  }
                  disabled={loading}
                >
                  Forgot Password?
                </button>

              </div>

              {/* ERROR / MESSAGE */}
              {error && (
                <div
                  className="auth-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                className="primary-auth-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>

            </form>

            {/* DIVIDER */}
            <div className="divider">

              <span></span>

              <b>or</b>

              <span></span>

            </div>

            {/* GOOGLE LOGIN */}
            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >

              <GoogleIcon />

              <span>
                Login with Google
              </span>

            </button>

          </div>

        </section>

      </main>
    </div>
  );
}