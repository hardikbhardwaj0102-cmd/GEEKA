import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/ForgotPassword.css";

import forgotPasswordBackground from "../assets/ForgotPass.png";
import logo from "../assets/logo.png";

/*
|--------------------------------------------------------------------------
| API CONFIGURATION
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL || "https://geeka-backend.onrender.com";

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD COMPONENT
|--------------------------------------------------------------------------
*/

export default function ForgotPassword() {
    const navigate = useNavigate();

    /*
     * Steps:
     *
     * email
     * otp
     * password
     * success
     */

    const [step, setStep] = useState("email");

    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        password: "",
        passwordConfirm: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    /*
    |--------------------------------------------------------------------------
    | HANDLE INPUT
    |--------------------------------------------------------------------------
    */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (error) {
            setError("");
        }

        if (successMessage) {
            setSuccessMessage("");
        }
    };

    /*
    |--------------------------------------------------------------------------
    | GET CSRF TOKEN
    |--------------------------------------------------------------------------
    */

    const getCsrfToken = async () => {
        const response = await fetch(`${API_URL}/api/v1/auth/csrf/`, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data?.detail ||
                data?.message ||
                "Unable to initialize secure password reset."
            );
        }

        if (!data?.csrfToken) {
            throw new Error("CSRF token was not received from the server.");
        }

        return data.csrfToken;
    };

    /*
    |--------------------------------------------------------------------------
    | EXTRACT API ERROR
    |--------------------------------------------------------------------------
    */

    const getApiError = (data, fallbackMessage) => {
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

        if (data.errors && typeof data.errors === "object") {
            const messages = [];

            Object.entries(data.errors).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((message) => {
                        messages.push(message);
                    });
                } else if (typeof value === "string") {
                    messages.push(value);
                }
            });

            if (messages.length > 0) {
                return messages.join(" ");
            }
        }

        if (Array.isArray(data.non_field_errors)) {
            return data.non_field_errors.join(" ");
        }

        return fallbackMessage;
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 1 — REQUEST PASSWORD RESET OTP
    |--------------------------------------------------------------------------
    */

    const handleEmailSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        const email = formData.email.trim().toLowerCase();

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);

        try {
            /*
             * Password reset request requires CSRF.
             */
            const csrfToken = await getCsrfToken();

            const response = await fetch(
                `${API_URL}/api/v1/auth/password-reset/request/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRFToken": csrfToken,
                    },
                    body: JSON.stringify({
                        email,
                    }),
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    getApiError(
                        data,
                        "Unable to process the password reset request."
                    )
                );
            }

            /*
             * The backend contract intentionally returns a generic
             * response regardless of whether the email exists.
             */

            setFormData((previous) => ({
                ...previous,
                email,
            }));

            setSuccessMessage(
                "If an account exists for this email, a verification code has been sent."
            );

            setStep("otp");
        } catch (err) {
            console.error("Password reset request error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to request a password reset. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 2 — VERIFY OTP
    |--------------------------------------------------------------------------
    */

    const handleOtpSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        const otp = formData.otp.trim();

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter the 6-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(
                `${API_URL}/api/v1/auth/password-reset/verify/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRFToken": csrfToken,
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        otp,
                    }),
                }
            );

            let data = {};

            try {
                data = await response.json();
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
            console.error("Password reset OTP verification error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to verify the code. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 3 — SET NEW PASSWORD
    |--------------------------------------------------------------------------
    */

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccessMessage("");

        const password = formData.password;
        const passwordConfirm = formData.passwordConfirm;

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const csrfToken = await getCsrfToken();

            const response = await fetch(
                `${API_URL}/api/v1/auth/password-reset/confirm/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRFToken": csrfToken,
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        otp: formData.otp,
                        password,
                        password_confirm: passwordConfirm,
                    }),
                }
            );

            let data = {};

            try {
                data = await response.json();
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

            setStep("success");
        } catch (err) {
            console.error("Password reset confirmation error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to reset your password. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | GO TO LOGIN
    |--------------------------------------------------------------------------
    */

    const handleLoginRedirect = () => {
        navigate("/login", {
            replace: true,
            state: {
                passwordResetSuccess: true,
                message: "Your password has been reset successfully.",
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | CHANGE EMAIL
    |--------------------------------------------------------------------------
    */

    const handleChangeEmail = () => {
        setError("");
        setSuccessMessage("");

        setFormData((previous) => ({
            ...previous,
            otp: "",
            password: "",
            passwordConfirm: "",
        }));

        setStep("email");
    };

    return (
        <div
            className="forgot-password-page"
            style={{
                "--forgot-password-background-image": `url(${forgotPasswordBackground})`,
            }}
        >
            <div className="forgot-password-left">
                <div className="forgot-password-content">
                    <Link to="/" className="forgot-password-logo-link">
                        <img
                            src={logo}
                            alt="Geeka"
                            className="forgot-password-logo"
                        />
                    </Link>

                    <div className="forgot-password-heading">
                        <h1>
                            {step === "email" && "Forgot Password?"}

                            {step === "otp" && "Verify Your Email"}

                            {step === "password" && "Create New Password"}

                            {step === "success" && "Password Updated"}
                        </h1>

                        <p>
                            {step === "email" &&
                                "Enter your email and we'll help you reset your password."}

                            {step === "otp" &&
                                "Enter the verification code sent to your email."}

                            {step === "password" &&
                                "Choose a new password for your Geeka account."}

                            {step === "success" &&
                                "Your password has been changed successfully."}
                        </p>
                    </div>

                    {error && (
                        <div className="forgot-password-error" role="alert">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div
                            className="forgot-password-success"
                            role="status"
                        >
                            {successMessage}
                        </div>
                    )}

                    {/* ==========================================================
              STEP 1 — EMAIL
          ========================================================== */}

                    {step === "email" && (
                        <form
                            onSubmit={handleEmailSubmit}
                            className="forgot-password-form"
                        >
                            <div className="forgot-password-field">
                                <label htmlFor="email">Email Address</label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send Verification Code"}
                            </button>

                            <Link
                                to="/login"
                                className="forgot-password-back-link"
                            >
                                Back to Login
                            </Link>
                        </form>
                    )}

                    {/* ==========================================================
              STEP 2 — OTP
          ========================================================== */}

                    {step === "otp" && (
                        <form
                            onSubmit={handleOtpSubmit}
                            className="forgot-password-form"
                        >
                            <div className="forgot-password-otp-info">
                                <span>Verification code sent to</span>

                                <strong>{formData.email}</strong>
                            </div>

                            <div className="forgot-password-field">
                                <label htmlFor="otp">Verification Code</label>

                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    placeholder="Enter 6-digit code"
                                    inputMode="numeric"
                                    maxLength={6}
                                    autoComplete="one-time-code"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify Code"}
                            </button>

                            <button
                                type="button"
                                className="forgot-password-secondary-button"
                                onClick={handleChangeEmail}
                                disabled={loading}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {/* ==========================================================
              STEP 3 — NEW PASSWORD
          ========================================================== */}

                    {step === "password" && (
                        <form
                            onSubmit={handlePasswordSubmit}
                            className="forgot-password-form"
                        >
                            <div className="forgot-password-field">
                                <label htmlFor="password">New Password</label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />

                                <small>
                                    Password must be at least 8 characters.
                                </small>
                            </div>

                            <div className="forgot-password-field">
                                <label htmlFor="passwordConfirm">
                                    Confirm New Password
                                </label>

                                <input
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    type="password"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="forgot-password-submit"
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {/* ==========================================================
              STEP 4 — SUCCESS
          ========================================================== */}

                    {step === "success" && (
                        <div className="forgot-password-success-container">
                            <div className="forgot-password-success-icon">
                                ✓
                            </div>

                            <h2>Password Reset Successfully</h2>

                            <p>
                                Your password has been updated. You can now log in
                                using your new password.
                            </p>

                            <button
                                type="button"
                                className="forgot-password-submit"
                                onClick={handleLoginRedirect}
                            >
                                Continue to Login
                            </button>
                        </div>
                    )}

                    {step !== "success" && (
                        <div className="forgot-password-register">
                            <span>Remember your password?</span>

                            <Link to="/login">Sign In</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="forgot-password-right">
                <div className="forgot-password-image-overlay"></div>

                <div className="forgot-password-image-content">
                    <span className="forgot-password-image-small-text">
                        GEEKA
                    </span>

                    <h2>Everything you love, all in one place.</h2>

                    <p>
                        Your account keeps your Geeka experience personal,
                        simple and secure.
                    </p>
                </div>
            </div>
        </div>
    );
}