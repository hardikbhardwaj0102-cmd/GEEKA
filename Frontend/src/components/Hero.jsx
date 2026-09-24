import "../style/Hero.css";

export default function Hero() {
    return (
        <section className="hero-section" id="home">
            <div className="hero-content">
                <div className="hero-copy">
                    <div className="hero-script">
                        Three Expressions.
                    </div>

                    <h1>
                        One Unique You.
                    </h1>

                    <p>
                        From the timeless charm of Ethnic Wear, to the sparkle of
                        Jewellery, and the warmth of Handcrafted Crochet, our collections
                        are created for women who love to express themselves through
                        fashion and creativity.
                    </p>

                    <a href="#collections" className="hero-cta">
                        <span>EXPLORE OUR COLLECTION</span>
                        <strong>→</strong>
                    </a>
                </div>

                <div className="hero-visual">
                    <img
                        src="/src/assets/top-banner.jpg"
                        alt="Fashion collection"
                    />
                </div>

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