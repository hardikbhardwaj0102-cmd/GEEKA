import { useState } from "react";
import "../style/Profile.css";

import profileBackground from "../assets/profile.png";

export default function Profile() {
    const [profile] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [activeSection, setActiveSection] = useState("profile");

    const menuItems = [
        {
            id: "profile",
            label: "Profile",
        },
        {
            id: "orders",
            label: "Orders",
        },
        {
            id: "wishlist",
            label: "Wishlist",
        },
        {
            id: "addresses",
            label: "Addresses",
        },
        {
            id: "payments",
            label: "Payment Methods",
        },
        {
            id: "settings",
            label: "Settings",
        },
    ];

    const renderProfileContent = () => {
        switch (activeSection) {
            case "orders":
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>SHOPPING</span>
                                <h2>My Orders</h2>
                            </div>

                            <button type="button">
                                VIEW ALL
                                <span>→</span>
                            </button>
                        </div>

                        <div className="account-empty-state">
                            <div className="account-empty-mark">
                                —
                            </div>

                            <h3>
                                Orders
                            </h3>

                            <p>
                                Your order history will appear here.
                            </p>

                            <button type="button">
                                START SHOPPING
                                <span>→</span>
                            </button>
                        </div>
                    </section>
                );

            case "wishlist":
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>SAVED ITEMS</span>
                                <h2>Wishlist</h2>
                            </div>
                        </div>

                        <div className="account-empty-state">
                            <div className="account-empty-mark">
                                ♡
                            </div>

                            <h3>
                                Wishlist
                            </h3>

                            <p>
                                Your saved products will appear here.
                            </p>

                            <button type="button">
                                EXPLORE COLLECTION
                                <span>→</span>
                            </button>
                        </div>
                    </section>
                );

            case "addresses":
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>DELIVERY</span>
                                <h2>Saved Addresses</h2>
                            </div>

                            <button
                                type="button"
                                className="account-outline-button"
                            >
                                ADD ADDRESS
                                <span>+</span>
                            </button>
                        </div>

                        <div className="account-empty-state">
                            <div className="account-empty-mark">
                                +
                            </div>

                            <h3>
                                Addresses
                            </h3>

                            <p>
                                Your saved delivery addresses will appear here.
                            </p>
                        </div>
                    </section>
                );

            case "payments":
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>CHECKOUT</span>
                                <h2>Payment Methods</h2>
                            </div>
                        </div>

                        <div className="account-empty-state">
                            <div className="account-empty-mark">
                                —
                            </div>

                            <h3>
                                Payment Methods
                            </h3>

                            <p>
                                Your saved payment methods will appear here.
                            </p>
                        </div>
                    </section>
                );

            case "settings":
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>ACCOUNT</span>
                                <h2>Settings</h2>
                            </div>
                        </div>

                        <div className="account-settings-list">
                            <button type="button">
                                <div>
                                    <span>
                                        ACCOUNT INFORMATION
                                    </span>

                                    <strong>
                                        Personal Details
                                    </strong>
                                </div>

                                <span>→</span>
                            </button>

                            <button type="button">
                                <div>
                                    <span>
                                        SECURITY
                                    </span>

                                    <strong>
                                        Password &amp; Security
                                    </strong>
                                </div>

                                <span>→</span>
                            </button>

                            <button type="button">
                                <div>
                                    <span>
                                        PREFERENCES
                                    </span>

                                    <strong>
                                        Communication Preferences
                                    </strong>
                                </div>

                                <span>→</span>
                            </button>
                        </div>
                    </section>
                );

            default:
                return (
                    <section className="account-content-panel">
                        <div className="account-content-header">
                            <div>
                                <span>
                                    ACCOUNT DETAILS
                                </span>

                                <h2>
                                    Profile
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="account-outline-button"
                            >
                                EDIT PROFILE
                                <span>→</span>
                            </button>
                        </div>

                        <div className="profile-details">
                            <div className="profile-detail">
                                <span>
                                    FULL NAME
                                </span>

                                <p>
                                    {profile.name}
                                </p>
                            </div>

                            <div className="profile-detail">
                                <span>
                                    EMAIL ADDRESS
                                </span>

                                <p>
                                    {profile.email}
                                </p>
                            </div>

                            <div className="profile-detail">
                                <span>
                                    PHONE NUMBER
                                </span>

                                <p>
                                    {profile.phone}
                                </p>
                            </div>
                        </div>

                        <div className="profile-account-note">
                            <span>
                                GEEKA ACCOUNT
                            </span>

                            <p>
                                Your account information and preferences
                                will be managed here.
                            </p>
                        </div>
                    </section>
                );
        }
    };

    const initials = profile.name
        ? profile.name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "";

    return (
        <main
            className="account-page"
            style={{
                "--profile-background": `url(${profileBackground})`,
            }}
        >
            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="account-background-image" />

            <div className="account-background-overlay" />


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <header className="account-page-header">
                <span>
                    ACCOUNT
                </span>

                <h1>
                    My Account
                </h1>

                <p>
                    Manage your profile, orders and preferences.
                </p>
            </header>


            {/* =================================================
                ACCOUNT LAYOUT
            ================================================= */}

            <div className="account-layout">

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="account-sidebar">

                    <div className="account-sidebar-title">
                        <span>
                            GEEKA
                        </span>

                        <small>
                            ACCOUNT
                        </small>
                    </div>


                    <nav className="account-navigation">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={
                                    activeSection === item.id
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveSection(item.id)
                                }
                            >
                                <span>
                                    {item.label}
                                </span>

                                <strong>
                                    →
                                </strong>
                            </button>
                        ))}
                    </nav>


                    <button
                        type="button"
                        className="account-logout"
                    >
                        LOG OUT
                    </button>

                </aside>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="account-main">

                    {/* =================================================
                        WELCOME
                    ================================================= */}

                    <div className="account-welcome">

                        <div className="account-avatar">
                            <span>
                                {initials}
                            </span>
                        </div>

                        <div>
                            <span>
                                WELCOME
                            </span>

                            <h2>
                                {profile.name}
                            </h2>
                        </div>

                    </div>


                    {/* =================================================
                        ACTIVE SECTION
                    ================================================= */}

                    {renderProfileContent()}

                </div>

            </div>
        </main>
    );
}