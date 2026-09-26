import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/ForgotPassword.css";
import geekaLogo from "../assets/logo.png";
import forgotPassImage from "../assets/ForgotPass.png";

function Logo() {
    return (
        <Link to="/" className="forgot-logo-link">
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
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    );
}

export default function ForgotPassword() {
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleEmailSubmit = (event) => {
        event.preventDefault();

        if (!email.trim()) {
            return;
        }

        setStep("otp");
    };

    const handleOtpSubmit = (event) => {
        event.preventDefault();

        if (otp.length !== 6) {
            return;
        }

        setStep("password");
    };

    const handlePasswordSubmit = (event) => {
        event.preventDefault();

        if (!password || !confirmPassword) {
            return;
        }

        if (password !== confirmPassword) {
            return;
        }

        setStep("success");
    };

    return (
        <main className="forgot-page">
            <section className="forgot-auth-layout">

                {/* =========================
                    LEFT SIDE
                ========================= */}

                <div className="forgot-form-side">

                    <Link to="/" className="forgot-back-store">
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
                                    onSubmit={handleEmailSubmit}
                                >
                                    <div className="forgot-field">
                                        <label htmlFor="forgot-email">
                                            EMAIL ADDRESS
                                        </label>

                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={email}
                                            onChange={(event) =>
                                                setEmail(event.target.value)
                                            }
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                    >
                                        <span>
                                            SEND VERIFICATION CODE
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
                                    <strong>{email}</strong>.
                                </p>

                                <form
                                    className="forgot-form"
                                    onSubmit={handleOtpSubmit}
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
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    )
                                                )
                                            }
                                            placeholder="Enter 6-digit code"
                                            autoComplete="one-time-code"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                    >
                                        <span>VERIFY CODE</span>
                                        <ArrowIcon />
                                    </button>

                                    <button
                                        type="button"
                                        className="forgot-secondary-button"
                                        onClick={() => {
                                            setOtp("");
                                            setStep("email");
                                        }}
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
                                    onSubmit={handlePasswordSubmit}
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
                                                onChange={(event) =>
                                                    setPassword(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Enter your new password"
                                                autoComplete="new-password"
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
                                            >
                                                <EyeIcon
                                                    hidden={showPassword}
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
                                                value={confirmPassword}
                                                onChange={(event) =>
                                                    setConfirmPassword(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Confirm your new password"
                                                autoComplete="new-password"
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

                                    <button
                                        type="submit"
                                        className="forgot-submit-button"
                                        disabled={
                                            !password ||
                                            !confirmPassword ||
                                            password !== confirmPassword
                                        }
                                    >
                                        <span>RESET PASSWORD</span>
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
                                    <span>BACK TO SIGN IN</span>
                                    <ArrowIcon />
                                </Link>

                            </div>
                        )}

                        {/* =========================
                            LOGIN LINK
                        ========================= */}

                        {step !== "success" && (
                            <div className="forgot-login-link">
                                <span>Remember your password?</span>

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
                        backgroundImage: `url(${forgotPassImage})`,
                    }}
                >

                    <div className="forgot-image-top">
                        <span>GEEKA</span>
                        <span>EST. 2026</span>
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