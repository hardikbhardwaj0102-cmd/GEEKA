import { useEffect } from "react";
import { Link } from "react-router-dom";
import "../style/About.css";
import geekaLogo from "../assets/logo.png";

import Header from "./Header";

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13" />
            <path d="M13 7l5 5-5 5" />
        </svg>
    );
}

function SparkIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2v20" />
            <path d="M2 12h20" />
            <path d="M4.9 4.9l14.2 14.2" />
            <path d="M19.1 4.9L4.9 19.1" />
        </svg>
    );
}

function NeedleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4l15 15" />
            <path d="M8 3l13 13" />
            <path d="M4 17l5-5" />
            <path d="M15 21l6-6" />
            <path d="M3 21l4-4" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 8.8c0 5-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.8A4.7 4.7 0 0 1 8 4a5 5 0 0 1 4 2.1A5 5 0 0 1 16 4a4.7 4.7 0 0 1 4.8 4.8Z" />
        </svg>
    );
}

export default function About() {
    useEffect(() => {
        const elements = document.querySelectorAll(
            ".about-reveal, .about-reveal-left, .about-reveal-right, .about-stagger"
        );

        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -60px 0px",
            }
        );

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Header />

            <main className="about-page">

                {/* =================================================
                    HERO
                ================================================= */}

                <section className="about-hero">

                    <div className="about-hero-noise" />

                    <div className="about-hero-inner">

                        <div className="about-hero-copy">

                            <span className="about-kicker about-reveal">
                                The story behind GEEKA
                            </span>

                            <h1 className="about-reveal delay-1">
                                Made with
                                <br />
                                intention.
                            </h1>

                            <p className="about-reveal delay-2">
                                Fashion, jewellery and handmade creations
                                brought together for people who believe
                                the little details matter.
                            </p>

                            <Link
                                to="/shop"
                                className="about-hero-link about-reveal delay-3"
                            >
                                Explore the collection

                                <span>
                                    <ArrowIcon />
                                </span>
                            </Link>

                        </div>


                        <div className="about-hero-art">

                            <div className="hero-art-ring hero-ring-one" />
                            <div className="hero-art-ring hero-ring-two" />

                            <div className="hero-art-panel">

                                <div className="hero-art-inner">

                                    <img
                                        src={geekaLogo}
                                        alt="GEEKA — Fashion, Jewellery, Crochet"
                                        className="about-hero-logo"
                                    />

                                </div>

                            </div>

                            <div className="hero-art-mark">
                                G
                                <span>❧</span>
                            </div>

                            <div className="hero-art-flower flower-one" />
                            <div className="hero-art-flower flower-two" />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    BRAND STORY
                ================================================= */}

                <section className="about-story">

                    <div className="story-copy about-reveal-left">

                        <span className="section-eyebrow">
                            Our story
                        </span>

                        <h2>
                            Ordinary moments
                            <br />
                            deserve beautiful things.
                        </h2>

                    </div>


                    <div className="story-text about-reveal-right">

                        <p className="story-intro">
                            GEEKA started with a simple belief:
                            what you surround yourself with should
                            feel like you.
                        </p>

                        <p>
                            We bring together ethnic wear, jewellery and
                            handmade pieces that balance individuality
                            with everyday ease.
                        </p>

                        <p>
                            Some pieces are expressive. Some are delicate.
                            Some are made slowly by hand. But every piece
                            is chosen for the same reason — it should have
                            a little character.
                        </p>

                        <div className="story-signature">
                            <span>GEEKA</span>
                            <small>Made to be yours.</small>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    VALUES
                ================================================= */}

                <section className="about-values">

                    <div className="values-header about-reveal">

                        <span className="section-eyebrow">
                            What we believe
                        </span>

                        <h2>
                            Small details.
                            <br />
                            Meaningful difference.
                        </h2>

                    </div>


                    <div className="values-grid">

                        <article className="value-item about-stagger">

                            <div className="value-top">
                                <span className="value-number">
                                    01
                                </span>

                                <div className="value-icon">
                                    <SparkIcon />
                                </div>
                            </div>

                            <h3>
                                Thoughtful design
                            </h3>

                            <p>
                                Pieces chosen for their details,
                                versatility and effortless character.
                            </p>

                        </article>


                        <article className="value-item about-stagger">

                            <div className="value-top">
                                <span className="value-number">
                                    02
                                </span>

                                <div className="value-icon">
                                    <NeedleIcon />
                                </div>
                            </div>

                            <h3>
                                Handmade spirit
                            </h3>

                            <p>
                                We love the texture and personality
                                that comes from something made by hand.
                            </p>

                        </article>


                        <article className="value-item about-stagger">

                            <div className="value-top">
                                <span className="value-number">
                                    03
                                </span>

                                <div className="value-icon">
                                    <HeartIcon />
                                </div>
                            </div>

                            <h3>
                                Personal expression
                            </h3>

                            <p>
                                Style should feel personal — something
                                that naturally becomes part of your story.
                            </p>

                        </article>

                    </div>

                </section>


                {/* =================================================
                    CTA
                ================================================= */}

                <section className="about-cta">

                    <div className="cta-orbit orbit-a" />
                    <div className="cta-orbit orbit-b" />

                    <span className="section-eyebrow about-reveal">
                        Discover GEEKA
                    </span>

                    <h2 className="about-reveal delay-1">
                        Find something
                        <br />
                        that feels like you.
                    </h2>

                    <p className="about-reveal delay-2">
                        Explore pieces made for your everyday,
                        your occasions and everything in between.
                    </p>

                    <Link
                        to="/shop"
                        className="about-cta-button about-reveal delay-3"
                    >
                        Shop the collection

                        <span>
                            <ArrowIcon />
                        </span>
                    </Link>

                </section>

            </main>
        </>
    );
}