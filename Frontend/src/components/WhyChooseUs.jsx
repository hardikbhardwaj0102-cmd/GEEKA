import "../style/WhyChooseUs.css";

const reasons = [
    {
        icon: "✦",
        title: "Unique & Trendy Collections",
    },
    {
        icon: "✥",
        title: "Premium Quality",
    },
    {
        icon: "♧",
        title: "Women Empowerment",
    },
    {
        icon: "♡",
        title: "Personalized & Handmade Touch",
    },
];

function Floral({ side }) {
    return (
        <div className={`why-floral why-floral-${side}`}>
            <svg viewBox="0 0 160 200" fill="none">
                <path
                    d={
                        side === "left"
                            ? "M15 198C30 148 66 102 117 68C135 56 148 36 151 10"
                            : "M145 198C130 148 94 102 43 68C25 56 12 36 9 10"
                    }
                    stroke="currentColor"
                    strokeWidth="1"
                />

                <path
                    d={
                        side === "left"
                            ? "M47 148C29 137 18 120 17 99"
                            : "M113 148C131 137 142 120 143 99"
                    }
                    stroke="currentColor"
                    strokeWidth="1"
                />

                <path
                    d={
                        side === "left"
                            ? "M68 120C86 116 98 105 103 91"
                            : "M92 120C74 116 62 105 57 91"
                    }
                    stroke="currentColor"
                    strokeWidth="1"
                />

                <path
                    d={
                        side === "left"
                            ? "M91 95C77 79 78 64 85 52"
                            : "M69 95C83 79 82 64 75 52"
                    }
                    stroke="currentColor"
                    strokeWidth="1"
                />
            </svg>
        </div>
    );
}

export default function WhyChooseUs() {
    return (
        <section className="why-section">
            <Floral side="left" />
            <Floral side="right" />

            <div className="why-inner">
                <div className="why-heading">
                    <div className="why-heading-line" />

                    <h2>WHY CHOOSE US</h2>

                    <div className="why-heading-line" />
                </div>

                <div className="reasons-grid">
                    {reasons.map((reason) => (
                        <div className="reason-item" key={reason.title}>
                            <div className="reason-icon">
                                {reason.icon}
                            </div>

                            <p>{reason.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}