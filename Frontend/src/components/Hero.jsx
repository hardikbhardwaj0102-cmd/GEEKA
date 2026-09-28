import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import "../style/Hero.css";

import heroImage1 from "../assets/top-banner.jpg";
import heroImage2 from "../assets/top-banner-3.jpg";
import heroImage3 from "../assets/top-banner-4.jpg";
import heroImage4 from "../assets/top-banner-5.jpg";


const heroImages = [
    heroImage1,
    heroImage2,
    heroImage3,
    heroImage4,
];


export default function Hero() {

    const [
        currentSlide,
        setCurrentSlide,
    ] = useState(0);


    const [
        isPaused,
        setIsPaused,
    ] = useState(false);


    /* =========================================================
       AUTOMATIC SLIDING
    ========================================================= */

    useEffect(() => {

        if (isPaused) {
            return;
        }


        const interval =
            setInterval(() => {

                setCurrentSlide(
                    (prev) =>
                        prev ===
                            heroImages.length - 1
                            ? 0
                            : prev + 1
                );

            }, 4000);


        return () =>
            clearInterval(
                interval
            );

    }, [
        isPaused,
    ]);


    /* =========================================================
       NEXT SLIDE
    ========================================================= */

    const nextSlide = () => {

        setCurrentSlide(
            (prev) =>
                prev ===
                    heroImages.length - 1
                    ? 0
                    : prev + 1
        );

    };


    /* =========================================================
       PREVIOUS SLIDE
    ========================================================= */

    const previousSlide = () => {

        setCurrentSlide(
            (prev) =>
                prev === 0
                    ? heroImages.length - 1
                    : prev - 1
        );

    };


    /* =========================================================
       SPECIFIC SLIDE
    ========================================================= */

    const goToSlide = (
        index
    ) => {

        setCurrentSlide(
            index
        );

    };


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <section
            className="hero-section"
            id="home"
        >

            <div className="hero-content">


                {/* =================================================
                    LEFT CONTENT
                ================================================= */}

                <div className="hero-copy">

                    <div className="hero-script">

                        Three Expressions.

                    </div>


                    <h1>

                        One Unique You.

                    </h1>


                    <p>

                        From the timeless charm of Ethnic Wear,
                        to the sparkle of Jewellery, and the
                        warmth of Handcrafted Crochet, our
                        collections are created for women who
                        love to express themselves through
                        fashion and creativity.

                    </p>


                    {/* =================================================
                        EXPLORE SHOP BUTTON
                    ================================================= */}

                    <Link
                        to="/shop"
                        className="hero-cta"
                    >

                        <span>
                            EXPLORE OUR COLLECTION
                        </span>


                        <strong>
                            →
                        </strong>

                    </Link>

                </div>


                {/* =================================================
                    RIGHT CAROUSEL
                ================================================= */}

                <div
                    className="hero-visual"
                    onMouseEnter={() =>
                        setIsPaused(true)
                    }
                    onMouseLeave={() =>
                        setIsPaused(false)
                    }
                >


                    {/* =================================================
                        SLIDES
                    ================================================= */}

                    <div
                        className="hero-slider-track"
                        style={{
                            transform:
                                `translateX(-${currentSlide * 100
                                }%)`,
                        }}
                    >

                        {heroImages.map(
                            (
                                image,
                                index
                            ) => (

                                <div
                                    className="hero-slide"
                                    key={
                                        index
                                    }
                                >

                                    <img
                                        src={
                                            image
                                        }
                                        alt={`GEEKA collection ${index + 1
                                            }`}
                                    />

                                </div>

                            )
                        )}

                    </div>


                    {/* =================================================
                        PREVIOUS BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className="hero-slider-arrow hero-slider-prev"
                        onClick={
                            previousSlide
                        }
                        aria-label="Previous slide"
                    >

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >

                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                        </svg>

                    </button>


                    {/* =================================================
                        NEXT BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className="hero-slider-arrow hero-slider-next"
                        onClick={
                            nextSlide
                        }
                        aria-label="Next slide"
                    >

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >

                            <path
                                d="M9 18L15 12L9 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                        </svg>

                    </button>


                    {/* =================================================
                        DOTS
                    ================================================= */}

                    <div className="hero-slider-dots">

                        {heroImages.map(
                            (
                                _,
                                index
                            ) => (

                                <button
                                    key={
                                        index
                                    }
                                    type="button"
                                    className={
                                        currentSlide ===
                                            index
                                            ? "hero-slider-dot active"
                                            : "hero-slider-dot"
                                    }
                                    onClick={() =>
                                        goToSlide(
                                            index
                                        )
                                    }
                                    aria-label={`Go to slide ${index + 1
                                        }`}
                                />

                            )
                        )}

                    </div>

                </div>


                {/* =================================================
                    FLORAL
                ================================================= */}

                <div className="hero-floral">

                    <svg
                        viewBox="0 0 150 230"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >

                        <path
                            d="M17 229C32 177 60 129 107 92C127 76 137 52 140 19"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M47 174C28 159 19 139 20 116"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M61 151C82 147 95 134 102 116"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M80 126C65 109 64 92 72 77"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M103 96C119 93 131 83 137 68"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M110 83C97 67 98 50 108 37"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M37 190C20 183 10 171 7 154"
                            stroke="currentColor"
                            strokeWidth="1"
                        />


                        <path
                            d="M57 160C42 149 35 136 36 120"
                            stroke="currentColor"
                            strokeWidth="1"
                        />

                    </svg>

                </div>

            </div>

        </section>

    );

}