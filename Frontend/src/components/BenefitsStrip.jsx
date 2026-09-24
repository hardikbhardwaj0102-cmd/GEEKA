import "../style/BenefitsStrip.css";

const benefits = [
    {
        icon: "♧",
        title: "Free Shipping",
        description: "On Orders Above ₹999",
    },
    {
        icon: "♢",
        title: "Secure Payments",
        description: "100% Safe & Trusted",
    },
    {
        icon: "♡",
        title: "Handpicked with Love",
        description: "Unique & Quality Products",
    },
    {
        icon: "⌁",
        title: "Support Small Business",
        description: "Shop Handmade, Support Dreams",
    },
];

export default function BenefitsStrip() {
    return (
        <section className="benefits-strip">
            <div className="benefits-container">
                {benefits.map((benefit, index) => (
                    <div className="benefit-item" key={benefit.title}>
                        <div className="benefit-icon">
                            {benefit.icon}
                        </div>

                        <div className="benefit-content">
                            <h3>{benefit.title}</h3>
                            <p>{benefit.description}</p>
                        </div>

                        {index !== benefits.length - 1 && (
                            <div className="benefit-divider" />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}