import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Login.css";

import loginBackground from "../assets/login.png";
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
| LOGIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (error) {
            setError("");
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
                "Unable to initialize secure login. Please try again."
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
    | LOGIN
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const email = formData.email.trim().toLowerCase();
        const password = formData.password;

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            /*
             * Django requires a CSRF token for login.
             */
            const csrfToken = await getCsrfToken();

            const response = await fetch(`${API_URL}/api/v1/auth/login/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({
                    email,
                    password,
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
                        "Unable to log in. Please check your email and password."
                    )
                );
            }

            /*
             * Django creates the authenticated session on the server.
             *
             * We do NOT save tokens in localStorage/sessionStorage.
             */

            navigate("/", {
                replace: true,
                state: {
                    loginSuccess: true,
                    message: "Welcome back to Geeka!",
                },
            });
        } catch (err) {
            console.error("Login error:", err);

            if (err instanceof TypeError) {
                setError(
                    "Unable to connect to the Geeka server. Please make sure the backend is running."
                );
            } else {
                setError(err.message || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | GOOGLE LOGIN
    |--------------------------------------------------------------------------
    */

    const handleGoogleLogin = () => {
        /*
         * Google login must redirect the browser to Django.
         * Do NOT use fetch() here.
         */
        window.location.href = `${API_URL}/api/v1/auth/google/login/`;
    };

    return (
        <div
            className="login-page"
            style={{
                "--login-background-image": `url(${loginBackground})`,
            }}
        >
            <div className="login-left">
                <div className="login-content">
                    <Link to="/" className="login-logo-link">
                        <img src={logo} alt="Geeka" className="login-logo" />
                    </Link>

                    <div className="login-heading">
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue your Geeka journey.</p>
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-field">
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

                        <div className="login-field">
                            <label htmlFor="password">Password</label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    disabled={loading}
                                />

                                <span>Remember me</span>
                            </label>

                            <Link to="/forgot-password" className="forgot-password-link">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>OR</span>
                    </div>

                    <button
                        type="button"
                        className="google-login-button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <span className="google-icon">G</span>
                        <span>Continue with Google</span>
                    </button>

                    <div className="login-register">
                        <span>Don't have an account?</span>

                        <Link to="/register">Create Account</Link>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-image-overlay"></div>

                <div className="login-image-content">
                    <span className="login-image-small-text">
                        FASHION · JEWELLERY · CROCHET
                    </span>

                    <h2>Made for your everyday.</h2>

                    <p>
                        Discover thoughtful pieces, handmade details and styles that feel
                        uniquely yours.
                    </p>
                </div>
            </div>
        </div>
    );
}