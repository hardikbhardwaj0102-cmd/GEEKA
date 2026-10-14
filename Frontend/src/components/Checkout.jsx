
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../style/Checkout.css";

const API_URL = (
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com"
).replace(/\/+$/, "");

const STEPS = [
    { number: 1, title: "Delivery details" },
    { number: 2, title: "Review order" },
    { number: 3, title: "Payment" },
];

const EMPTY_CONTACT = {
    name: "",
    email: "",
    phone: "",
};

function getErrorMessage(data, fallback) {
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;

    if (data && typeof data === "object") {
        const firstError = Object.values(data).flat(Infinity)[0];

        if (typeof firstError === "string") return firstError;
    }

    return fallback;
}

function getArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.addresses)) return data.addresses;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function formatCurrency(value) {
    const amount = Number(value);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
}

function getItemName(item) {
    return (
        item.product_name ||
        item.name ||
        item.title ||
        "Geeka product"
    );
}

function getItemImage(item) {
    return (
        item.image_url ||
        item.product_image_url ||
        item.image ||
        item.product?.image_url ||
        ""
    );
}

function getItemSubtotal(item) {
    if (item.subtotal !== undefined && item.subtotal !== null) {
        return Number(item.subtotal) || 0;
    }

    return (
        (Number(item.price) || 0) *
        (Number(item.quantity) || 1)
    );
}

function getAddressText(address) {
    return [
        address.address_line1,
        address.address_line2,
        address.city,
        address.state,
        address.postal_code,
    ]
        .filter(Boolean)
        .join(", ");
}

function getUser(data) {
    return data?.user || data?.data?.user || data?.data || data;
}

function getPhone(user) {
    return (
        user?.phone_number ||
        user?.phone ||
        user?.mobile_number ||
        user?.mobile ||
        ""
    );
}

function getVerifiedPhone(user) {
    const phone = getPhone(user);

    const verified =
        user?.phone_verified === true ||
        user?.is_phone_verified === true ||
        user?.mobile_verified === true;

    return verified ? phone : "";
}

