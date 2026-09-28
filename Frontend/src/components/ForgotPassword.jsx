import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/ForgotPassword.css";

import geekaLogo from "../assets/logo.png";
import forgotPassImage from "../assets/ForgotPass.png";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";

function Logo() {
    return (
        <Link
            to="/"
            className="forgot-logo-link"
        >
            <img
                src={geekaLogo}
                alt="Geeka"
                className="forgot-logo-image"
            />
        </Link>
    );
}

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="forgot-arrow-icon"
        >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

function EyeIcon({ hidden = false }) {
    return hidden ? (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="forgot-eye-icon"
        >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.1A10.9 10.9 0 0 1 12 4.9c5.4 0 9 5.1 9 7.1a9.7 9.7 0 0 1-2.4 3.6" />
            <path d="M6.2 6.4C4.2 7.8 3 10.1 3 12c0 2 3.6 7.1 9 7.1 1.4 0 2.7-.3 3.8-.8" />
        </svg>
    ) : (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="forgot-eye-icon"
        >
            <path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6Z" />
            <circle
                cx="12"
                cy="12"
                r="2.5"
            />
        </svg>
    );
}

function getApiError(data, fallbackMessage) {
    if (!data) return fallbackMessage;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.error) return data.error;

    if (
        data.errors &&
        typeof data.errors === "object"
    ) {
        const messages = [];

        Object.values(data.errors).forEach(
            (value) => {
                if (Array.isArray(value)) {
                    messages.push(...value);
                } else if (
                    typeof value ===
                    "string"
                ) {
                    messages.push(value);
                }
            }
        );

        if (messages.length) {
            return messages.join(" ");
        }
    }

    if (
        Array.isArray(
            data.non_field_errors
        )
    ) {
        return data.non_field_errors.join(
            " "
        );
    }

    return fallbackMessage;
}

