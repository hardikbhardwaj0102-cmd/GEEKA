import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Register.css";

import registerBackground from "../assets/register.png";
import geekaLogo from "../assets/logo.png";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";

/*
|--------------------------------------------------------------------------
| LOGO
|--------------------------------------------------------------------------
*/

function Logo() {
    return (
        <div className="register-logo">
            <img
                src={geekaLogo}
                alt="Geeka"
                className="register-logo-image"
            />
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| EYE ICON
|--------------------------------------------------------------------------
*/

function EyeIcon({ visible }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            {visible ? (
                <>
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

                    <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                    />
                </>
            ) : (
                <>
                    <path d="M3 3l18 18" />

                    <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.6" />

                    <path d="M6.3 6.4C3.8 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.3 4-.8" />
                </>
            )}
        </svg>
    );
}

/*
|--------------------------------------------------------------------------
| ARROW ICON
|--------------------------------------------------------------------------
*/

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M4 12h15" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

/*
|--------------------------------------------------------------------------
| API ERROR HANDLER
|--------------------------------------------------------------------------
*/

function getApiError(
    data,
    fallbackMessage
) {
    if (!data) {
        return fallbackMessage;
    }

    if (typeof data === "string") {
        return data;
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.message) {
        return data.message;
    }

    if (data.error) {
        return data.error;
    }

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
                    typeof value === "string"
                ) {
                    messages.push(value);
                }
            }
        );

        if (messages.length > 0) {
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

/*
|--------------------------------------------------------------------------
| MAIN REGISTER
|--------------------------------------------------------------------------
*/

export default function Register() {
    const navigate = useNavigate();

    /*
     * Correct backend-compatible flow:
     *
     * email → details → otp
     */
    const [step, setStep] =
        useState("email");

    const [email, setEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [name, setName] =
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

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    /*
    |--------------------------------------------------------------------------
    | CLEAR MESSAGES
    |--------------------------------------------------------------------------
    */

    const clearMessages = () => {
        setError("");
        setMessage("");
    };

    /*
    |--------------------------------------------------------------------------
    | EMAIL VALIDATION
    |--------------------------------------------------------------------------
    */

    const isValidEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value.trim()
        );
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 1 — EMAIL
    |--------------------------------------------------------------------------
    */

    const handleEmailSubmit = (event) => {
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

        if (!isValidEmail(cleanEmail)) {
            setError(
                "Please enter a valid email address."
            );
            return;
        }

        setEmail(cleanEmail);

        /*
         * The backend register endpoint needs:
         * email + full_name + password + password_confirm
         *
         * So account details are collected before
         * making the register API request.
         */
        setStep("details");
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 2 — CREATE ACCOUNT
    |--------------------------------------------------------------------------
    |
    | POST /api/v1/auth/register/
    |
    | {
    |     email,
    |     full_name,
    |     password,
    |     password_confirm
    | }
    |
    | Backend creates an unverified account and
    | sends the verification OTP.
    |
    */

    const handleRegister = async (event) => {
        event.preventDefault();

        clearMessages();

        const cleanName =
            name.trim();

        if (!cleanName) {
            setError(
                "Please enter your full name."
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
            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/register/`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body: JSON.stringify({
                            email,
                            full_name:
                                cleanName,
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
                        "Unable to create your account. Please check your details and try again."
                    )
                );
            }

            /*
             * Backend has sent the verification OTP.
             */
            setOtp("");

            setMessage(
                "We've sent a verification code to your email."
            );

            setStep("otp");
        } catch (err) {
            console.error(
                "Registration error:",
                err
            );

            if (
                err instanceof TypeError
            ) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to create your account."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 3 — VERIFY OTP
    |--------------------------------------------------------------------------
    |
    | POST /api/v1/auth/verify-email/
    |
    | {
    |     email,
    |     otp
    | }
    |
    */

    const handleOtpSubmit = async (event) => {
        event.preventDefault();

        clearMessages();

        const cleanOtp =
            otp.trim();

        if (!cleanOtp) {
            setError(
                "Please enter the verification code."
            );
            return;
        }

        if (!/^\d{6}$/.test(cleanOtp)) {
            setError(
                "Enter the 6-digit verification code."
            );
            return;
        }

        setLoading(true);

        try {
            const response =
                await fetch(
                    `${API_URL}/api/v1/auth/verify-email/`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
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

            /*
             * Account is now verified.
             */
            navigate("/login", {
                replace: true,
                state: {
                    message:
                        "Account created successfully. Please sign in.",
                },
            });
        } catch (err) {
            console.error(
                "Email verification error:",
                err
            );

            if (
                err instanceof TypeError
            ) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to verify your email."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RESEND OTP
    |--------------------------------------------------------------------------
    |
    | Your backend contract does not currently define
    | a resend-verification-OTP endpoint.
    |
    | We therefore don't make up an API call here.
    |
    */

    const handleResendOtp = () => {
        clearMessages();

        setError(
            "The current API does not provide a resend verification-code endpoint."
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CHANGE EMAIL
    |--------------------------------------------------------------------------
    */

    const handleChangeEmail = () => {
        clearMessages();

        setOtp("");

        setStep("email");
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <main className="register-page">

            {/* =================================================
                LEFT PANEL
            ================================================= */}

            <section className="register-panel">

                <div className="register-top">

                    <Link
                        to="/"
                        className="register-back"
                    >
                        <span>
                            ←
                        </span>

                        Back to Store
                    </Link>

                </div>

                <div className="register-content">

                    {/* =================================================
                        GEEKA LOGO
                    ================================================= */}

                    <Link
                        to="/"
                        className="register-brand-link"
                        aria-label="Go to Geeka home"
                    >
                        <Logo />
                    </Link>

                    {/* =================================================
                        STEP 1 — EMAIL
                    ================================================= */}

                    {step === "email" && (
                        <>
                            <div className="register-heading">

                                <span className="register-eyebrow">
                                    CREATE YOUR ACCOUNT
                                </span>

                                <h1>
                                    Join the
                                    <br />
                                    GEEKA family.
                                </h1>

                                <p>
                                    Start your journey with handmade
                                    jewellery and thoughtfully crafted
                                    ethical wear.
                                </p>

                            </div>

                            <form
                                className="register-form"
                                onSubmit={
                                    handleEmailSubmit
                                }
                            >

                                <div className="register-field">

                                    <label htmlFor="email">
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
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
                                        autoFocus
                                        required
                                    />

                                </div>

                                {error && (
                                    <div
                                        className="register-message register-error"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="register-submit"
                                    disabled={loading}
                                >
                                    <span>
                                        CONTINUE
                                    </span>

                                    <span className="register-submit-arrow">
                                        <ArrowIcon />
                                    </span>
                                </button>

                            </form>
                        </>
                    )}

                    {/* =================================================
                        STEP 2 — DETAILS
                    ================================================= */}

                    {step === "details" && (
                        <>
                            <div className="register-heading">

                                <span className="register-eyebrow">
                                    ACCOUNT DETAILS
                                </span>

                                <h1>
                                    Complete your
                                    <br />
                                    account.
                                </h1>

                                <p>
                                    Just a few details and your GEEKA
                                    account will be ready.
                                </p>

                            </div>

                            <form
                                className="register-form register-details-form"
                                onSubmit={
                                    handleRegister
                                }
                            >

                                {/* NAME */}

                                <div className="register-field">

                                    <label htmlFor="name">
                                        Full Name
                                    </label>

                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(event) => {
                                            setName(
                                                event.target.value
                                            );
                                            clearMessages();
                                        }}
                                        placeholder="Enter your full name"
                                        autoComplete="name"
                                        autoFocus
                                        disabled={loading}
                                        required
                                    />

                                </div>

                                {/* VERIFIED EMAIL */}

                                <div className="register-field">

                                    <label>
                                        Email Address
                                    </label>

                                    <div className="register-verified-email">

                                        <span>
                                            {email}
                                        </span>

                                        <span className="verified-badge">
                                            VERIFIED
                                        </span>

                                    </div>

                                </div>

                                {/* PASSWORD */}

                                <div className="register-field">

                                    <label htmlFor="password">
                                        Password
                                    </label>

                                    <div className="register-password-wrapper">

                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                password
                                            }
                                            onChange={(event) => {
                                                setPassword(
                                                    event.target.value
                                                );
                                                clearMessages();
                                            }}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="register-password-toggle"
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
                                                visible={
                                                    showPassword
                                                }
                                            />
                                        </button>

                                    </div>

                                </div>

                                {/* CONFIRM PASSWORD */}

                                <div className="register-field">

                                    <label htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>

                                    <div className="register-password-wrapper">

                                        <input
                                            id="confirmPassword"
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
                                            placeholder="Confirm your password"
                                            autoComplete="new-password"
                                            disabled={loading}
                                            required
                                        />

                                        <button
                                            type="button"
                                            className="register-password-toggle"
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
                                                visible={
                                                    showConfirmPassword
                                                }
                                            />
                                        </button>

                                    </div>

                                </div>

                                {/* TERMS */}

                                <label className="register-terms">

                                    <input
                                        type="checkbox"
                                        required
                                        disabled={loading}
                                    />

                                    <span className="register-custom-checkbox">
                                        <span />
                                    </span>

                                    <span className="register-terms-text">

                                        I agree to the{" "}

                                        <a href="#terms">
                                            Terms & Conditions
                                        </a>

                                        {" "}and{" "}

                                        <a href="#privacy">
                                            Privacy Policy
                                        </a>

                                        .

                                    </span>

                                </label>

                                {error && (
                                    <div
                                        className="register-message register-error"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="register-submit"
                                    disabled={loading}
                                >

                                    <span>
                                        {loading
                                            ? "CREATING ACCOUNT..."
                                            : "CREATE ACCOUNT"}
                                    </span>

                                    {!loading && (
                                        <span className="register-submit-arrow">
                                            <ArrowIcon />
                                        </span>
                                    )}

                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleChangeEmail
                                    }
                                    className="register-change-email"
                                    disabled={loading}
                                >
                                    Change email
                                </button>

                            </form>
                        </>
                    )}

                    {/* =================================================
                        STEP 3 — OTP
                    ================================================= */}

                    {step === "otp" && (
                        <>
                            <div className="register-heading">

                                <span className="register-eyebrow">
                                    VERIFY YOUR EMAIL
                                </span>

                                <h1>
                                    Check your
                                    <br />
                                    inbox.
                                </h1>

                                <p>
                                    We've sent a 6-digit verification
                                    code to{" "}

                                    <strong>
                                        {email}
                                    </strong>

                                    .
                                </p>

                            </div>

                            <form
                                className="register-form"
                                onSubmit={
                                    handleOtpSubmit
                                }
                            >

                                <div className="register-field">

                                    <label htmlFor="otp">
                                        Verification Code
                                    </label>

                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value
                                                    .replace(
                                                        /\D/g,
                                                        ""
                                                    )
                                                    .slice(
                                                        0,
                                                        6
                                                    );

                                            setOtp(
                                                value
                                            );

                                            clearMessages();
                                        }}
                                        placeholder="Enter 6-digit code"
                                        autoComplete="one-time-code"
                                        className="register-otp-input"
                                        autoFocus
                                        disabled={loading}
                                    />

                                </div>

                                {message && (
                                    <div className="register-message register-success">
                                        {message}
                                    </div>
                                )}

                                {error && (
                                    <div
                                        className="register-message register-error"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="register-submit"
                                    disabled={loading}
                                >

                                    <span>
                                        {loading
                                            ? "VERIFYING..."
                                            : "VERIFY EMAIL"}
                                    </span>

                                    {!loading && (
                                        <span className="register-submit-arrow">
                                            <ArrowIcon />
                                        </span>
                                    )}

                                </button>

                                <div className="register-otp-actions">

                                    <button
                                        type="button"
                                        onClick={
                                            handleResendOtp
                                        }
                                        className="register-resend"
                                        disabled={loading}
                                    >
                                        Resend code
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleChangeEmail
                                        }
                                        className="register-change-email"
                                        disabled={loading}
                                    >
                                        Change email
                                    </button>

                                </div>

                            </form>
                        </>
                    )}

                    {/* =================================================
                        LOGIN LINK
                    ================================================= */}

                    <div className="register-login">

                        <span>
                            Already have an account?
                        </span>

                        <Link to="/login">

                            Sign in

                            <ArrowIcon />

                        </Link>

                    </div>

                    <div className="register-footer-note">

                        By continuing, you agree to our{" "}

                        <span>
                            Terms & Conditions
                        </span>

                        {" "}and{" "}

                        <span>
                            Privacy Policy
                        </span>

                        .

                    </div>

                </div>
            </section>

            {/* =================================================
                RIGHT VISUAL
            ================================================= */}

            <section className="register-visual">

                <img
                    src={registerBackground}
                    alt="GEEKA handmade jewellery and ethical fashion"
                    className="register-visual-image"
                />

                <div className="register-visual-overlay" />

                <div className="register-visual-top">

                    <span>
                        GEEKA
                    </span>

                    <span>
                        EST. 2026
                    </span>

                </div>

                <div className="register-visual-content">

                    <span className="register-visual-eyebrow">
                        HANDMADE WITH PURPOSE
                    </span>

                    <h2>
                        Made to be
                        <br />
                        <em>uniquely yours.</em>
                    </h2>

                    <p>
                        Handmade artificial jewellery and ethical
                        wear for women who choose style with purpose.
                    </p>

                    <div className="register-visual-line" />

                </div>

                <div className="register-floral">

                    <svg
                        viewBox="0 0 160 240"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                        <path
                            d="M20 237C34 184 63 132 111 94C130 79 140 52 143 19"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                        <path
                            d="M49 179C31 164 21 142 22 119"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                        <path
                            d="M65 153C84 148 98 135 104 118"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                        <path
                            d="M83 128C67 111 67 93 75 77"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                        <path
                            d="M105 96C121 92 133 82 139 68"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                        <path
                            d="M113 84C99 68 100 50 110 37"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                    </svg>

                </div>

            </section>

        </main>
    );
}