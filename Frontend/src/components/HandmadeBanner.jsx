
import React from "react";
import "../style/HandmadeBanner.css";
import handmadeBanner from "../assets/geeka-handmade-banner.png";

const HandmadeBanner = () => {
    return (
        <section className="handmade-banner">
            {/* Background texture */}
            <div className="handmade-banner__texture"></div>

            {/* Left content */}
            <div className="handmade-banner__content">
                <span className="handmade-banner__eyebrow">
                    THE ART OF HANDMADE
                </span>

                <h2>
                    MADE SLOWLY.
                    <br />
                    <em>LOVED LONGER.</em>
                </h2>

                <p>
                    Little handmade things, thoughtfully created
                    for everyday moments.
                </p>

                <div className="handmade-banner__line">
                    <span></span>
                    <small>GEEKA · HANDMADE</small>
                </div>
            </div>

            {/* Right image */}
            <div className="handmade-banner__visual">
                <img
                    src={handmadeBanner}
                    alt="Geeka handmade fashion, jewellery and crochet collection"
                    className="handmade-banner__image"
                />
            </div>
        </section>
    );
};

export default HandmadeBanner;
