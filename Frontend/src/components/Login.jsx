import { useState } from "react";
import { Link } from "react-router-dom";
import "../style/Login.css";

import loginImage from "../assets/login.png";

function Logo() {
    return (
        <Link to="/" className="login-logo">
            <div className="login-logo-mark">
                G
                <span className="login-logo-flower">❧</span>
            </div>

            <div className="login-logo-tagline">
                Fashion <span>·</span> Jewellery <span>·</span> Crochet
            </div>
        </Link>
    );
}

function EyeIcon({ visible }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            {visible ? (
                <>
                    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                </>
            ) : (
                <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.1 0 9.5 7 9.5 7a17 17 0 0 1-3.1 3.9" />
                    <path d="M6.2 6.3C3.7 8 2.5 12 2.5 12s3.4 7 9.5 7c1.6 0 3-.4 4.2-1" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </>
            )}
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h15" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg
            className="google-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                d="M21.35 12.25c0-.72-.06-1.42-.18-2.08H12v3.94h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z"
                fill="currentColor"
            />
            <path
                d="M12 21.6c2.63 0 4.83-.87 6.44-2.35l-3.14-2.45c-.87.58-1.98.92-3.3.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.73 9.73 0 0 0 12 21.6Z"
                fill="currentColor"
            />
            <path
                d="M6.54 13.69a5.85 5.85 0 0 1 0-3.38V7.78H3.29a9.75 9.75 0 0 0 0 8.44l3.25-2.53Z"
                fill="currentColor"
            />
            <path
                d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.82 3.38 14.63 2.4 12 2.4a9.73 9.73 0 0 0-8.71 5.38l3.25 2.53C7.31 8 9.46 6.28 12 6.28Z"
                fill="currentColor"
            />
        </svg>
    );
}

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    });

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        /*
         * Backend authentication will be connected here later.
         *
         * Example:
         * POST /api/auth/login
         */
        console.log("Login submitted:", {
            email: formData.email,
            remember: formData.remember,
        });
    }

    return (
        <main className="login-page">

            {/* ================================
                LEFT LOGIN PANEL
            ================================= */}

            <section className="login-panel">

                <div className="login-top">
                    <Link to="/" className="login-back-link">
                        <span className="back-arrow">←</span>
                        Back to Store
                    </Link>
                </div>

                <div className="login-container">

                    <Logo />

                    <div className="login-heading">

                        <span className="login-eyebrow">
                            WELCOME BACK
                        </span>

                        <h1>
                            Sign in to
                            <br />
                            your account.
                        </h1>

                        <p>
                            Continue your journey with carefully curated
                            fashion, jewellery and handmade creations.
                        </p>

                    </div>

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        {/* EMAIL */}

                        <div className="login-field">

                            <label htmlFor="login-email">
                                Email Address
                            </label>

                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                autoComplete="email"
                                required
                            />

                        </div>

                        {/* PASSWORD */}

                        <div className="login-field">

                            <div className="password-header">

                                <label htmlFor="login-password">
                                    Password
                                </label>

                                <Link to="/forgot-password">
                                    Forgot password?
                                </Link>

                            </div>

                            <div className="password-wrapper">

                                <input
                                    id="login-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            (current) => !current
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >

                                    <EyeIcon
                                        visible={showPassword}
                                    />

                                </button>

                            </div>

                        </div>

                        {/* REMEMBER ME */}

                        <label className="remember-me">

                            <input
                                type="checkbox"
                                name="remember"
                                checked={formData.remember}
                                onChange={handleChange}
                            />

                            <span className="custom-checkbox">
                                <span />
                            </span>

                            <span className="remember-text">
                                Keep me signed in
                            </span>

                        </label>

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="login-submit"
                        >

                            <span>SIGN IN</span>

                            <span className="submit-arrow">
                                <ArrowIcon />
                            </span>

                        </button>

                    </form>

                    {/* DIVIDER */}

                    <div className="login-divider">

                        <span />

                        <p>OR</p>

                        <span />

                    </div>

                    {/* GOOGLE */}

                    <button
                        type="button"
                        className="google-login"
                    >

                        <GoogleIcon />

                        <span>
                            Continue with Google
                        </span>

                    </button>

                    {/* REGISTER */}

                    <div className="login-register">

                        <span>
                            New to GEEKA?
                        </span>

                        <Link to="/register">
                            Create an account
                            <ArrowIcon />
                        </Link>

                    </div>

                    <div className="login-footer-note">

                        By continuing, you agree to our

                        <span>
                            {" "}Terms & Conditions{" "}
                        </span>

                        and

                        <span>
                            {" "}Privacy Policy.
                        </span>

                    </div>

                </div>

            </section>


            {/* ================================
                RIGHT VISUAL PANEL
            ================================= */}

            <section className="login-visual">

                <img
                    src={loginImage}
                    alt="GEEKA fashion collection"
                />

                <div className="login-visual-overlay" />

                <div className="login-visual-top">

                    <span>GEEKA</span>

                    <span>EST. 2026</span>

                </div>

                <div className="login-visual-content">

                    <span className="visual-eyebrow">
                        THREE EXPRESSIONS.
                    </span>

                    <h2>
                        One Unique
                        <br />
                        <em>You.</em>
                    </h2>

                    <p>
                        Fashion, jewellery and handcrafted pieces
                        made for the way you express yourself.
                    </p>

                    <div className="login-visual-line" />

                </div>

                <div className="login-floral">

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