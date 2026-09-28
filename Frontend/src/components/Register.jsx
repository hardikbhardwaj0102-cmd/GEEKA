import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Register.css";

import registerBackground from "../assets/register.png";
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
| REGISTER COMPONENT
|--------------------------------------------------------------------------
*/

export default function Register() {
    const navigate = useNavigate();

    /*
     * Steps:
     *
     * email
     * details
     * otp
     */
    const [step, setStep] = useState("email");

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        password: "",
        passwordConfirm: "",
        otp: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [otpMessage, setOtpMessage] = useState("");

    /*
    |--------------------------------------------------------------------------
    | OTP TIMER
    |--------------------------------------------------------------------------
    */

    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (secondsLeft <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((previous) => {
                if (previous <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return previous - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

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

        if (otpMessage) {
            setOtpMessage("");
        }
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
    | STEP 1 — EMAIL
    |--------------------------------------------------------------------------
    */

    const handleEmailSubmit = (event) => {
        event.preventDefault();

        setError("");

        const email = formData.email.trim().toLowerCase();

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setFormData((previous) => ({
            ...previous,
            email,
        }));

        setStep("details");
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 2 — REGISTER ACCOUNT
    |--------------------------------------------------------------------------
    |
    | The backend registration endpoint:
    |
    | POST /api/v1/auth/register/
    |
    | {
    |   email,
    |   full_name,
    |   password,
    |   password_confirm
    | }
    |
    | The backend then sends the email verification OTP.
    |
    */

    const handleRegister = async (event) => {
        event.preventDefault();

        setError("");

        const email = formData.email.trim().toLowerCase();
        const fullName = formData.fullName.trim();
        const password = formData.password;
        const passwordConfirm = formData.passwordConfirm;

        if (!fullName) {
            setError("Please enter your full name.");
            return;
        }

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
            const response = await fetch(`${API_URL}/api/v1/auth/register/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email,
                    full_name: fullName,
                    password,
                    password_confirm: passwordConfirm,
                }),
            });

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
                        "Unable to create your account. Please check your details and try again."
                    )
                );
            }

            /*
             * Backend has created the unverified account
             * and sent the verification OTP.
             */

            setOtpMessage(
                "A verification code has been sent to your email address."
            );

            setSecondsLeft(60);
            setStep("otp");
        } catch (err) {
            console.error("Registration error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please make sure the backend is running."
                );
            } else {
                setError(
                    err.message || "Unable to create your account. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | STEP 3 — VERIFY EMAIL OTP
    |--------------------------------------------------------------------------
    */

    const handleOtpSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setOtpMessage("");

        const otp = formData.otp.trim();

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter the 6-digit verification code.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/verify-email/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp,
                }),
            });

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

            /*
             * Email is now verified.
             *
             * Send the user to login.
             */

            navigate("/login", {
                replace: true,
                state: {
                    registrationSuccess: true,
                    message:
                        "Your account has been created successfully. You can now log in.",
                },
            });
        } catch (err) {
            console.error("Email verification error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please try again."
                );
            } else {
                setError(
                    err.message ||
                    "Unable to verify your email. Please check the code and try again."
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
    | IMPORTANT:
    |
    | The backend API contract currently does NOT provide a dedicated
    | resend-verification-code endpoint.
    |
    | Therefore we do not fake a resend request here.
    |
    */

    const handleResendOtp = () => {
        setError(
            "The current API does not provide a resend verification-code endpoint. Please use the code from your latest registration email."
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CHANGE EMAIL
    |--------------------------------------------------------------------------
    */

    const handleChangeEmail = () => {
        setError("");
        setOtpMessage("");

        setFormData((previous) => ({
            ...previous,
            otp: "",
        }));

        setStep("email");
    };

    return (
        <div
            className="register-page"
            style={{
                "--register-background-image": `url(${registerBackground})`,
            }}
        >
            <div className="register-left">
                <div className="register-content">
                    <Link to="/" className="register-logo-link">
                        <img src={logo} alt="Geeka" className="register-logo" />
                    </Link>

                    <div className="register-heading">
                        <h1>Create Account</h1>
                        <p>
                            {step === "email" &&
                                "Start your journey with Geeka today."}

                            {step === "details" &&
                                "Tell us a little more about yourself."}

                            {step === "otp" &&
                                "Verify your email to complete your account."}
                        </p>
                    </div>

                    {error && (
                        <div className="register-error" role="alert">
                            {error}
                        </div>
                    )}

                    {otpMessage && (
                        <div className="register-success" role="status">
                            {otpMessage}
                        </div>
                    )}

                    {/* ==========================================================
              STEP 1 — EMAIL
          ========================================================== */}

                    {step === "email" && (
                        <form
                            onSubmit={handleEmailSubmit}
                            className="register-form"
                        >
                            <div className="register-field">
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
                                className="register-submit"
                                disabled={loading}
                            >
                                Continue
                            </button>
                        </form>
                    )}

                    {/* ==========================================================
              STEP 2 — ACCOUNT DETAILS
          ========================================================== */}

                    {step === "details" && (
                        <form
                            onSubmit={handleRegister}
                            className="register-form"
                        >
                            <div className="register-field">
                                <label htmlFor="fullName">Full Name</label>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="email">Email Address</label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    disabled={loading}
                                />
                            </div>

                            <div className="register-field">
                                <label htmlFor="password">Password</label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />

                                <small>Password must be at least 8 characters.</small>
                            </div>

                            <div className="register-field">
                                <label htmlFor="passwordConfirm">
                                    Confirm Password
                                </label>

                                <input
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    type="password"
                                    value={formData.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>

                            <button
                                type="button"
                                className="register-back-button"
                                onClick={handleChangeEmail}
                                disabled={loading}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {/* ==========================================================
              STEP 3 — OTP
          ========================================================== */}

                    {step === "otp" && (
                        <form
                            onSubmit={handleOtpSubmit}
                            className="register-form"
                        >
                            <div className="register-otp-info">
                                <span>Verification code sent to</span>
                                <strong>{formData.email}</strong>
                            </div>

                            <div className="register-field">
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
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify Email"}
                            </button>

                            <div className="register-otp-actions">
                                <button
                                    type="button"
                                    className="register-resend-button"
                                    onClick={handleResendOtp}
                                    disabled={loading || secondsLeft > 0}
                                >
                                    {secondsLeft > 0
                                        ? `Resend unavailable (${secondsLeft}s)`
                                        : "Resend Code"}
                                </button>

                                <button
                                    type="button"
                                    className="register-back-button"
                                    onClick={handleChangeEmail}
                                    disabled={loading}
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="register-login">
                        <span>Already have an account?</span>

                        <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>

            <div className="register-right">
                <div className="register-image-overlay"></div>

                <div className="register-image-content">
                    <span className="register-image-small-text">
                        FASHION · JEWELLERY · CROCHET
                    </span>

                    <h2>Made by hand, made with heart.</h2>

                    <p>
                        Discover beautiful pieces crafted with care and designed to
                        become part of your everyday story.
                    </p>
                </div>
            </div>
        </div>
    );
}