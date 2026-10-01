import "../style/ExploreShopBanner.css";

import shopBanner from "../assets/shop-banner.jpg";

export default function ExploreShopBanner() {
    return (
        <section className="explore-shop-banner">
            <div className="explore-shop-banner-frame">
                <img
                    src={shopBanner}
                    alt="Explore the Geeka collection"
                />
            </div>
        </section>
    );
}