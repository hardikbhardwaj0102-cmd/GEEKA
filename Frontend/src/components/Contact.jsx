
import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../style/Contact.css";
import heroBackground from "../assets/contact-hero-bg.png";
import mainBackground from "../assets/contact-main-bg.png";

const Contact = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setSubmitted(true);

        setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
        });

        setTimeout(() => {
            setSubmitted(false);
        }, 5000);
    };

    return (
        <div className="contact-page">
            {/* ================= NAVBAR ================= */}
            <Header />

            {/* ================= HERO ================= */}
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

            {/* ================= CONTACT MAIN ================= */}
            <section
                className="contact-main"
                style={{
                    backgroundImage: `url(${mainBackground})`,
                }}
            >
                <div className="contact-main-overlay"></div>

                <div className="contact-container">
                    {/* ================= CONTACT INFORMATION ================= */}
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
                            {/* EMAIL */}
                            <div className="contact-detail">
                                <div className="detail-icon">✉</div>

                                <div className="detail-content">
                                    <span>Email</span>

                                    <a href="mailto:geekashop.official@gmail.com">
                                        geekashop.official@gmail.com
                                    </a>
                                </div>
                            </div>

                            {/* PHONE */}
                            <div className="contact-detail">
                                <div className="detail-icon">☎</div>

                                <div className="detail-content">
                                    <span>Phone</span>

                                    <a href="tel:+917042875330">
                                        7042875330
                                    </a>
                                </div>
                            </div>

                            {/* LOCATION */}
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

                    {/* ================= CONTACT FORM ================= */}
                    <div className="contact-form-card">
                        <div className="form-decoration"></div>

                        {submitted ? (
                            <div className="success-message">
                                <div className="success-icon">✓</div>

                                <h3>Thank You!</h3>

                                <p>
                                    Your message has been received. We'll get
                                    back to you shortly.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="form-heading">
                                    <span>WRITE TO US</span>

                                    <h3>Send a Message</h3>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* NAME + EMAIL */}
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
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* SUBJECT */}
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
                                            required
                                        />
                                    </div>

                                    {/* MESSAGE */}
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
                                            required
                                        ></textarea>
                                    </div>

                                    {/* SUBMIT */}
                                    <button
                                        type="submit"
                                        className="contact-submit"
                                    >
                                        <span>Send Message</span>

                                        <span className="submit-arrow">
                                            →
                                        </span>
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

            {/* ================= HELP SECTION ================= */}
            <section className="contact-help">
                <div className="contact-help-inner">
                    <span className="section-label">NEED HELP?</span>

                    <h2 className="help-heading">
                        We're Here For You
                    </h2>

                    <div className="help-grid">
                        {/* ORDER SUPPORT */}
                        <div className="help-card">
                            <div className="help-icon">⌑</div>

                            <h3>Order Support</h3>

                            <p>
                                Need help with an order, delivery, or
                                exchange? Get in touch with us.
                            </p>
                        </div>

                        {/* PRODUCT QUESTIONS */}
                        <div className="help-card">
                            <div className="help-icon">✧</div>

                            <h3>Product Questions</h3>

                            <p>
                                Curious about our handmade products? We're
                                happy to answer your questions.
                            </p>
                        </div>

                        {/* JUST SAY HELLO */}
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

            {/* ================= FOOTER ================= */}
            <Footer />
        </div>
    );
};

export default Contact;
