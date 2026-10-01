import React from "react";
import "../style/HandmadeBanner.css";

const HandmadeBanner = () => {
    return (
        <section className="handmade-banner">
            <div className="handmade-banner__texture"></div>

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

            <div className="handmade-banner__visual">
                {/* Replace this area with your handmade banner image */}
                <div className="handmade-banner__image-placeholder">
                    <div className="placeholder-card">
                        <span>YOUR IMAGE</span>
                        <strong>HANDMADE COLLECTION</strong>
                    </div>
                </div>

                <div className="thread thread--one"></div>
                <div className="thread thread--two"></div>

                <div className="flower flower--one">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <b></b>
                </div>

                <div className="flower flower--two">
                    <i></i>
                    <i></i>
                    <i></i>
                    <i></i>
                    <b></b>
                </div>

                <div className="yarn-ball">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <div className="handmade-banner__corner">
                <span>01</span>
                <div></div>
                <span>CRAFTED WITH CARE</span>
            </div>
        </section>
    );
};

export default HandmadeBanner;