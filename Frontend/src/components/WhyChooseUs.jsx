import "../style/WhyChooseUs.css";

const reasons = [
    {
        number: "01",
        title: "Unique Collections",
    },
    {
        number: "02",
        title: "Quality Craftsmanship",
    },
    {
        number: "03",
        title: "Women Empowerment",
    },
    {
        number: "04",
        title: "Made with Meaning",
    },
];

export default function WhyChooseUs() {
    return (
        <section className="why-section">
            <div className="why-inner">
                <div className="why-heading">
                    <span className="why-eyebrow">THE GEEKA PROMISE</span>

                    <h2>
                        Little details.
                        <em> Lasting impressions.</em>
                    </h2>

                    <p>
                        Thoughtfully chosen. Beautifully made.
                    </p>
                </div>

                <div className="reasons-grid">
                    {reasons.map((reason) => (
                        <div className="reason-item" key={reason.number}>
                            <span className="reason-number">
                                {reason.number}
                            </span>

                            <h3>{reason.title}</h3>

                            <span className="reason-line" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