export default function ForgotPassword() {
    const [step, setStep] =
        useState("email");

    const [email, setEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    function clearMessages() {
        setError("");
        setMessage("");
    }

    async function getCsrfToken() {
        const response =
            await fetch(
                `${API_URL}/api/v1/auth/csrf/`,
                {
                    method: "GET",
                    credentials:
                        "include",
                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        let data = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                "Unable to initialize password recovery."
            );
        }

        if (!data.csrfToken) {
            throw new Error(
                "CSRF token was not received from the server."
            );
        }

        return data.csrfToken;
    }

    async function handleEmailSubmit(event) {
        event.preventDefault();

        clearMessages();

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanEmail) {
            setError(
                "Please enter your email address."
            );
            return;
        }

        setLoading(true);

        try {
            const csrfToken =
                await getCsrfToken();

            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/password-reset/request/`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                            "X-CSRFToken":
                                csrfToken,
                        },
                        body: JSON.stringify({
                            email: cleanEmail,
                        }),
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    getApiError(
                        data,
                        "Unable to request a password reset."
                    )
                );
            }

            setEmail(cleanEmail);
            setOtp("");

            setMessage(
                "If an account exists for this email, a verification code has been sent."
            );

            setStep("otp");
        } catch (err) {
            console.error(
                "Password reset request error:",
                err
            );

            setError(
                err instanceof TypeError
                    ? "Unable to connect to the Geeka server. Please try again."
                    : err.message ||
                    "Unable to request a password reset."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleOtpSubmit(event) {
        event.preventDefault();

        clearMessages();

        const cleanOtp =
            otp.trim();

        if (!/^\d{6}$/.test(cleanOtp)) {
            setError(
                "Enter the 6-digit verification code."
            );
            return;
        }

        setLoading(true);

        try {
            const csrfToken =
                await getCsrfToken();

            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/password-reset/verify/`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                            "X-CSRFToken":
                                csrfToken,
                        },
                        body: JSON.stringify({
                            email,
                            otp: cleanOtp,
                        }),
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    getApiError(
                        data,
                        "The verification code is invalid or expired."
                    )
                );
            }

            setStep("password");
        } catch (err) {
            console.error(
                "Password reset verification error:",
                err
            );

            setError(
                err instanceof TypeError
                    ? "Unable to connect to the Geeka server. Please try again."
                    : err.message ||
                    "Unable to verify the code."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();

        clearMessages();

        if (
            !password ||
            !confirmPassword
        ) {
            setError(
                "Please fill in both password fields."
            );
            return;
        }

        if (password.length < 8) {
            setError(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {
            const csrfToken =
                await getCsrfToken();

            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/password-reset/confirm/`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                            "X-CSRFToken":
                                csrfToken,
                        },
                        body: JSON.stringify({
                            email,
                            otp: otp.trim(),
                            password,
                            password_confirm:
                                confirmPassword,
                        }),
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    getApiError(
                        data,
                        "Unable to reset your password. Please try again."
                    )
                );
            }

            setPassword("");
            setConfirmPassword("");

            setStep("success");
        } catch (err) {
            console.error(
                "Password reset confirmation error:",
                err
            );

            setError(
                err instanceof TypeError
                    ? "Unable to connect to the Geeka server. Please try again."
                    : err.message ||
                    "Unable to reset your password."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="forgot-page">
            <section className="forgot-auth-layout">

                {/* =========================
                    LEFT SIDE
                ========================= */}

                <div className="forgot-form-side">

                    <Link
                        to="/"
                        className="forgot-back-store"
                    >
                        <span>←</span>
                        Back to Store
                    </Link>

                    <div className="forgot-form-wrapper">

                        <Logo />

                        {/* =========================
                            STEP 1 — EMAIL
                        ========================= */}

                        {step === "email" && (
                            <>
                                <span className="forgot-eyebrow">
                                    ACCOUNT RECOVERY
                                </span>

                                <h1>
                                    Forgot your
                                    <br />
                                    password?
                                </h1>

                                <p className="forgot-description">
                                    Enter your email address and we'll
                                    send you a verification code to
                                    reset your password.
                                </p>

                                <form
                                    className="forgot-form"
                                    onSubmit={
                                        handleEmailSubmit
                                    }
                                >

                                    <div className="forgot-field">

                                        <label htmlFor="forgot-email">
                                            EMAIL ADDRESS
                                        </label>

                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(
                                                    event.target.value
                                                );
                                                clearMessages();
                                            }}
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            disabled={loading}
                                            required
                                        />

                                    </div>

                                    {error && (
                                        <span
                                            className="forgot-error"
                                            role="alert"
                                        >
                                            {error}
                                        </span>
                                    )}

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                        disabled={loading}
                                    >
                                        <span>
                                            {loading
                                                ? "SENDING..."
                                                : "SEND VERIFICATION CODE"}
                                        </span>

                                        <ArrowIcon />
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 2 — OTP
                        ========================= */}

                        {step === "otp" && (
                            <>
                                <span className="forgot-eyebrow">
                                    VERIFY YOUR EMAIL
                                </span>

                                <h1>
                                    Enter the
                                    <br />
                                    verification code.
                                </h1>

                                <p className="forgot-description">
                                    We've sent a 6-digit code to{" "}
                                    <strong>
                                        {email}
                                    </strong>.
                                </p>

                                {message && (
                                    <span className="forgot-message">
                                        {message}
                                    </span>
                                )}

                                <form
                                    className="forgot-form"
                                    onSubmit={
                                        handleOtpSubmit
                                    }
                                >

                                    <div className="forgot-field">

                                        <label htmlFor="forgot-otp">
                                            VERIFICATION CODE
                                        </label>

                                        <input
                                            id="forgot-otp"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(event) =>
                                                setOtp(
                                                    event.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            6
                                                        )
                                                )
                                            }
                                            placeholder="Enter 6-digit code"
                                            autoComplete="one-time-code"
                                            disabled={loading}
                                            required
                                        />

                                    </div>

                                    {error && (
                                        <span
                                            className="forgot-error"
                                            role="alert"
                                        >
                                            {error}
                                        </span>
                                    )}

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                        disabled={loading}
                                    >
                                        <span>
                                            {loading
                                                ? "VERIFYING..."
                                                : "VERIFY CODE"}
                                        </span>

                                        <ArrowIcon />
                                    </button>

                                    <button
                                        type="button"
                                        className="forgot-secondary-button"
                                        onClick={() => {
                                            setOtp("");
                                            clearMessages();
                                            setStep("email");
                                        }}
                                        disabled={loading}
                                    >
                                        Change email address
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 3 — NEW PASSWORD
                        ========================= */}

                        {step === "password" && (
                            <>
                                <span className="forgot-eyebrow">
                                    CREATE NEW PASSWORD
                                </span>

                                <h1>
                                    Create a new
                                    <br />
                                    password.
                                </h1>

                                <p className="forgot-description">
                                    Choose a new password for your Geeka
                                    account.
                                </p>

                                <form
                                    className="forgot-form"
                                    onSubmit={
                                        handlePasswordSubmit
                                    }
                                >

                                    <div className="forgot-field">

                                        <label htmlFor="new-password">
                                            NEW PASSWORD
                                        </label>

                                        <div className="forgot-password-input">

                                            <input
                                                id="new-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={password}
                                                onChange={(event) => {
                                                    setPassword(
                                                        event.target.value
                                                    );
                                                    clearMessages();
                                                }}
                                                placeholder="Enter your new password"
                                                autoComplete="new-password"
                                                disabled={loading}
                                                required
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (current) =>
                                                            !current
                                                    )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                                disabled={loading}
                                            >
                                                <EyeIcon
                                                    hidden={
                                                        showPassword
                                                    }
                                                />
                                            </button>

                                        </div>

                                    </div>

                                    <div className="forgot-field">

                                        <label htmlFor="confirm-password">
                                            CONFIRM PASSWORD
                                        </label>

                                        <div className="forgot-password-input">

                                            <input
                                                id="confirm-password"
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                value={
                                                    confirmPassword
                                                }
                                                onChange={(event) => {
                                                    setConfirmPassword(
                                                        event.target.value
                                                    );
                                                    clearMessages();
                                                }}
                                                placeholder="Confirm your new password"
                                                autoComplete="new-password"
                                                disabled={loading}
                                                required
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        (current) =>
                                                            !current
                                                    )
                                                }
                                                aria-label={
                                                    showConfirmPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                                disabled={loading}
                                            >
                                                <EyeIcon
                                                    hidden={
                                                        showConfirmPassword
                                                    }
                                                />
                                            </button>

                                        </div>

                                        {confirmPassword &&
                                            password !==
                                            confirmPassword && (
                                                <span className="forgot-error">
                                                    Passwords do not match.
                                                </span>
                                            )}

                                    </div>

                                    {error && (
                                        <span
                                            className="forgot-error"
                                            role="alert"
                                        >
                                            {error}
                                        </span>
                                    )}

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                        disabled={
                                            loading ||
                                            !password ||
                                            !confirmPassword ||
                                            password !==
                                            confirmPassword
                                        }
                                    >
                                        <span>
                                            {loading
                                                ? "RESETTING..."
                                                : "RESET PASSWORD"}
                                        </span>

                                        <ArrowIcon />
                                    </button>

                                </form>
                            </>
                        )}

                        {/* =========================
                            STEP 4 — SUCCESS
                        ========================= */}

                        {step === "success" && (
                            <div className="forgot-success">

                                <div className="forgot-success-mark">
                                    ✓
                                </div>

                                <span className="forgot-eyebrow">
                                    PASSWORD UPDATED
                                </span>

                                <h1>
                                    You're all
                                    <br />
                                    set.
                                </h1>

                                <p className="forgot-description">
                                    Your password has been successfully
                                    changed. You can now sign in to your
                                    Geeka account.
                                </p>

                                <Link
                                    to="/login"
                                    className="forgot-submit-button forgot-login-button"
                                >
                                    <span>
                                        BACK TO SIGN IN
                                    </span>

                                    <ArrowIcon />
                                </Link>

                            </div>
                        )}

                        {/* =========================
                            LOGIN LINK
                        ========================= */}

                        {step !== "success" && (
                            <div className="forgot-login-link">

                                <span>
                                    Remember your password?
                                </span>

                                <Link to="/login">
                                    Sign in
                                    <span> →</span>
                                </Link>

                            </div>
                        )}

                        <p className="forgot-terms">
                            By continuing, you agree to our Terms &
                            Conditions and Privacy Policy.
                        </p>

                    </div>
                </div>

                {/* =========================
                    RIGHT IMAGE SIDE
                ========================= */}

                <div
                    className="forgot-image-side"
                    style={{
                        backgroundImage:
                            `url(${forgotPassImage})`,
                    }}
                >

                    <div className="forgot-image-top">

                        <span>
                            GEEKA
                        </span>

                        <span>
                            EST. 2026
                        </span>

                    </div>

                    <div className="forgot-image-overlay">

                        <div className="forgot-image-copy">

                            <span className="forgot-image-eyebrow">
                                A FRESH START.
                            </span>

                            <h2>
                                Begins
                                <br />
                                <em>Here.</em>
                            </h2>

                            <p>
                                Reset your password and return to
                                everything you love about Geeka.
                            </p>

                            <div className="forgot-image-line" />

                        </div>

                    </div>

                    <div className="forgot-image-decoration">
                        <span />
                        <span />
                        <span />
                    </div>

                </div>

            </section>
        </main>
    );
}