function StepIndicator({ currentStep, onStepClick }) {
    return (
        <div className="geeka-checkout-steps">
            {STEPS.map((step, index) => {
                const completed = currentStep > step.number;
                const active = currentStep === step.number;
                const clickable = step.number < currentStep;

                return (
                    <div
                        className={[
                            "geeka-checkout-step",
                            active ? "is-active" : "",
                            completed ? "is-complete" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        key={step.number}
                    >
                        <button
                            type="button"
                            className="geeka-checkout-step-button"
                            disabled={!clickable}
                            onClick={() => onStepClick(step.number)}
                            aria-current={active ? "step" : undefined}
                        >
                            <span className="geeka-checkout-step-number">
                                {completed ? "✓" : step.number}
                            </span>

                            <span className="geeka-checkout-step-title">
                                {step.title}
                            </span>
                        </button>

                        {index < STEPS.length - 1 && (
                            <span
                                className={[
                                    "geeka-checkout-step-line",
                                    completed ? "is-complete" : "",
                                ].join(" ")}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function CheckoutItem({ item }) {
    const image = getItemImage(item);
    const quantity = Number(item.quantity) || 1;

    return (
        <div className="geeka-checkout-item">
            <div className="geeka-checkout-item-image">
                {image ? (
                    <img src={image} alt={getItemName(item)} />
                ) : (
                    <span className="geeka-checkout-image-placeholder">
                        G
                    </span>
                )}
            </div>

            <div className="geeka-checkout-item-info">
                <h4>{getItemName(item)}</h4>

                {item.sku && (
                    <p className="geeka-checkout-item-sku">
                        SKU: {item.sku}
                    </p>
                )}

                <p className="geeka-checkout-item-quantity">
                    Quantity: {quantity}
                </p>
            </div>

            <strong className="geeka-checkout-item-price">
                {formatCurrency(getItemSubtotal(item))}
            </strong>
        </div>
    );
}

function AddressCard({ address, selected, onSelect }) {
    return (
        <button
            type="button"
            className={[
                "geeka-checkout-address",
                selected ? "is-selected" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            onClick={onSelect}
            aria-pressed={selected}
        >
            <span className="geeka-checkout-address-radio">
                {selected && <span />}
            </span>

            <span className="geeka-checkout-address-content">
                <span className="geeka-checkout-address-heading">
                    <strong>
                        {address.label || "DELIVERY ADDRESS"}
                    </strong>

                    {address.is_default && (
                        <span className="geeka-checkout-default">
                            DEFAULT
                        </span>
                    )}
                </span>

                <span className="geeka-checkout-address-name">
                    {address.recipient_name}
                </span>

                <span className="geeka-checkout-address-text">
                    {getAddressText(address)}
                </span>

                <span className="geeka-checkout-address-phone">
                    Phone: {address.phone_number}
                </span>
            </span>
        </button>
    );
}

export default function Checkout() {
    const navigate = useNavigate();
    const idempotencyKey = useRef("");

    const [currentStep, setCurrentStep] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [cartItems, setCartItems] = useState([]);
    const [contact, setContact] = useState(EMPTY_CONTACT);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const selectedAddress = useMemo(
        () =>
            addresses.find(
                (address) =>
                    String(address.id) === String(selectedAddressId)
            ) || null,
        [addresses, selectedAddressId]
    );

    const subtotal = useMemo(
        () => cartItems.reduce(
            (sum, item) => sum + getItemSubtotal(item),
            0
        ),
        [cartItems]
    );

    // The current checkout contract sets both values to zero.
    const shipping = 0;
    const discount = 0;
    const total = subtotal + shipping - discount;

    const loadCheckoutData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [userResponse, addressResponse, cartResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/v1/auth/me/`, {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                    fetch(`${API_URL}/api/v1/addresses/`, {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                    fetch(`${API_URL}/api/v1/cart/`, {
                        credentials: "include",
                        headers: { Accept: "application/json" },
                    }),
                ]);

            if (
                userResponse.status === 401 ||
                userResponse.status === 403
            ) {
                navigate("/login", {
                    state: { from: "/checkout" },
                });
                return;
            }

            const userData = await userResponse.json().catch(() => ({}));
            const addressData = await addressResponse.json().catch(() => ({}));
            const cartData = await cartResponse.json().catch(() => ({}));

            if (!userResponse.ok) {
                throw new Error(
                    getErrorMessage(userData, "Please sign in to continue.")
                );
            }

            if (!addressResponse.ok) {
                throw new Error(
                    getErrorMessage(
                        addressData,
                        "Unable to load your saved addresses."
                    )
                );
            }

            if (!cartResponse.ok) {
                throw new Error(
                    getErrorMessage(cartData, "Unable to load your cart.")
                );
            }

            const currentUser = getUser(userData);
            const addressList = getArray(addressData);
            const items = getArray(cartData);

            setUser(currentUser);

            setContact({
                name:
                    currentUser?.full_name ||
                    currentUser?.name ||
                    "",
                email: currentUser?.email || "",
                phone: getVerifiedPhone(currentUser),
            });

            setAddresses(addressList);
            setCartItems(items);

            const defaultAddress =
                addressList.find((address) => address.is_default) ||
                addressList[0];

            setSelectedAddressId(
                defaultAddress ? String(defaultAddress.id) : ""
            );

            if (items.length === 0) {
                setNotice("Your cart is empty. Add products before checkout.");
            }

            if (addressList.length === 0) {
                setNotice(
                    "Add a delivery address to your Geeka profile before continuing."
                );
            }
        } catch (loadError) {
            setError(
                loadError.message ||
                "Something went wrong while loading checkout."
            );
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadCheckoutData();
    }, [loadCheckoutData]);

    function updateContact(event) {
        const { name, value } = event.target;

        setContact((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function validateDelivery() {
        if (!selectedAddress) {
            return "Please select a saved delivery address.";
        }

        if (
            !contact.name.trim() ||
            !contact.email.trim() ||
            !contact.phone.trim()
        ) {
            return "Complete your contact details in your Geeka profile before continuing.";
        }

        if (!getVerifiedPhone(user)) {
            return "Your profile phone number must be verified before checkout. Please update your phone details in Profile.";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
            return "Enter a valid email address.";
        }

        if (!/^\d{10,15}$/.test(contact.phone.replace(/\D/g, ""))) {
            return "Enter a valid contact phone number.";
        }

        if (!/^\d{6}$/.test(String(selectedAddress.postal_code || ""))) {
            return "Your delivery address must have a valid six-digit PIN code. Update it in Profile.";
        }

        if (!selectedAddress.phone_number) {
            return "Your selected address is missing a phone number. Update it in Profile.";
        }

        if (cartItems.length === 0) {
            return "Your cart is empty.";
        }

        if (cartItems.some((item) => item.is_purchasable === false)) {
            return "One or more products are unavailable. Please update your cart.";
        }

        return "";
    }

    function continueToReview() {
        setError("");
        setNotice("");

        const validationError = validateDelivery();

        if (validationError) {
            setError(validationError);
            return;
        }

        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function continueToPayment() {
        setError("");
        setNotice("");

        if (cartItems.length === 0) {
            setError("Your cart is empty.");
            return;
        }

        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function placeOrder() {
        setError("");
        setNotice("");

        if (submitting) return;

        const validationError = validateDelivery();

        if (validationError) {
            setError(validationError);
            setCurrentStep(1);
            return;
        }

        if (!idempotencyKey.current) {
            idempotencyKey.current =
                typeof crypto !== "undefined" &&
                    typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `geeka-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;
        }

        setSubmitting(true);

        try {
            const csrfResponse = await fetch(
                `${API_URL}/api/v1/auth/csrf/`,
                {
                    credentials: "include",
                    headers: { Accept: "application/json" },
                }
            );

            const csrfData = await csrfResponse.json().catch(() => ({}));

            if (!csrfResponse.ok || !csrfData.csrfToken) {
                throw new Error(
                    "Unable to verify your session. Refresh the page and try again."
                );
            }

            const payload = {
                contact_name: contact.name.trim(),
                contact_email: contact.email.trim(),
                contact_phone: contact.phone.replace(/\D/g, ""),
                saved_address_id: selectedAddress.id,
            };

            const response = await fetch(
                `${API_URL}/api/v1/orders/checkout/`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrfData.csrfToken,
                        "Idempotency-Key": idempotencyKey.current,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json().catch(() => ({}));
            const order = data?.order || data?.data?.order || data;

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        data,
                        "We couldn't place your order. Please review your details and try again."
                    )
                );
            }

            if (!order?.id && !order?.order_number) {
                throw new Error(
                    "The server response did not include an order reference. Please check My Orders before retrying."
                );
            }

            // Prevent a fresh checkout key from being reused for a different order.
            idempotencyKey.current = "";

            navigate("/profile?section=orders", {
                state: {
                    checkoutOrder: order,
                    checkoutCreated: true,
                },
            });
        } catch (orderError) {
            setError(
                orderError.message ||
                "Unable to place your order. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    function goToStep(step) {
        if (step < currentStep) {
            setError("");
            setNotice("");
            setCurrentStep(step);
        }
    }

    if (loading) {
        return (
            <main className="geeka-checkout-page">
                <div className="geeka-checkout-loading">
                    <span className="geeka-checkout-spinner" />
                    <p>Preparing your checkout...</p>
                </div>
            </main>
        );
    }

    if (error && cartItems.length === 0 && !notice) {
        return (
            <main className="geeka-checkout-page">
                <div className="geeka-checkout-message-card">
                    <h1>Checkout unavailable</h1>
                    <p>{error}</p>
                    <button
                        className="geeka-checkout-primary"
                        onClick={loadCheckoutData}
                        type="button"
                    >
                        Try again
                    </button>
                    <Link to="/cart" className="geeka-checkout-text-link">
                        Return to cart
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="geeka-checkout-page">
            <div className="geeka-checkout-container">
                <div className="geeka-checkout-topbar">
                    <Link to="/cart" className="geeka-checkout-back">
                        <span aria-hidden="true">←</span>
                        Back to bag
                    </Link>

                    <div className="geeka-checkout-brand">
                        <span className="geeka-checkout-brand-name">
                            GEEKA
                        </span>
                        <span>Thoughtfully chosen. Meaningfully made.</span>
                    </div>

                    <div className="geeka-checkout-secure">
                        <span className="geeka-checkout-lock" aria-hidden="true">
                            ◈
                        </span>
                        Secure checkout
                    </div>
                </div>

                <header className="geeka-checkout-heading">
                    <span className="geeka-checkout-eyebrow">
                        YOUR GE EKA ORDER
                    </span>
                    <h1>Checkout</h1>
                    <p>A few details, then your order is ready.</p>
                </header>

                <StepIndicator
                    currentStep={currentStep}
                    onStepClick={goToStep}
                />

                {(error || notice) && (
                    <div
                        className={
                            error
                                ? "geeka-checkout-alert is-error"
                                : "geeka-checkout-alert is-notice"
                        }
                        role={error ? "alert" : "status"}
                    >
                        <span>{error || notice}</span>

                        {addresses.length === 0 && (
                            <Link to="/profile?section=addresses">
                                Add address
                            </Link>
                        )}

                        {cartItems.length === 0 && (
                            <Link to="/shop">Explore the shop</Link>
                        )}
                    </div>
                )}

                <div className="geeka-checkout-layout">
                    <section className="geeka-checkout-main">
                        {currentStep === 1 && (
                            <div className="geeka-checkout-panel">
                                <div className="geeka-checkout-panel-heading">
                                    <div>
                                        <span className="geeka-checkout-section-label">
                                            STEP 01
                                        </span>
                                        <h2>Delivery details</h2>
                                        <p>
                                            Where should we send your Geeka
                                            order?
                                        </p>
                                    </div>
                                </div>

                                <div className="geeka-checkout-form-section">
                                    <div className="geeka-checkout-section-title">
                                        <h3>Contact information</h3>
                                        <Link to="/profile">
                                            Edit profile
                                        </Link>
                                    </div>

                                    <div className="geeka-checkout-form-grid">
                                        <label className="geeka-checkout-field">
                                            <span>Full name</span>
                                            <input
                                                name="name"
                                                value={contact.name}
                                                onChange={updateContact}
                                                autoComplete="name"
                                                placeholder="Your full name"
                                                required
                                            />
                                        </label>

                                        <label className="geeka-checkout-field">
                                            <span>Email address</span>
                                            <input
                                                name="email"
                                                type="email"
                                                value={contact.email}
                                                onChange={updateContact}
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </label>

                                        <label className="geeka-checkout-field geeka-checkout-field-full">
                                            <span>Verified mobile number</span>
                                            <input
                                                name="phone"
                                                type="tel"
                                                value={contact.phone}
                                                onChange={updateContact}
                                                autoComplete="tel"
                                                inputMode="numeric"
                                                placeholder="Your verified profile number"
                                                required
                                            />
                                            <small>
                                                Your contact number must be
                                                verified in your Geeka profile.
                                            </small>
                                        </label>
                                    </div>
                                </div>

                                <div className="geeka-checkout-form-section">
                                    <div className="geeka-checkout-section-title">
                                        <h3>Delivery address</h3>
                                        <Link to="/profile?section=addresses">
                                            Manage addresses
                                        </Link>
                                    </div>

                                    {addresses.length > 0 ? (
                                        <div className="geeka-checkout-address-list">
                                            {addresses.map((address) => (
                                                <AddressCard
                                                    key={address.id}
                                                    address={address}
                                                    selected={
                                                        String(address.id) ===
                                                        String(selectedAddressId)
                                                    }
                                                    onSelect={() =>
                                                        setSelectedAddressId(
                                                            String(address.id)
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="geeka-checkout-no-address">
                                            <h4>No saved address yet</h4>
                                            <p>
                                                Add your delivery address in
                                                your profile before proceeding.
                                            </p>
                                            <Link
                                                to="/profile?section=addresses"
                                                className="geeka-checkout-secondary"
                                            >
                                                Add delivery address
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="geeka-checkout-panel-footer">
                                    <span>
                                        You can review everything before
                                        placing your order.
                                    </span>

                                    <button
                                        type="button"
                                        className="geeka-checkout-primary"
                                        onClick={continueToReview}
                                        disabled={
                                            !selectedAddress ||
                                            cartItems.length === 0
                                        }
                                    >
                                        Continue to review
                                        <span aria-hidden="true">→</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="geeka-checkout-panel">
                                <div className="geeka-checkout-panel-heading">
                                    <div>
                                        <span className="geeka-checkout-section-label">
                                            STEP 02
                                        </span>
                                        <h2>Review your order</h2>
                                        <p>
                                            Check your items and delivery
                                            details before continuing.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="geeka-checkout-edit"
                                        onClick={() => goToStep(1)}
                                    >
                                        Edit details
                                    </button>
                                </div>

                                <div className="geeka-checkout-review-block">
                                    <div className="geeka-checkout-review-heading">
                                        <h3>Items in your bag</h3>
                                        <Link to="/cart">Edit bag</Link>
                                    </div>

                                    <div className="geeka-checkout-items">
                                        {cartItems.map((item, index) => (
                                            <CheckoutItem
                                                key={
                                                    item.id ||
                                                    item.variant_id ||
                                                    `${item.product_id}-${index}`
                                                }
                                                item={item}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="geeka-checkout-review-block">
                                    <div className="geeka-checkout-review-heading">
                                        <h3>Delivering to</h3>
                                        <button
                                            type="button"
                                            className="geeka-checkout-edit"
                                            onClick={() => goToStep(1)}
                                        >
                                            Change
                                        </button>
                                    </div>

                                    {selectedAddress && (
                                        <div className="geeka-checkout-review-address">
                                            <strong>
                                                {selectedAddress.recipient_name}
                                            </strong>
                                            <p>
                                                {getAddressText(selectedAddress)}
                                            </p>
                                            <p>
                                                {selectedAddress.phone_number}
                                            </p>
                                        </div>
                                    )}

                                    <div className="geeka-checkout-contact-summary">
                                        <span>{contact.name}</span>
                                        <span>{contact.email}</span>
                                        <span>{contact.phone}</span>
                                    </div>
                                </div>

                                <div className="geeka-checkout-panel-footer">
                                    <button
                                        type="button"
                                        className="geeka-checkout-secondary"
                                        onClick={() => goToStep(1)}
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="button"
                                        className="geeka-checkout-primary"
                                        onClick={continueToPayment}
                                    >
                                        Continue to payment
                                        <span aria-hidden="true">→</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="geeka-checkout-panel">
                                <div className="geeka-checkout-panel-heading">
                                    <div>
                                        <span className="geeka-checkout-section-label">
                                            STEP 03
                                        </span>
                                        <h2>Payment</h2>
                                        <p>
                                            Your order total is ready. Payment
                                            processing is not connected yet.
                                        </p>
                                    </div>
                                </div>

                                <div className="geeka-checkout-payment-card">
                                    <div className="geeka-checkout-payment-icon">
                                        ₹
                                    </div>

                                    <div className="geeka-checkout-payment-copy">
                                        <h3>Online payment</h3>
                                        <p>
                                            Razorpay and payment verification
                                            need to be enabled on the backend
                                            before Geeka can collect payment.
                                        </p>
                                        <span className="geeka-checkout-payment-status">
                                            Payment gateway not connected
                                        </span>
                                    </div>
                                </div>

                                <div className="geeka-checkout-pending-notice">
                                    <strong>Important</strong>
                                    <p>
                                        Placing this order will currently create
                                        an unpaid order with PENDING payment
                                        status. No payment will be collected on
                                        this screen. The backend also reserves
                                        stock when the order is created.
                                    </p>
                                </div>

                                <div className="geeka-checkout-final-address">
                                    <span>DELIVERY ADDRESS</span>
                                    <strong>
                                        {selectedAddress?.recipient_name}
                                    </strong>
                                    <p>
                                        {selectedAddress
                                            ? getAddressText(selectedAddress)
                                            : ""}
                                    </p>
                                </div>

                                <div className="geeka-checkout-panel-footer">
                                    <button
                                        type="button"
                                        className="geeka-checkout-secondary"
                                        onClick={() => goToStep(2)}
                                        disabled={submitting}
                                    >
                                        Back to review
                                    </button>

                                    <button
                                        type="button"
                                        className="geeka-checkout-primary"
                                        onClick={placeOrder}
                                        disabled={
                                            submitting ||
                                            cartItems.length === 0 ||
                                            !selectedAddress
                                        }
                                    >
                                        {submitting
                                            ? "Placing order..."
                                            : "Place unpaid order"}
                                        {!submitting && (
                                            <span aria-hidden="true">→</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="geeka-checkout-summary">
                        <div className="geeka-checkout-summary-heading">
                            <h2>Order summary</h2>
                            <span>
                                {cartItems.reduce(
                                    (sum, item) =>
                                        sum + (Number(item.quantity) || 1),
                                    0
                                )}{" "}
                                items
                            </span>
                        </div>

                        <div className="geeka-checkout-summary-items">
                            {cartItems.slice(0, 3).map((item, index) => (
                                <div
                                    className="geeka-checkout-mini-item"
                                    key={
                                        item.id ||
                                        item.variant_id ||
                                        `${item.product_id}-${index}`
                                    }
                                >
                                    <span>{getItemName(item)}</span>
                                    <strong>
                                        {formatCurrency(getItemSubtotal(item))}
                                    </strong>
                                </div>
                            ))}

                            {cartItems.length > 3 && (
                                <p className="geeka-checkout-more-items">
                                    + {cartItems.length - 3} more products
                                </p>
                            )}
                        </div>

                        <div className="geeka-checkout-price-lines">
                            <div>
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            <div>
                                <span>Shipping</span>
                                <span className="geeka-checkout-free">
                                    {shipping === 0
                                        ? "Free"
                                        : formatCurrency(shipping)}
                                </span>
                            </div>

                            {discount > 0 && (
                                <div>
                                    <span>Discount</span>
                                    <span>
                                        −{formatCurrency(discount)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="geeka-checkout-total">
                            <div>
                                <strong>Total</strong>
                                <span>Inclusive of applicable charges</span>
                            </div>

                            <strong>{formatCurrency(total)}</strong>
                        </div>

                        <div className="geeka-checkout-summary-note">
                            <span aria-hidden="true">✓</span>
                            <p>
                                Your order total is calculated by the
                                backend. Final amounts are confirmed when
                                your order is created.
                            </p>
                        </div>

                        <Link to="/cart" className="geeka-checkout-summary-link">
                            Return to bag
                        </Link>
                    </aside>
                </div>

                <footer className="geeka-checkout-footer">
                    <span>GEEKA</span>
                    <p>Made with meaning. Chosen with care.</p>
                </footer>
            </div>
        </main>
    );
}
