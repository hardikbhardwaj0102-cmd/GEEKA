import React from "react";
import Header from "./Header";
import "../style/About.css";

import aboutHeroBackground from "../assets/about-hero-bg.png";
import geekaLogo from "../assets/logo.png";

const About = () => {
    return (
        <div className="about-page">

            {/* =====================================================
                NAVBAR
            ===================================================== */}

            <Header />


            {/* =====================================================
                HERO
            ===================================================== */}

            <section
                className="about-hero"
                style={{
                    backgroundImage: `url(${aboutHeroBackground})`,
                }}
            >

                <div className="about-hero-overlay"></div>

                <div className="about-hero-content">

                    <span className="section-label">
                        OUR STORY
                    </span>

                    <h1>
                        Made with
                        <br />
                        <span>Heart & Soul</span>
                    </h1>

                    <p>
                        Discover Geeka — a celebration of handmade beauty,
                        thoughtful design, and pieces chosen to make everyday
                        moments feel a little more special.
                    </p>

                </div>

            </section>


            {/* =====================================================
                WHO WE ARE
            ===================================================== */}

            <section className="about-story">

                <div className="about-story-inner">

                    {/* TEXT */}

                    <div className="about-story-content">

                        <span className="section-label">
                            WHO WE ARE
                        </span>

                        <h2>
                            More Than Just
                            <br />
                            <span>Something Beautiful</span>
                        </h2>

                        <p>
                            Geeka was created with a simple thought —
                            beautiful things feel different when they are
                            made with care.
                        </p>

                        <p>
                            From thoughtfully selected ethnic wear and jewellery
                            to handmade crochet creations, every piece is chosen
                            to bring individuality, warmth, and character into
                            everyday life.
                        </p>

                        <p>
                            We believe that handmade isn't just about how
                            something is made. It's about the time, creativity,
                            patience, and feeling behind it.
                        </p>


                        {/* SIGNATURE */}

                        <div className="about-story-sign">

                            <span>
                                ❧
                            </span>

                            <p>
                                Made by hand.
                                <br />
                                Chosen with heart.
                            </p>

                        </div>

                    </div>


                    {/* GEEKA LOGO */}

                    <div className="about-story-logo">

                        <div className="logo-circle">

                            <img
                                src={geekaLogo}
                                alt="Geeka logo"
                            />

                        </div>

                        <span className="logo-tagline">
                            Fashion · Jewellery · Crochet
                        </span>

                    </div>

                </div>

            </section>


            {/* =====================================================
                VALUES
            ===================================================== */}

            <section className="about-values">

                <div className="about-values-inner">

                    <span className="section-label">
                        WHAT WE BELIEVE
                    </span>

                    <h2 className="values-heading">
                        The Heart Behind Geeka
                    </h2>

                    <p className="values-intro">
                        We want every piece you discover at Geeka to feel
                        thoughtful, personal and beautifully yours.
                    </p>


                    <div className="values-grid">

                        {/* VALUE 01 */}

                        <div className="value-card">

                            <div className="value-icon">
                                ✧
                            </div>

                            <span className="value-number">
                                01
                            </span>

                            <h3>
                                Made with Care
                            </h3>

                            <p>
                                We celebrate craftsmanship, creativity and
                                the attention to detail behind every piece.
                            </p>

                        </div>


                        {/* VALUE 02 */}

                        <div className="value-card">

                            <div className="value-icon">
                                ❧
                            </div>

                            <span className="value-number">
                                02
                            </span>

                            <h3>
                                Thoughtfully Chosen
                            </h3>

                            <p>
                                Every collection is selected with an eye for
                                beauty, individuality and timeless appeal.
                            </p>

                        </div>


                        {/* VALUE 03 */}

                        <div className="value-card">

                            <div className="value-icon">
                                ✦
                            </div>

                            <span className="value-number">
                                03
                            </span>

                            <h3>
                                Uniquely You
                            </h3>

                            <p>
                                Your style should feel personal. Geeka is a
                                place to discover pieces that feel like you.
                            </p>

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                OUR WORLD
            ===================================================== */}

            <section className="about-categories">

                <div className="about-categories-inner">

                    <div className="categories-heading">

                        <span className="section-label">
                            OUR WORLD
                        </span>

                        <h2>
                            A Little Something
                            <br />
                            <span>For Everyone</span>
                        </h2>

                    </div>


                    <div className="categories-list">

                        {/* ETHNIC WEAR */}

                        <div className="category-item">

                            <span className="category-symbol">
                                ✿
                            </span>

                            <div>

                                <h3>
                                    Ethnic Wear
                                </h3>

                                <p>
                                    Elegant styles inspired by tradition and
                                    made for modern everyday living.
                                </p>

                            </div>

                        </div>


                        {/* JEWELLERY */}

                        <div className="category-item">

                            <span className="category-symbol">
                                ◇
                            </span>

                            <div>

                                <h3>
                                    Jewellery
                                </h3>

                                <p>
                                    Beautiful details that add personality
                                    and character to every look.
                                </p>

                            </div>

                        </div>


                        {/* CROCHET */}

                        <div className="category-item">

                            <span className="category-symbol">
                                ❧
                            </span>

                            <div>

                                <h3>
                                    Crochet & Handmade
                                </h3>

                                <p>
                                    Carefully crafted pieces that carry the
                                    warmth of something made by hand.
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* =====================================================
                FINAL CTA
            ===================================================== */}

            <section className="about-closing">

                <div className="about-closing-inner">

                    <span className="closing-symbol">
                        ❧
                    </span>

                    <span className="section-label">
                        WELCOME TO GEEKA
                    </span>

                    <h2>
                        Find Something
                        <br />
                        <span>That Feels Like You</span>
                    </h2>

                    <p>
                        Explore Geeka and discover pieces chosen to bring
                        beauty, creativity and individuality into your world.
                    </p>

                    <a
                        href="/"
                        className="about-cta"
                    >
                        Explore Geeka
                        <span>→</span>
                    </a>

                </div>

            </section>

        </div>
    );
};

export default About;