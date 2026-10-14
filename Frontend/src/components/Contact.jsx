import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../style/Contact.css";
import heroBackground from "../assets/contact-hero-bg.png";
import mainBackground from "../assets/contact-main-bg.png";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";

const INITIAL_FORM_DATA = {
    name: "",
    email: "",
    subject: "",
    message: "",
};

const Contact = () => {
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            setError("");
        }

        if (submitted) {
            setSubmitted(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submitting) return;

        setSubmitting(true);
        setError("");
        setSubmitted(false);

        try {
            // Obtain the Django CSRF token.
            const csrfResponse = await fetch(
                `${API_URL}/api/v1/auth/csrf/`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const csrfData = await csrfResponse
                .json()
                .catch(() => ({}));

            if (!csrfResponse.ok || !csrfData.csrfToken) {
                throw new Error(
                    "We couldn't verify your session. Please refresh the page and try again."
                );
            }

            // Submit the contact message to the backend.
            const response = await fetch(
                `${API_URL}/api/v1/contact/messages/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfData.csrfToken,
                    },
                    body: JSON.stringify({
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        subject: formData.subject.trim(),
                        message: formData.message.trim(),
                    }),
                }
            );

            const responseData = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Please sign in to your Geeka account before sending a message."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        "Your session could not be verified. Please refresh the page and try again."
                    );
                }

                if (response.status === 400) {
                    const validationMessage =
                        responseData.detail ||
                        responseData.message ||
                        Object.values(responseData)
                            .flat()
                            .find((value) => typeof value === "string");

                    throw new Error(
                        validationMessage ||
                        "Please check your details and try again."
                    );
                }

                throw new Error(
                    responseData.detail ||
                    responseData.message ||
                    "We couldn't send your message. Please try again."
                );
            }

            // Show success only after the backend accepts the message.
            setSubmitted(true);
            setFormData(INITIAL_FORM_DATA);
        } catch (err) {
            setError(
                err.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="contact-page">
            <Header />

            <section
                className="contact-hero"
                style={{
                    backgroundImage: `url(${heroBackground})`,
                }}
            >
                <div className="contact-hero-overlay"></div>

                <div className="contact-hero-content">
                    <span className="section-label">GET IN TOUCH</span>

                    <h1>
                        We'd Love to
                        <br />
                        <span>Hear From You</span>
                    </h1>

                    <p>
                        Whether you have a question, need assistance, or simply
                        want to say hello, we're always happy to hear from you.
                    </p>
                </div>
            </section>

            <section
                className="contact-main"
                style={{
                    backgroundImage: `url(${mainBackground})`,
                }}
            >
                <div className="contact-main-overlay"></div>

                <div className="contact-container">
                    <div className="contact-info">
                        <span className="section-label">CONTACT US</span>

                        <h2 className="contact-info-header">
                            Let's Start a
                            <br />
                            Conversation
                        </h2>

                        <p className="contact-description">
                            Have something in mind? We're here to help. Reach
                            out to us and our team will get back to you as soon
                            as possible.
                        </p>

                        <div className="contact-details">
                            <div className="contact-detail">
                                <div className="detail-icon">✉</div>

                                <div className="detail-content">
                                    <span>Email</span>

                                    <a href="mailto:geekashop.official@gmail.com">
                                        geekashop.official@gmail.com
                                    </a>
                                </div>
                            </div>

                            <div className="contact-detail">
                                <div className="detail-icon">☎</div>

                                <div className="detail-content">
                                    <span>Phone</span>

                                    <a href="tel:+917042875330">
                                        7042875330
                                    </a>
                                </div>
                            </div>

                            <div className="contact-detail">
                                <div className="detail-icon">⌖</div>

                                <div className="detail-content">
                                    <span>Location</span>
                                    <p>Delhi</p>
                                </div>
                            </div>
                        </div>

                        <div className="contact-note">
                            <span>❧</span>

                            <p>
                                Every message matters to us. We'll make sure
                                yours reaches the right person.
                            </p>
                        </div>
                    </div>

                    <div className="contact-form-card">
                        <div className="form-decoration"></div>

                        {submitted ? (
                            <div className="success-message" role="status">
                                <div className="success-icon">✓</div>

                                <h3>Thank You!</h3>

                                <p>
                                    Your message has been received. We'll get
                                    back to you shortly.
                                </p>

                                <button
                                    type="button"
                                    className="contact-submit"
                                    onClick={() => setSubmitted(false)}
                                >
                                    <span>Send Another Message</span>
                                    <span className="submit-arrow">→</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="form-heading">
                                    <span>WRITE TO US</span>
                                    <h3>Send a Message</h3>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="name">
                                                Your Name
                                            </label>

                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Enter your name"
                                                autoComplete="name"
                                                maxLength={150}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">
                                                Email Address
                                            </label>

                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Enter your email"
                                                autoComplete="email"
                                                maxLength={254}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="subject">
                                            Subject
                                        </label>

                                        <input
                                            id="subject"
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="What can we help you with?"
                                            maxLength={200}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">
                                            Your Message
                                        </label>

                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us a little more..."
                                            rows="6"
                                            maxLength={5000}
                                            required
                                        ></textarea>
                                    </div>

                                    {error && (
                                        <p
                                            className="contact-form-error"
                                            role="alert"
                                        >
                                            {error}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        className="contact-submit"
                                        disabled={submitting}
                                    >
                                        <span>
                                            {submitting
                                                ? "Sending..."
                                                : "Send Message"}
                                        </span>

                                        {!submitting && (
                                            <span className="submit-arrow">
                                                →
                                            </span>
                                        )}
                                    </button>

                                    <p className="form-disclaimer">
                                        We usually respond within 24–48 hours.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="contact-help">
                <div className="contact-help-inner">
                    <span className="section-label">NEED HELP?</span>

                    <h2 className="help-heading">
                        We're Here For You
                    </h2>

                    <div className="help-grid">
                        <div className="help-card">
                            <div className="help-icon">⌑</div>
                            <h3>Order Support</h3>

                            <p>
                                Need help with an order, delivery, or
                                exchange? Get in touch with us.
                            </p>
                        </div>

                        <div className="help-card">
                            <div className="help-icon">✧</div>
                            <h3>Product Questions</h3>

                            <p>
                                Curious about our handmade products? We're
                                happy to answer your questions.
                            </p>
                        </div>

                        <div className="help-card">
                            <div className="help-icon">❧</div>
                            <h3>Just Say Hello</h3>

                            <p>
                                Want to share feedback or simply connect?
                                We'd love to hear from you.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Contact;
