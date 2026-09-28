import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import "../style/Profile.css";

import profileBackground from "../assets/profile.png";

import {
    getProducts,
} from "../services/productService";


/*
|--------------------------------------------------------------------------
| BACKEND
|--------------------------------------------------------------------------
*/

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://geeka-backend.onrender.com";


/*
|--------------------------------------------------------------------------
| STORAGE KEYS
|--------------------------------------------------------------------------
*/

const PROFILE_STORAGE_KEY =
    "geeka-profile";

const ADDRESS_STORAGE_KEY =
    "geeka-addresses";

const PAYMENT_STORAGE_KEY =
    "geeka-payment-methods";

const SETTINGS_STORAGE_KEY =
    "geeka-settings";

const ORDERS_STORAGE_KEY =
    "geeka-orders";

const WISHLIST_STORAGE_KEY =
    "geeka-wishlist";

const USER_STORAGE_KEY =
    "geeka-user";


/*
|--------------------------------------------------------------------------
| BACKEND PHONE VERIFICATION ENDPOINTS
|--------------------------------------------------------------------------
*/

const PHONE_SEND_OTP_URL =
    `${API_URL}/api/v1/account/phone/send-otp/`;

const PHONE_VERIFY_OTP_URL =
    `${API_URL}/api/v1/account/phone/verify-otp/`;


/*
|--------------------------------------------------------------------------
| BACKEND AUTH ENDPOINTS
|--------------------------------------------------------------------------
*/

const ME_URL =
    `${API_URL}/api/v1/auth/me/`;

const CSRF_URL =
    `${API_URL}/api/v1/auth/csrf/`;

const LOGOUT_URL =
    `${API_URL}/api/v1/auth/logout/`;


/*
|--------------------------------------------------------------------------
| OTP SETTINGS
|--------------------------------------------------------------------------
*/

const OTP_LENGTH = 6;

const OTP_RESEND_SECONDS = 60;


/*
|--------------------------------------------------------------------------
| STORAGE HELPERS
|--------------------------------------------------------------------------
*/

function readStorage(
    key,
    fallback
) {
    try {
        const saved =
            localStorage.getItem(
                key
            );

        if (!saved) {
            return fallback;
        }

        const parsed =
            JSON.parse(saved);

        return (
            parsed ??
            fallback
        );
    } catch {
        return fallback;
    }
}


function writeStorage(
    key,
    value
) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );
    } catch {
        // Keep UI working if localStorage is unavailable.
    }
}


function removeStorage(
    key
) {
    try {
        localStorage.removeItem(
            key
        );
    } catch {
        // Ignore storage errors.
    }
}


function createId(
    prefix = "item"
) {
    if (
        typeof crypto !==
        "undefined" &&
        typeof crypto.randomUUID ===
        "function"
    ) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}


/*
|--------------------------------------------------------------------------
| WISHLIST NORMALIZATION
|--------------------------------------------------------------------------

   Your other components may currently save either:

   ["12", "15"]

   OR

   [
       { id: 12, name: "...", ... },
       { id: 15, name: "...", ... }
   ]

   The Profile page only needs product IDs to load the real
   products from the backend, so everything is normalized here.
|--------------------------------------------------------------------------
*/

function normalizeWishlistIds(
    value
) {
    if (!Array.isArray(value)) {
        return [];
    }


    const ids = value
        .map((item) => {

            if (
                item &&
                typeof item ===
                "object"
            ) {
                return item.id;
            }

            return item;
        })
        .filter(
            (id) =>
                id !== null &&
                id !== undefined &&
                String(id).trim() !== ""
        )
        .map((id) =>
            String(id)
        );


    return [
        ...new Set(ids),
    ];
}


function wishlistIdsSignature(
    value
) {
    return normalizeWishlistIds(
        value
    )
        .sort()
        .join("|");
}


/*
|--------------------------------------------------------------------------
| RESPONSE HELPER
|--------------------------------------------------------------------------
*/

async function readResponseData(
    response
) {
    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        try {
            return await response.json();
        } catch {
            return {};
        }
    }


    try {
        const text =
            await response.text();

        return text
            ? {
                message: text,
            }
            : {};
    } catch {
        return {};
    }
}


/*
|--------------------------------------------------------------------------
| COOKIE HELPER
|--------------------------------------------------------------------------
*/

function getCookie(
    name
) {
    if (
        typeof document ===
        "undefined"
    ) {
        return null;
    }


    const cookies =
        document.cookie.split(
            ";"
        );


    for (
        const cookie of cookies
    ) {
        const trimmed =
            cookie.trim();


        if (
            trimmed.startsWith(
                `${name}=`
            )
        ) {
            return decodeURIComponent(
                trimmed.substring(
                    name.length + 1
                )
            );
        }
    }


    return null;
}


/*
|--------------------------------------------------------------------------
| DEFAULT DATA
|--------------------------------------------------------------------------
*/

const DEFAULT_PROFILE = {
    name: "",
    email: "",
    phone: "",
    phoneVerified: false,
    emailVerified: false,
};


const DEFAULT_SETTINGS = {
    orderUpdates: true,
    promotionalEmails: false,
    productRecommendations: true,
};


const EMPTY_ADDRESS = {
    label: "Home",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    isDefault: false,
};


/*
|--------------------------------------------------------------------------
| ICONS
|--------------------------------------------------------------------------
*/

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M4 12h15" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}


function PlusIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </svg>
    );
}


function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m4 16.5-.7 3.7 3.7-.7L17.9 8.6 15.4 6.1 4 16.5Z" />
            <path d="m14.8 6.7 2.5 2.5" />
            <path d="M19 4.8a1.8 1.8 0 0 1 0 2.5L18 8.3l-2.5-2.5 1-1a1.8 1.8 0 0 1 2.5 0Z" />
        </svg>
    );
}


function TrashIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="m7 7 .8 13h8.4L17 7" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
        </svg>
    );
}


function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}


function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}


/*
|--------------------------------------------------------------------------
| MAIN COMPONENT
|--------------------------------------------------------------------------
*/

export default function Profile() {

    const navigate =
        useNavigate();


    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();


    const [
        activeSection,
        setActiveSection,
    ] = useState(
        "profile"
    );


    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED USER
    |--------------------------------------------------------------------------
    */

    const [
        accountLoading,
        setAccountLoading,
    ] = useState(true);


    const [
        accountUser,
        setAccountUser,
    ] = useState(null);


    const [
        accountError,
        setAccountError,
    ] = useState("");


    const [
        loggingOut,
        setLoggingOut,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | SYNC ACTIVE SECTION
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const section =
            searchParams.get(
                "section"
            );


        const allowedSections = [
            "profile",
            "orders",
            "wishlist",
            "addresses",
            "payments",
            "settings",
        ];


        if (
            section &&
            allowedSections.includes(
                section
            )
        ) {
            setActiveSection(
                section
            );
        } else if (
            !section
        ) {
            setActiveSection(
                "profile"
            );
        }

    }, [
        searchParams,
    ]);


    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    const [
        profile,
        setProfile,
    ] = useState(() => {

        const savedProfile =
            readStorage(
                PROFILE_STORAGE_KEY,
                {}
            );


        const savedUser =
            readStorage(
                USER_STORAGE_KEY,
                {}
            );


        return {
            ...DEFAULT_PROFILE,
            ...(savedUser || {}),
            ...(savedProfile || {}),
        };

    });


    const [
        profileDraft,
        setProfileDraft,
    ] = useState(
        profile
    );


    const [
        editingProfile,
        setEditingProfile,
    ] = useState(false);


    const [
        profileMessage,
        setProfileMessage,
    ] = useState("");


    const [
        profileMessageType,
        setProfileMessageType,
    ] = useState(
        "success"
    );


    /*
    |--------------------------------------------------------------------------
    | LOAD CURRENT AUTHENTICATED USER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let cancelled = false;


        async function loadCurrentUser() {

            setAccountLoading(
                true
            );

            setAccountError(
                ""
            );


            try {

                const response =
                    await fetch(
                        ME_URL,
                        {
                            method: "GET",

                            credentials:
                                "include",

                            cache:
                                "no-store",

                            headers: {
                                Accept:
                                    "application/json",
                            },
                        }
                    );


                const data =
                    await readResponseData(
                        response
                    );


                if (
                    response.status ===
                    401 ||
                    response.status ===
                    403
                ) {

                    if (
                        !cancelled
                    ) {

                        setAccountUser(
                            null
                        );


                        setAccountError(
                            "Your session has expired. Please log in again."
                        );


                        removeStorage(
                            USER_STORAGE_KEY
                        );


                        navigate(
                            "/login",
                            {
                                replace:
                                    true,
                            }
                        );

                    }


                    return;
                }


                if (
                    !response.ok
                ) {
                    throw new Error(
                        data.message ||
                        data.error ||
                        "Unable to load your account."
                    );
                }


                const remoteUser =
                    data.user;


                if (
                    !remoteUser ||
                    !remoteUser.email
                ) {
                    throw new Error(
                        "The account response is incomplete."
                    );
                }


                if (
                    !cancelled
                ) {

                    setAccountUser(
                        remoteUser
                    );


                    setProfile(
                        (current) => {

                            const updatedProfile =
                            {
                                ...current,

                                name:
                                    remoteUser.full_name ||
                                    current.name ||
                                    "",

                                email:
                                    remoteUser.email ||
                                    current.email ||
                                    "",

                                emailVerified:
                                    remoteUser.email_verified !==
                                        undefined
                                        ? Boolean(
                                            remoteUser.email_verified
                                        )
                                        : Boolean(
                                            current.emailVerified
                                        ),
                            };


                            writeStorage(
                                PROFILE_STORAGE_KEY,
                                updatedProfile
                            );


                            const existingUser =
                                readStorage(
                                    USER_STORAGE_KEY,
                                    {}
                                );


                            writeStorage(
                                USER_STORAGE_KEY,
                                {
                                    ...(existingUser ||
                                        {}),

                                    ...updatedProfile,

                                    id:
                                        remoteUser.id,

                                    full_name:
                                        remoteUser.full_name,

                                    email:
                                        remoteUser.email,

                                    email_verified:
                                        remoteUser.email_verified,
                                }
                            );


                            return updatedProfile;

                        }
                    );


                    setProfileDraft(
                        (currentDraft) => ({
                            ...currentDraft,

                            name:
                                remoteUser.full_name ||
                                currentDraft.name ||
                                "",

                            email:
                                remoteUser.email ||
                                currentDraft.email ||
                                "",

                            emailVerified:
                                remoteUser.email_verified !==
                                    undefined
                                    ? Boolean(
                                        remoteUser.email_verified
                                    )
                                    : Boolean(
                                        currentDraft.emailVerified
                                    ),
                        })
                    );


                    window.dispatchEvent(
                        new Event(
                            "geeka-auth-updated"
                        )
                    );

                }

            } catch (error) {

                if (
                    !cancelled
                ) {

                    setAccountUser(
                        null
                    );


                    setAccountError(
                        error.message ||
                        "Unable to load your account."
                    );

                }

            } finally {

                if (
                    !cancelled
                ) {
                    setAccountLoading(
                        false
                    );
                }

            }
        }


        loadCurrentUser();


        return () => {
            cancelled = true;
        };

    }, [
        navigate,
    ]);


    /*
    |--------------------------------------------------------------------------
    | PHONE OTP
    |--------------------------------------------------------------------------
    */

    const [
        otpSent,
        setOtpSent,
    ] = useState(false);


    const [
        otp,
        setOtp,
    ] = useState("");


    const [
        otpLoading,
        setOtpLoading,
    ] = useState(false);


    const [
        otpVerifying,
        setOtpVerifying,
    ] = useState(false);


    const [
        otpError,
        setOtpError,
    ] = useState("");


    const [
        otpSuccess,
        setOtpSuccess,
    ] = useState("");


    const [
        resendSeconds,
        setResendSeconds,
    ] = useState(0);


    /*
    |--------------------------------------------------------------------------
    | ADDRESSES
    |--------------------------------------------------------------------------
    */

    const [
        addresses,
        setAddresses,
    ] = useState(() =>
        readStorage(
            ADDRESS_STORAGE_KEY,
            []
        )
    );


    const [
        addressFormOpen,
        setAddressFormOpen,
    ] = useState(false);


    const [
        editingAddressId,
        setEditingAddressId,
    ] = useState(null);


    const [
        addressDraft,
        setAddressDraft,
    ] = useState(
        EMPTY_ADDRESS
    );


    /*
    |--------------------------------------------------------------------------
    | PAYMENTS
    |--------------------------------------------------------------------------
    */

    const [
        paymentMethods,
        setPaymentMethods,
    ] = useState(() =>
        readStorage(
            PAYMENT_STORAGE_KEY,
            []
        )
    );


    const [
        paymentFormOpen,
        setPaymentFormOpen,
    ] = useState(false);


    const [
        paymentDraft,
        setPaymentDraft,
    ] = useState({
        type: "UPI",
        label: "",
    });


    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    const [
        settings,
        setSettings,
    ] = useState(() =>
        readStorage(
            SETTINGS_STORAGE_KEY,
            DEFAULT_SETTINGS
        )
    );


    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    const [
        orders,
    ] = useState(() =>
        readStorage(
            ORDERS_STORAGE_KEY,
            []
        )
    );


    /*
    |--------------------------------------------------------------------------
    | WISHLIST
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Normalize existing wishlist data immediately.
    |
    | This allows the Wishlist page to understand both:
    |
    |     ["12", "15"]
    |
    | and:
    |
    |     [{ id: 12, ... }, { id: 15, ... }]
    |
    |--------------------------------------------------------------------------
    */

    const [
        wishlistIds,
        setWishlistIds,
    ] = useState(() =>
        normalizeWishlistIds(
            readStorage(
                WISHLIST_STORAGE_KEY,
                []
            )
        )
    );


    const [
        wishlistProducts,
        setWishlistProducts,
    ] = useState([]);


    const [
        wishlistLoading,
        setWishlistLoading,
    ] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | OTP TIMER
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (
            resendSeconds <= 0
        ) {
            return undefined;
        }


        const timer =
            setInterval(
                () => {

                    setResendSeconds(
                        (current) =>
                            current > 0
                                ? current -
                                1
                                : 0
                    );

                },
                1000
            );


        return () =>
            clearInterval(
                timer
            );

    }, [
        resendSeconds,
    ]);


    /*
    |--------------------------------------------------------------------------
    | PERSIST NORMALIZED WISHLIST
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const normalized =
            normalizeWishlistIds(
                wishlistIds
            );


        if (
            wishlistIdsSignature(
                normalized
            ) !==
            wishlistIdsSignature(
                wishlistIds
            )
        ) {

            setWishlistIds(
                normalized
            );

            return;
        }


        writeStorage(
            WISHLIST_STORAGE_KEY,
            normalized
        );

    }, [
        wishlistIds,
    ]);


    /*
    |--------------------------------------------------------------------------
    | LISTEN FOR WISHLIST CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        function syncWishlist() {

            const saved =
                readStorage(
                    WISHLIST_STORAGE_KEY,
                    []
                );


            const normalized =
                normalizeWishlistIds(
                    saved
                );


            setWishlistIds(
                (current) => {

                    const currentSignature =
                        wishlistIdsSignature(
                            current
                        );


                    const nextSignature =
                        wishlistIdsSignature(
                            normalized
                        );


                    if (
                        currentSignature ===
                        nextSignature
                    ) {
                        return current;
                    }


                    return normalized;

                }
            );
        }


        window.addEventListener(
            "storage",
            syncWishlist
        );


        window.addEventListener(
            "geeka-wishlist-updated",
            syncWishlist
        );


        return () => {

            window.removeEventListener(
                "storage",
                syncWishlist
            );


            window.removeEventListener(
                "geeka-wishlist-updated",
                syncWishlist
            );

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | LOAD WISHLIST PRODUCTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        let cancelled = false;


        async function loadWishlist() {

            const normalizedIds =
                normalizeWishlistIds(
                    wishlistIds
                );


            if (
                normalizedIds.length ===
                0
            ) {

                setWishlistProducts(
                    []
                );

                setWishlistLoading(
                    false
                );

                return;
            }


            setWishlistLoading(
                true
            );


            try {

                const products =
                    await getProducts();


                const productList =
                    Array.isArray(
                        products
                    )
                        ? products
                        : [];


                const filtered =
                    productList.filter(
                        (product) =>
                            normalizedIds.some(
                                (savedId) =>
                                    String(
                                        savedId
                                    ) ===
                                    String(
                                        product?.id
                                    )
                            )
                    );


                if (
                    !cancelled
                ) {

                    setWishlistProducts(
                        filtered
                    );

                }

            } catch (
            error
            ) {

                console.error(
                    "GEEKA WISHLIST LOAD ERROR:",
                    error
                );


                if (
                    !cancelled
                ) {

                    setWishlistProducts(
                        []
                    );

                }

            } finally {

                if (
                    !cancelled
                ) {

                    setWishlistLoading(
                        false
                    );

                }

            }
        }


        loadWishlist();


        return () => {
            cancelled = true;
        };

    }, [
        wishlistIds,
    ]);


    /*
    |--------------------------------------------------------------------------
    | SAVE LOCAL DATA
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        writeStorage(
            PROFILE_STORAGE_KEY,
            profile
        );

    }, [
        profile,
    ]);


    useEffect(() => {

        writeStorage(
            ADDRESS_STORAGE_KEY,
            addresses
        );

    }, [
        addresses,
    ]);


    useEffect(() => {

        writeStorage(
            PAYMENT_STORAGE_KEY,
            paymentMethods
        );

    }, [
        paymentMethods,
    ]);


    useEffect(() => {

        writeStorage(
            SETTINGS_STORAGE_KEY,
            settings
        );

    }, [
        settings,
    ]);


    /*
    |--------------------------------------------------------------------------
    | PROFILE DISPLAY
    |--------------------------------------------------------------------------
    */

    const initials =
        useMemo(() => {

            const name =
                profile.name?.trim();


            if (!name) {
                return "G";
            }


            return (
                name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map(
                        (word) =>
                            word[0]
                    )
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() ||
                "G"
            );

        }, [
            profile.name,
        ]);


    const displayName =
        accountUser?.full_name?.trim() ||
        profile.name?.trim() ||
        "Guest";


    const displayEmail =
        accountUser?.email?.trim() ||
        profile.email?.trim() ||
        "Not added yet";


    const formatPrice =
        (value) => {

            return `₹${Number(
                value || 0
            ).toLocaleString(
                "en-IN"
            )}`;

        };


    const formatDate =
        (value) => {

            if (!value) {
                return "—";
            }


            const date =
                new Date(
                    value
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return value;
            }


            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );

        };


    /*
    |--------------------------------------------------------------------------
    | PROFILE EDITING
    |--------------------------------------------------------------------------
    */

    function startProfileEditing() {

        setProfileDraft({
            ...profile,
        });


        setEditingProfile(
            true
        );


        setProfileMessage(
            ""
        );


        setProfileMessageType(
            "success"
        );


        setOtpSent(
            false
        );


        setOtp(
            ""
        );


        setOtpError(
            ""
        );


        setOtpSuccess(
            ""
        );


        setResendSeconds(
            0
        );
    }


    function cancelProfileEditing() {

        setProfileDraft({
            ...profile,
        });


        setEditingProfile(
            false
        );


        setProfileMessage(
            ""
        );


        setOtpSent(
            false
        );


        setOtp(
            ""
        );


        setOtpError(
            ""
        );


        setOtpSuccess(
            ""
        );


        setResendSeconds(
            0
        );
    }


    function handleProfileChange(
        event
    ) {

        const {
            name,
            value,
        } = event.target;


        if (
            name === "phone"
        ) {

            const phone =
                value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        10
                    );


            setProfileDraft(
                (current) => ({
                    ...current,

                    phone,

                    phoneVerified:
                        false,
                })
            );


            setOtpSent(
                false
            );


            setOtp(
                ""
            );


            setOtpError(
                ""
            );


            setOtpSuccess(
                ""
            );


            setResendSeconds(
                0
            );


            return;
        }


        setProfileDraft(
            (current) => ({
                ...current,

                [name]:
                    value,
            })
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PHONE HELPERS
    |--------------------------------------------------------------------------
    */

    function getPhoneDigits() {

        return (
            profileDraft.phone ||
            ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                10
            );
    }


    function isValidPhoneNumber(
        phone
    ) {

        return /^[6-9]\d{9}$/.test(
            phone
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SEND OTP
    |--------------------------------------------------------------------------
    */

    async function sendPhoneOtp() {

        const phone =
            getPhoneDigits();


        setOtpError(
            ""
        );


        setOtpSuccess(
            ""
        );


        if (
            !isValidPhoneNumber(
                phone
            )
        ) {

            setOtpError(
                "Enter a valid 10-digit mobile number."
            );


            return;
        }


        if (
            otpLoading ||
            resendSeconds > 0
        ) {
            return;
        }


        setOtpLoading(
            true
        );


        try {

            const response =
                await fetch(
                    PHONE_SEND_OTP_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(
                                {
                                    phone:
                                        `+91${phone}`,
                                }
                            ),
                    }
                );


            const data =
                await readResponseData(
                    response
                );


            if (
                response.status ===
                401 ||
                response.status ===
                403
            ) {

                navigate(
                    "/login",
                    {
                        replace:
                            true,
                    }
                );


                return;
            }


            if (
                !response.ok
            ) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Unable to send OTP."
                );

            }


            setOtpSent(
                true
            );


            setOtp(
                ""
            );


            setResendSeconds(
                OTP_RESEND_SECONDS
            );


            setOtpSuccess(
                data.message ||
                "OTP sent successfully."
            );

        } catch (
        error
        ) {

            setOtpError(
                error.message ||
                "Unable to send OTP. Please try again."
            );

        } finally {

            setOtpLoading(
                false
            );

        }
    }


    /*
    |--------------------------------------------------------------------------
    | OTP INPUT
    |--------------------------------------------------------------------------
    */

    function handleOtpChange(
        event
    ) {

        const value =
            event.target.value
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    OTP_LENGTH
                );


        setOtp(
            value
        );


        setOtpError(
            ""
        );


        setOtpSuccess(
            ""
        );
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    async function verifyPhoneOtp() {

        const phone =
            getPhoneDigits();


        setOtpError(
            ""
        );


        setOtpSuccess(
            ""
        );


        if (
            !isValidPhoneNumber(
                phone
            )
        ) {

            setOtpError(
                "Enter a valid 10-digit mobile number first."
            );


            return;
        }


        if (
            otp.length !==
            OTP_LENGTH
        ) {

            setOtpError(
                `Enter the ${OTP_LENGTH}-digit OTP.`
            );


            return;
        }


        setOtpVerifying(
            true
        );


        try {

            const response =
                await fetch(
                    PHONE_VERIFY_OTP_URL,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials:
                            "include",

                        body:
                            JSON.stringify(
                                {
                                    phone:
                                        `+91${phone}`,

                                    otp,
                                }
                            ),
                    }
                );


            const data =
                await readResponseData(
                    response
                );


            if (
                response.status ===
                401 ||
                response.status ===
                403
            ) {

                navigate(
                    "/login",
                    {
                        replace:
                            true,
                    }
                );


                return;
            }


            if (
                !response.ok
            ) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "OTP verification failed."
                );

            }


            const verified =
                data.phone_verified !==
                    undefined
                    ? Boolean(
                        data.phone_verified
                    )
                    : true;


            const verifiedProfile = {
                ...profileDraft,

                phone,

                phoneVerified:
                    verified,
            };


            setProfileDraft(
                verifiedProfile
            );


            setProfile(
                (current) => ({
                    ...current,

                    phone,

                    phoneVerified:
                        verified,
                })
            );


            const existingUser =
                readStorage(
                    USER_STORAGE_KEY,
                    {}
                );


            writeStorage(
                USER_STORAGE_KEY,
                {
                    ...(existingUser ||
                        {}),

                    phone,

                    phoneVerified:
                        verified,
                }
            );


            setOtpSent(
                false
            );


            setOtp(
                ""
            );


            setOtpError(
                ""
            );


            setOtpSuccess(
                data.message ||
                "Mobile number verified successfully."
            );


            setResendSeconds(
                0
            );

        } catch (
        error
        ) {

            setOtpError(
                error.message ||
                "Invalid OTP. Please try again."
            );

        } finally {

            setOtpVerifying(
                false
            );

        }
    }


    /*
    |--------------------------------------------------------------------------
    | SAVE PROFILE
    |--------------------------------------------------------------------------
    */

    function saveProfile(
        event
    ) {

        event.preventDefault();


        const name =
            profileDraft.name.trim();


        const email =
            profileDraft.email.trim();


        const phone =
            getPhoneDigits();


        if (!name) {

            setProfileMessage(
                "Please enter your full name."
            );


            setProfileMessageType(
                "error"
            );


            return;
        }


        if (!email) {

            setProfileMessage(
                "Please enter your email address."
            );


            setProfileMessageType(
                "error"
            );


            return;
        }


        if (
            phone &&
            !isValidPhoneNumber(
                phone
            )
        ) {

            setProfileMessage(
                "Mobile number must contain exactly 10 digits."
            );


            setProfileMessageType(
                "error"
            );


            return;
        }


        if (
            phone &&
            !profileDraft.phoneVerified
        ) {

            setProfileMessage(
                "Please verify your mobile number using OTP before saving."
            );


            setProfileMessageType(
                "error"
            );


            return;
        }


        const updatedProfile = {
            ...profileDraft,

            name,

            email,

            phone,
        };


        setProfile(
            updatedProfile
        );


        const existingUser =
            readStorage(
                USER_STORAGE_KEY,
                {}
            );


        writeStorage(
            USER_STORAGE_KEY,
            {
                ...(existingUser ||
                    {}),

                ...updatedProfile,
            }
        );


        setEditingProfile(
            false
        );


        setProfileMessage(
            "Profile updated successfully."
        );


        setProfileMessageType(
            "success"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ADDRESS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    function openAddAddress() {

        setEditingAddressId(
            null
        );


        setAddressDraft({
            ...EMPTY_ADDRESS,

            fullName:
                profile.name ||
                "",

            phone:
                profile.phone ||
                "",

            isDefault:
                addresses.length ===
                0,
        });


        setAddressFormOpen(
            true
        );
    }


    function openEditAddress(
        address
    ) {

        setEditingAddressId(
            address.id
        );


        setAddressDraft({
            ...EMPTY_ADDRESS,
            ...address,
        });


        setAddressFormOpen(
            true
        );
    }


    function closeAddressForm() {

        setEditingAddressId(
            null
        );


        setAddressDraft(
            EMPTY_ADDRESS
        );


        setAddressFormOpen(
            false
        );
    }


    function handleAddressChange(
        event
    ) {

        const {
            name,
            value,
            type,
            checked,
        } = event.target;


        setAddressDraft(
            (current) => ({
                ...current,

                [name]:
                    type ===
                        "checkbox"
                        ? checked
                        : value,
            })
        );
    }


    function saveAddress(
        event
    ) {

        event.preventDefault();


        if (
            !addressDraft.fullName.trim() ||
            !addressDraft.phone.trim() ||
            !addressDraft.line1.trim() ||
            !addressDraft.city.trim() ||
            !addressDraft.state.trim() ||
            !addressDraft.postalCode.trim()
        ) {
            return;
        }


        const addressId =
            editingAddressId ||
            createId(
                "address"
            );


        const nextAddress = {
            ...addressDraft,

            id:
                addressId,

            fullName:
                addressDraft.fullName.trim(),

            phone:
                addressDraft.phone.trim(),

            line1:
                addressDraft.line1.trim(),

            line2:
                addressDraft.line2.trim(),

            city:
                addressDraft.city.trim(),

            state:
                addressDraft.state.trim(),

            postalCode:
                addressDraft.postalCode.trim(),
        };


        setAddresses(
            (current) => {

                let updated;


                if (
                    editingAddressId
                ) {

                    updated =
                        current.map(
                            (address) =>
                                address.id ===
                                    editingAddressId
                                    ? nextAddress
                                    : address
                        );

                } else {

                    updated = [
                        ...current,
                        nextAddress,
                    ];

                }


                if (
                    nextAddress.isDefault
                ) {

                    return updated.map(
                        (address) => ({
                            ...address,

                            isDefault:
                                address.id ===
                                nextAddress.id,
                        })
                    );

                }


                if (
                    updated.length >
                    0 &&
                    !updated.some(
                        (address) =>
                            address.isDefault
                    )
                ) {

                    return updated.map(
                        (
                            address,
                            index
                        ) => ({
                            ...address,

                            isDefault:
                                index ===
                                0,
                        })
                    );

                }


                return updated;

            }
        );


        closeAddressForm();
    }


    function deleteAddress(
        id
    ) {

        setAddresses(
            (current) => {

                const filtered =
                    current.filter(
                        (address) =>
                            address.id !==
                            id
                    );


                if (
                    filtered.length >
                    0 &&
                    !filtered.some(
                        (address) =>
                            address.isDefault
                    )
                ) {

                    filtered[0] = {
                        ...filtered[0],

                        isDefault:
                            true,
                    };

                }


                return filtered;

            }
        );
    }


    function setDefaultAddress(
        id
    ) {

        setAddresses(
            (current) =>
                current.map(
                    (address) => ({
                        ...address,

                        isDefault:
                            address.id ===
                            id,
                    })
                )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | WISHLIST MANAGEMENT
    |--------------------------------------------------------------------------
    */

    function removeFromWishlist(
        productId
    ) {

        const normalizedId =
            String(
                productId
            );


        const nextWishlist =
            normalizeWishlistIds(
                wishlistIds
            ).filter(
                (id) =>
                    String(id) !==
                    normalizedId
            );


        setWishlistIds(
            nextWishlist
        );


        writeStorage(
            WISHLIST_STORAGE_KEY,
            nextWishlist
        );


        window.dispatchEvent(
            new Event(
                "geeka-wishlist-updated"
            )
        );
    }


    function clearWishlist() {

        const nextWishlist =
            [];


        setWishlistIds(
            nextWishlist
        );


        setWishlistProducts(
            []
        );


        writeStorage(
            WISHLIST_STORAGE_KEY,
            nextWishlist
        );


        window.dispatchEvent(
            new Event(
                "geeka-wishlist-updated"
            )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHODS
    |--------------------------------------------------------------------------
    */

    function openPaymentForm() {

        setPaymentDraft({
            type: "UPI",
            label: "",
        });


        setPaymentFormOpen(
            true
        );
    }


    function closePaymentForm() {

        setPaymentFormOpen(
            false
        );


        setPaymentDraft({
            type: "UPI",
            label: "",
        });
    }


    function handlePaymentChange(
        event
    ) {

        const {
            name,
            value,
        } = event.target;


        setPaymentDraft(
            (current) => ({
                ...current,

                [name]:
                    value,
            })
        );
    }


    function savePaymentMethod(
        event
    ) {

        event.preventDefault();


        const label =
            paymentDraft.label.trim();


        if (!label) {
            return;
        }


        setPaymentMethods(
            (current) => [
                ...current,

                {
                    id:
                        createId(
                            "payment"
                        ),

                    type:
                        paymentDraft.type,

                    label,
                },
            ]
        );


        closePaymentForm();
    }


    function removePaymentMethod(
        id
    ) {

        setPaymentMethods(
            (current) =>
                current.filter(
                    (method) =>
                        method.id !==
                        id
                )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    function toggleSetting(
        key
    ) {

        setSettings(
            (current) => ({
                ...current,

                [key]:
                    !current[key],
            })
        );
    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    async function handleLogout() {

        if (
            loggingOut
        ) {
            return;
        }


        setLoggingOut(
            true
        );


        setAccountError(
            ""
        );


        setProfileMessage(
            ""
        );


        try {

            const csrfResponse =
                await fetch(
                    CSRF_URL,
                    {
                        method:
                            "GET",

                        credentials:
                            "include",

                        headers: {
                            Accept:
                                "application/json",
                        },
                    }
                );


            const csrfData =
                await readResponseData(
                    csrfResponse
                );


            if (
                !csrfResponse.ok
            ) {

                throw new Error(
                    csrfData.message ||
                    csrfData.error ||
                    `Unable to initialize CSRF protection (${csrfResponse.status}).`
                );
            }


            const csrfCookie =
                getCookie(
                    "csrftoken"
                );


            const csrfToken =
                csrfCookie ||
                csrfData?.csrfToken ||
                "";


            if (
                !csrfToken
            ) {

                throw new Error(
                    "CSRF token is missing. Please refresh the page and try again."
                );
            }


            const logoutResponse =
                await fetch(
                    LOGOUT_URL,
                    {
                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {
                            Accept:
                                "application/json",

                            "Content-Type":
                                "application/json",

                            "X-CSRFToken":
                                csrfToken,
                        },

                        body:
                            JSON.stringify(
                                {}
                            ),
                    }
                );


            const logoutData =
                await readResponseData(
                    logoutResponse
                );


            if (
                !logoutResponse.ok
            ) {

                throw new Error(
                    logoutData.message ||
                    logoutData.error ||
                    `Logout failed with status ${logoutResponse.status}.`
                );
            }


            const authKeys = [
                "geeka-auth",
                USER_STORAGE_KEY,
                "access_token",
                "refresh_token",
                "token",
            ];


            authKeys.forEach(
                (key) =>
                    removeStorage(
                        key
                    )
            );


            removeStorage(
                PROFILE_STORAGE_KEY
            );


            setAccountUser(
                null
            );


            setProfile({
                ...DEFAULT_PROFILE,
            });


            setProfileDraft({
                ...DEFAULT_PROFILE,
            });


            window.dispatchEvent(
                new Event(
                    "geeka-auth-updated"
                )
            );


            navigate(
                "/login",
                {
                    replace:
                        true,
                }
            );

        } catch (
        error
        ) {

            console.error(
                "GEEKA LOGOUT ERROR:",
                error
            );


            setProfileMessage(
                error.message ||
                "Unable to log out. Please try again."
            );


            setProfileMessageType(
                "error"
            );


            setAccountError(
                error.message ||
                "Unable to log out. Please try again."
            );

        } finally {

            setLoggingOut(
                false
            );

        }
    }


    /*
    |--------------------------------------------------------------------------
    | MENU
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | CONTENT
    |--------------------------------------------------------------------------
    */

    const renderProfileContent =
        () => {

            switch (
            activeSection
            ) {

                /*
                |--------------------------------------------------------------------------
                | ORDERS
                |--------------------------------------------------------------------------
                */

                case "orders":

                    return (
                        <section className="account-content-panel">

                            <div className="account-content-header">

                                <div>
                                    <span>
                                        SHOPPING
                                    </span>

                                    <h2>
                                        My Orders
                                    </h2>
                                </div>


                                <Link
                                    to="/shop"
                                    className="account-outline-button"
                                >
                                    CONTINUE SHOPPING
                                    <ArrowIcon />
                                </Link>

                            </div>


                            {orders.length ===
                                0 ? (

                                <div className="account-empty-state">

                                    <div className="account-empty-mark">
                                        —
                                    </div>


                                    <h3>
                                        No orders yet
                                    </h3>


                                    <p>
                                        Your order history will appear
                                        here after you complete a purchase.
                                    </p>


                                    <Link
                                        to="/shop"
                                        className="account-primary-button"
                                    >
                                        START SHOPPING
                                        <ArrowIcon />
                                    </Link>

                                </div>

                            ) : (

                                <div className="account-order-list">

                                    {orders.map(
                                        (order) => (

                                            <article
                                                key={
                                                    order.id ||
                                                    order.orderId
                                                }
                                                className="account-order-card"
                                            >

                                                <div className="account-order-top">

                                                    <div>

                                                        <span>
                                                            ORDER
                                                        </span>

                                                        <strong>
                                                            {
                                                                order.orderId ||
                                                                order.id ||
                                                                "Order"
                                                            }
                                                        </strong>

                                                    </div>


                                                    <span className="account-order-status">
                                                        {
                                                            order.status ||
                                                            "Placed"
                                                        }
                                                    </span>

                                                </div>


                                                <div className="account-order-meta">

                                                    <div>
                                                        <span>
                                                            PLACED ON
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatDate(
                                                                    order.createdAt ||
                                                                    order.date
                                                                )
                                                            }
                                                        </strong>
                                                    </div>


                                                    <div>
                                                        <span>
                                                            ITEMS
                                                        </span>

                                                        <strong>
                                                            {
                                                                order.itemCount ??
                                                                order.items?.length ??
                                                                0
                                                            }
                                                        </strong>
                                                    </div>


                                                    <div>
                                                        <span>
                                                            TOTAL
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatPrice(
                                                                    order.total
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                            </article>

                                        )
                                    )}

                                </div>

                            )}

                        </section>
                    );


                /*
                |--------------------------------------------------------------------------
                | WISHLIST
                |--------------------------------------------------------------------------
                */

                case "wishlist":

                    return (
                        <section className="account-content-panel">

                            <div className="account-content-header">

                                <div>

                                    <span>
                                        SAVED ITEMS
                                    </span>


                                    <h2>
                                        Wishlist
                                    </h2>

                                </div>


                                {wishlistProducts.length >
                                    0 && (

                                        <button
                                            type="button"
                                            className="account-outline-button"
                                            onClick={
                                                clearWishlist
                                            }
                                        >
                                            CLEAR WISHLIST
                                        </button>

                                    )}

                            </div>


                            {wishlistLoading ? (

                                <div className="account-empty-state">

                                    <div className="account-empty-mark">
                                        —
                                    </div>


                                    <h3>
                                        Loading wishlist
                                    </h3>


                                    <p>
                                        Fetching your saved products.
                                    </p>

                                </div>

                            ) : wishlistProducts.length ===
                                0 ? (

                                <div className="account-empty-state">

                                    <div className="account-empty-mark">
                                        ♡
                                    </div>


                                    <h3>
                                        Your wishlist is empty
                                    </h3>


                                    <p>
                                        Save products from the Shop and
                                        they will appear here.
                                    </p>


                                    <Link
                                        to="/shop"
                                        className="account-primary-button"
                                    >
                                        EXPLORE COLLECTION
                                        <ArrowIcon />
                                    </Link>

                                </div>

                            ) : (

                                <div className="account-wishlist-grid">

                                    {wishlistProducts.map(
                                        (product) => (

                                            <article
                                                key={
                                                    product.id
                                                }
                                                className="account-wishlist-card"
                                            >

                                                <div className="account-wishlist-image">

                                                    {product.image ? (

                                                        <img
                                                            src={
                                                                product.image
                                                            }
                                                            alt={
                                                                product.name
                                                            }
                                                        />

                                                    ) : (

                                                        <div className="account-wishlist-image-placeholder" />

                                                    )}


                                                    <button
                                                        type="button"
                                                        className="account-icon-button"
                                                        onClick={() =>
                                                            removeFromWishlist(
                                                                product.id
                                                            )
                                                        }
                                                        aria-label={`Remove ${product.name} from wishlist`}
                                                    >
                                                        <CloseIcon />
                                                    </button>

                                                </div>


                                                <div className="account-wishlist-info">

                                                    <span>
                                                        {
                                                            product.category
                                                        }
                                                    </span>


                                                    <h3>
                                                        {
                                                            product.name
                                                        }
                                                    </h3>


                                                    <strong>
                                                        {
                                                            formatPrice(
                                                                product.price
                                                            )
                                                        }
                                                    </strong>


                                                    <Link
                                                        to="/shop"
                                                        className="account-text-button"
                                                    >
                                                        VIEW PRODUCT
                                                        <ArrowIcon />
                                                    </Link>

                                                </div>

                                            </article>

                                        )
                                    )}

                                </div>

                            )}

                        </section>
                    );


                /*
                |--------------------------------------------------------------------------
                | ADDRESSES
                |--------------------------------------------------------------------------
                */

                case "addresses":

                    return (
                        <section className="account-content-panel">

                            <div className="account-content-header">

                                <div>
                                    <span>
                                        DELIVERY
                                    </span>

                                    <h2>
                                        Saved Addresses
                                    </h2>
                                </div>


                                <button
                                    type="button"
                                    className="account-outline-button"
                                    onClick={
                                        openAddAddress
                                    }
                                >
                                    ADD ADDRESS
                                    <PlusIcon />
                                </button>

                            </div>


                            {addresses.length ===
                                0 ? (

                                <div className="account-empty-state">

                                    <div className="account-empty-mark">
                                        +
                                    </div>


                                    <h3>
                                        No saved addresses
                                    </h3>


                                    <p>
                                        Add an address so checkout can be
                                        faster next time.
                                    </p>


                                    <button
                                        type="button"
                                        className="account-primary-button"
                                        onClick={
                                            openAddAddress
                                        }
                                    >
                                        ADD YOUR FIRST ADDRESS
                                        <PlusIcon />
                                    </button>

                                </div>

                            ) : (

                                <div className="account-address-list">

                                    {addresses.map(
                                        (address) => (

                                            <article
                                                key={
                                                    address.id
                                                }
                                                className={`account-address-card ${address.isDefault
                                                        ? "default"
                                                        : ""
                                                    }`}
                                            >

                                                <div className="account-address-top">

                                                    <div>

                                                        <span>
                                                            {
                                                                address.label ||
                                                                "ADDRESS"
                                                            }
                                                        </span>


                                                        {address.isDefault && (

                                                            <strong className="account-default-badge">
                                                                DEFAULT
                                                            </strong>

                                                        )}

                                                    </div>


                                                    <div className="account-address-actions">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditAddress(
                                                                    address
                                                                )
                                                            }
                                                            aria-label="Edit address"
                                                        >
                                                            <EditIcon />
                                                        </button>


                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteAddress(
                                                                    address.id
                                                                )
                                                            }
                                                            aria-label="Delete address"
                                                        >
                                                            <TrashIcon />
                                                        </button>

                                                    </div>

                                                </div>


                                                <div className="account-address-body">

                                                    <strong>
                                                        {
                                                            address.fullName
                                                        }
                                                    </strong>


                                                    <p>
                                                        {
                                                            address.phone
                                                        }
                                                    </p>


                                                    <p>

                                                        {
                                                            address.line1
                                                        }


                                                        {address.line2 && (
                                                            <>
                                                                <br />

                                                                {
                                                                    address.line2
                                                                }
                                                            </>
                                                        )}

                                                    </p>


                                                    <p>
                                                        {
                                                            address.city
                                                        }
                                                        ,{" "}
                                                        {
                                                            address.state
                                                        }{" "}
                                                        {
                                                            address.postalCode
                                                        }
                                                    </p>

                                                </div>


                                                {!address.isDefault && (

                                                    <button
                                                        type="button"
                                                        className="account-text-button"
                                                        onClick={() =>
                                                            setDefaultAddress(
                                                                address.id
                                                            )
                                                        }
                                                    >
                                                        MAKE DEFAULT
                                                        <CheckIcon />
                                                    </button>

                                                )}

                                            </article>

                                        )
                                    )}

                                </div>

                            )}


                            {addressFormOpen && (

                                <div className="account-form-card">

                                    <div className="account-form-heading">

                                        <div>

                                            <span>
                                                DELIVERY
                                            </span>


                                            <h3>
                                                {editingAddressId
                                                    ? "Edit Address"
                                                    : "Add Address"}
                                            </h3>

                                        </div>


                                        <button
                                            type="button"
                                            className="account-icon-button"
                                            onClick={
                                                closeAddressForm
                                            }
                                            aria-label="Close address form"
                                        >
                                            <CloseIcon />
                                        </button>

                                    </div>


                                    <form
                                        className="account-form"
                                        onSubmit={
                                            saveAddress
                                        }
                                    >

                                        <div className="account-form-grid">

                                            <div className="account-form-field">

                                                <label>
                                                    Address Label
                                                </label>


                                                <select
                                                    name="label"
                                                    value={
                                                        addressDraft.label
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                >

                                                    <option value="Home">
                                                        Home
                                                    </option>


                                                    <option value="Work">
                                                        Work
                                                    </option>


                                                    <option value="Other">
                                                        Other
                                                    </option>

                                                </select>

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    Full Name
                                                </label>


                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={
                                                        addressDraft.fullName
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="Enter full name"
                                                    required
                                                />

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    Phone Number
                                                </label>


                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={
                                                        addressDraft.phone
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="Enter phone number"
                                                    required
                                                />

                                            </div>


                                            <div className="account-form-field account-form-field-full">

                                                <label>
                                                    Address Line 1
                                                </label>


                                                <input
                                                    type="text"
                                                    name="line1"
                                                    value={
                                                        addressDraft.line1
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="House number, street, locality"
                                                    required
                                                />

                                            </div>


                                            <div className="account-form-field account-form-field-full">

                                                <label>
                                                    Address Line 2
                                                </label>


                                                <input
                                                    type="text"
                                                    name="line2"
                                                    value={
                                                        addressDraft.line2
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="Apartment, landmark, etc."
                                                />

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    City
                                                </label>


                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={
                                                        addressDraft.city
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="City"
                                                    required
                                                />

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    State
                                                </label>


                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={
                                                        addressDraft.state
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="State"
                                                    required
                                                />

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    Postal Code
                                                </label>


                                                <input
                                                    type="text"
                                                    name="postalCode"
                                                    value={
                                                        addressDraft.postalCode
                                                    }
                                                    onChange={
                                                        handleAddressChange
                                                    }
                                                    placeholder="Postal code"
                                                    required
                                                />

                                            </div>

                                        </div>


                                        <label className="account-checkbox-row">

                                            <input
                                                type="checkbox"
                                                name="isDefault"
                                                checked={
                                                    addressDraft.isDefault
                                                }
                                                onChange={
                                                    handleAddressChange
                                                }
                                            />


                                            <span>
                                                Set as default address
                                            </span>

                                        </label>


                                        <div className="account-form-actions">

                                            <button
                                                type="button"
                                                className="account-secondary-button"
                                                onClick={
                                                    closeAddressForm
                                                }
                                            >
                                                CANCEL
                                            </button>


                                            <button
                                                type="submit"
                                                className="account-primary-button"
                                            >
                                                {editingAddressId
                                                    ? "SAVE ADDRESS"
                                                    : "ADD ADDRESS"}

                                                <CheckIcon />
                                            </button>

                                        </div>

                                    </form>

                                </div>

                            )}

                        </section>
                    );


                /*
                |--------------------------------------------------------------------------
                | PAYMENTS
                |--------------------------------------------------------------------------
                */

                case "payments":

                    return (
                        <section className="account-content-panel">

                            <div className="account-content-header">

                                <div>

                                    <span>
                                        CHECKOUT
                                    </span>


                                    <h2>
                                        Payment Methods
                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    className="account-outline-button"
                                    onClick={
                                        openPaymentForm
                                    }
                                >
                                    ADD METHOD
                                    <PlusIcon />
                                </button>

                            </div>


                            <div className="account-security-note">

                                <span>
                                    SECURE PAYMENT DATA
                                </span>


                                <p>
                                    Only payment preferences are stored
                                    in this frontend. Sensitive payment
                                    credentials should be handled by your
                                    payment provider or backend.
                                </p>

                            </div>


                            {paymentMethods.length ===
                                0 ? (

                                <div className="account-empty-state">

                                    <div className="account-empty-mark">
                                        —
                                    </div>


                                    <h3>
                                        No payment methods saved
                                    </h3>


                                    <p>
                                        Add a payment preference for a faster
                                        account experience.
                                    </p>


                                    <button
                                        type="button"
                                        className="account-primary-button"
                                        onClick={
                                            openPaymentForm
                                        }
                                    >
                                        ADD PAYMENT METHOD
                                        <PlusIcon />
                                    </button>

                                </div>

                            ) : (

                                <div className="account-payment-list">

                                    {paymentMethods.map(
                                        (method) => (

                                            <article
                                                key={
                                                    method.id
                                                }
                                                className="account-payment-card"
                                            >

                                                <div>

                                                    <span>
                                                        {
                                                            method.type
                                                        }
                                                    </span>


                                                    <h3>
                                                        {
                                                            method.label
                                                        }
                                                    </h3>

                                                </div>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removePaymentMethod(
                                                            method.id
                                                        )
                                                    }
                                                    aria-label="Remove payment method"
                                                >
                                                    <TrashIcon />
                                                </button>

                                            </article>

                                        )
                                    )}

                                </div>

                            )}


                            {paymentFormOpen && (

                                <div className="account-form-card">

                                    <div className="account-form-heading">

                                        <div>

                                            <span>
                                                CHECKOUT
                                            </span>


                                            <h3>
                                                Add Payment Preference
                                            </h3>

                                        </div>


                                        <button
                                            type="button"
                                            className="account-icon-button"
                                            onClick={
                                                closePaymentForm
                                            }
                                            aria-label="Close payment form"
                                        >
                                            <CloseIcon />
                                        </button>

                                    </div>


                                    <form
                                        className="account-form"
                                        onSubmit={
                                            savePaymentMethod
                                        }
                                    >

                                        <div className="account-form-grid">

                                            <div className="account-form-field">

                                                <label>
                                                    Payment Type
                                                </label>


                                                <select
                                                    name="type"
                                                    value={
                                                        paymentDraft.type
                                                    }
                                                    onChange={
                                                        handlePaymentChange
                                                    }
                                                >

                                                    <option value="UPI">
                                                        UPI
                                                    </option>


                                                    <option value="Card">
                                                        Card
                                                    </option>


                                                    <option value="COD">
                                                        Cash on Delivery
                                                    </option>

                                                </select>

                                            </div>


                                            <div className="account-form-field">

                                                <label>
                                                    Display Label
                                                </label>


                                                <input
                                                    type="text"
                                                    name="label"
                                                    value={
                                                        paymentDraft.label
                                                    }
                                                    onChange={
                                                        handlePaymentChange
                                                    }
                                                    placeholder="Example: My UPI"
                                                    required
                                                />

                                            </div>

                                        </div>


                                        <div className="account-form-actions">

                                            <button
                                                type="button"
                                                className="account-secondary-button"
                                                onClick={
                                                    closePaymentForm
                                                }
                                            >
                                                CANCEL
                                            </button>


                                            <button
                                                type="submit"
                                                className="account-primary-button"
                                            >
                                                SAVE METHOD
                                                <CheckIcon />
                                            </button>

                                        </div>

                                    </form>

                                </div>

                            )}

                        </section>
                    );


                /*
                |--------------------------------------------------------------------------
                | SETTINGS
                |--------------------------------------------------------------------------
                */

                case "settings":

                    return (
                        <section className="account-content-panel">

                            <div className="account-content-header">

                                <div>

                                    <span>
                                        ACCOUNT
                                    </span>


                                    <h2>
                                        Settings
                                    </h2>

                                </div>

                            </div>


                            <div className="account-settings-list">

                                <button
                                    type="button"
                                    onClick={
                                        startProfileEditing
                                    }
                                >

                                    <div>

                                        <span>
                                            ACCOUNT INFORMATION
                                        </span>


                                        <strong>
                                            Personal Details
                                        </strong>

                                    </div>


                                    <ArrowIcon />

                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setProfileMessage(
                                            "Password management will be connected to your backend authentication system."
                                        )
                                    }
                                >

                                    <div>

                                        <span>
                                            SECURITY
                                        </span>


                                        <strong>
                                            Password &amp; Security
                                        </strong>

                                    </div>


                                    <ArrowIcon />

                                </button>


                                <button
                                    type="button"
                                    onClick={() =>
                                        document
                                            .querySelector(
                                                ".account-preference-card"
                                            )
                                            ?.scrollIntoView(
                                                {
                                                    behavior:
                                                        "smooth",

                                                    block:
                                                        "center",
                                                }
                                            )
                                    }
                                >

                                    <div>

                                        <span>
                                            PREFERENCES
                                        </span>


                                        <strong>
                                            Communication Preferences
                                        </strong>

                                    </div>


                                    <ArrowIcon />

                                </button>

                            </div>


                            <div className="account-preference-card">

                                <div>

                                    <span>
                                        ORDER UPDATES
                                    </span>


                                    <strong>
                                        Receive order notifications
                                    </strong>


                                    <p>
                                        Get updates about your orders,
                                        delivery and status changes.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className={`account-toggle ${settings.orderUpdates
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        toggleSetting(
                                            "orderUpdates"
                                        )
                                    }
                                    aria-pressed={
                                        settings.orderUpdates
                                    }
                                >
                                    <span />
                                </button>

                            </div>


                            <div className="account-preference-card">

                                <div>

                                    <span>
                                        PROMOTIONS
                                    </span>


                                    <strong>
                                        Promotional communication
                                    </strong>


                                    <p>
                                        Receive occasional updates about
                                        collections and offers.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className={`account-toggle ${settings.promotionalEmails
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        toggleSetting(
                                            "promotionalEmails"
                                        )
                                    }
                                    aria-pressed={
                                        settings.promotionalEmails
                                    }
                                >
                                    <span />
                                </button>

                            </div>


                            <div className="account-preference-card">

                                <div>

                                    <span>
                                        RECOMMENDATIONS
                                    </span>


                                    <strong>
                                        Personalized product suggestions
                                    </strong>


                                    <p>
                                        Allow Geeka to use your shopping
                                        activity for product recommendations.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className={`account-toggle ${settings.productRecommendations
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        toggleSetting(
                                            "productRecommendations"
                                        )
                                    }
                                    aria-pressed={
                                        settings.productRecommendations
                                    }
                                >
                                    <span />
                                </button>

                            </div>

                        </section>
                    );


                /*
                |--------------------------------------------------------------------------
                | PROFILE
                |--------------------------------------------------------------------------
                */

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


                                {!editingProfile && (

                                    <button
                                        type="button"
                                        className="account-outline-button"
                                        onClick={
                                            startProfileEditing
                                        }
                                    >
                                        EDIT PROFILE
                                        <EditIcon />
                                    </button>

                                )}

                            </div>


                            {!editingProfile ? (

                                <>

                                    <div className="profile-details">

                                        <div className="profile-detail">

                                            <span>
                                                FULL NAME
                                            </span>


                                            <p>
                                                {
                                                    accountLoading
                                                        ? "Loading..."
                                                        : profile.name ||
                                                        "Not added yet"
                                                }
                                            </p>

                                        </div>


                                        <div className="profile-detail">

                                            <span>
                                                EMAIL ADDRESS
                                            </span>


                                            <p>
                                                {
                                                    accountLoading
                                                        ? "Loading..."
                                                        : displayEmail
                                                }
                                            </p>

                                        </div>


                                        <div className="profile-detail profile-phone-detail">

                                            <span>
                                                MOBILE NUMBER
                                            </span>


                                            <div className="profile-phone-value">

                                                <p>
                                                    {
                                                        profile.phone ||
                                                        "Not added yet"
                                                    }
                                                </p>


                                                {profile.phone &&
                                                    profile.phoneVerified && (

                                                        <span className="phone-verified-badge">

                                                            <CheckIcon />

                                                            VERIFIED

                                                        </span>

                                                    )}

                                            </div>

                                        </div>

                                    </div>


                                    <div className="profile-account-note">

                                        <span>
                                            GEEKA ACCOUNT
                                        </span>


                                        <p>
                                            Your account is connected to
                                            the Geeka authentication system.
                                            Your name and email are loaded
                                            from your authenticated account session.
                                        </p>

                                    </div>


                                    {accountError && (

                                        <div className="account-success-message error">
                                            {
                                                accountError
                                            }
                                        </div>

                                    )}


                                    {profileMessage && (

                                        <div
                                            className={`account-success-message ${profileMessageType ===
                                                    "error"
                                                    ? "error"
                                                    : ""
                                                }`}
                                        >
                                            {
                                                profileMessage
                                            }
                                        </div>

                                    )}

                                </>

                            ) : (

                                <form
                                    className="account-form profile-edit-form"
                                    onSubmit={
                                        saveProfile
                                    }
                                >

                                    <div className="account-form-grid">

                                        <div className="account-form-field account-form-field-full">

                                            <label>
                                                Full Name
                                            </label>


                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    profileDraft.name
                                                }
                                                onChange={
                                                    handleProfileChange
                                                }
                                                placeholder="Enter your full name"
                                                autoComplete="name"
                                                required
                                            />

                                        </div>


                                        <div className="account-form-field">

                                            <label>
                                                Email Address
                                            </label>


                                            <input
                                                type="email"
                                                name="email"
                                                value={
                                                    profileDraft.email
                                                }
                                                onChange={
                                                    handleProfileChange
                                                }
                                                placeholder="Enter your email"
                                                autoComplete="email"
                                                required
                                            />

                                        </div>


                                        <div className="account-form-field">

                                            <label>
                                                Mobile Number
                                            </label>


                                            <div className="phone-input-wrapper">

                                                <span className="phone-prefix">
                                                    +91
                                                </span>


                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={
                                                        profileDraft.phone ||
                                                        ""
                                                    }
                                                    onChange={
                                                        handleProfileChange
                                                    }
                                                    placeholder="10-digit mobile number"
                                                    inputMode="numeric"
                                                    maxLength={
                                                        10
                                                    }
                                                    autoComplete="tel"
                                                />

                                            </div>


                                            <div className="phone-verification-row">

                                                {profileDraft.phoneVerified ? (

                                                    <div className="phone-verified-state">

                                                        <CheckIcon />

                                                        <span>
                                                            MOBILE VERIFIED
                                                        </span>

                                                    </div>

                                                ) : (

                                                    <button
                                                        type="button"
                                                        className="phone-send-otp-button"
                                                        onClick={
                                                            sendPhoneOtp
                                                        }
                                                        disabled={
                                                            otpLoading ||
                                                            resendSeconds >
                                                            0
                                                        }
                                                    >
                                                        {
                                                            otpLoading
                                                                ? "SENDING..."
                                                                : resendSeconds >
                                                                    0
                                                                    ? `RESEND IN ${resendSeconds}s`
                                                                    : "SEND OTP"
                                                        }
                                                    </button>

                                                )}

                                            </div>


                                            {otpSent &&
                                                !profileDraft.phoneVerified && (

                                                    <div className="phone-otp-box">

                                                        <div className="phone-otp-header">

                                                            <div>

                                                                <span>
                                                                    VERIFICATION
                                                                </span>


                                                                <strong>
                                                                    Enter OTP
                                                                </strong>

                                                            </div>


                                                            <button
                                                                type="button"
                                                                className="account-icon-button"
                                                                onClick={() => {

                                                                    setOtpSent(
                                                                        false
                                                                    );

                                                                    setOtp(
                                                                        ""
                                                                    );

                                                                    setOtpError(
                                                                        ""
                                                                    );

                                                                    setOtpSuccess(
                                                                        ""
                                                                    );

                                                                }}
                                                                aria-label="Close OTP verification"
                                                            >
                                                                <CloseIcon />
                                                            </button>

                                                        </div>


                                                        <p>
                                                            Enter the 6-digit OTP sent
                                                            to +91{" "}
                                                            {
                                                                getPhoneDigits()
                                                            }
                                                        </p>


                                                        <div className="phone-otp-actions">

                                                            <input
                                                                type="text"
                                                                value={
                                                                    otp
                                                                }
                                                                onChange={
                                                                    handleOtpChange
                                                                }
                                                                inputMode="numeric"
                                                                maxLength={
                                                                    OTP_LENGTH
                                                                }
                                                                placeholder="000000"
                                                                autoComplete="one-time-code"
                                                                className="phone-otp-input"
                                                            />


                                                            <button
                                                                type="button"
                                                                className="account-primary-button"
                                                                onClick={
                                                                    verifyPhoneOtp
                                                                }
                                                                disabled={
                                                                    otpVerifying ||
                                                                    otp.length !==
                                                                    OTP_LENGTH
                                                                }
                                                            >
                                                                {
                                                                    otpVerifying
                                                                        ? "VERIFYING..."
                                                                        : "VERIFY OTP"
                                                                }

                                                                <CheckIcon />
                                                            </button>

                                                        </div>


                                                        {otpError && (

                                                            <div className="phone-otp-message error">
                                                                {
                                                                    otpError
                                                                }
                                                            </div>

                                                        )}


                                                        {otpSuccess && (

                                                            <div className="phone-otp-message success">
                                                                {
                                                                    otpSuccess
                                                                }
                                                            </div>

                                                        )}


                                                        <button
                                                            type="button"
                                                            className="phone-resend-button"
                                                            onClick={
                                                                sendPhoneOtp
                                                            }
                                                            disabled={
                                                                resendSeconds >
                                                                0 ||
                                                                otpLoading
                                                            }
                                                        >
                                                            {
                                                                resendSeconds >
                                                                    0
                                                                    ? `RESEND OTP IN ${resendSeconds}s`
                                                                    : "RESEND OTP"
                                                            }
                                                        </button>

                                                    </div>

                                                )}


                                            {!otpSent &&
                                                !profileDraft.phoneVerified &&
                                                otpError && (

                                                    <div className="phone-otp-message error">
                                                        {
                                                            otpError
                                                        }
                                                    </div>

                                                )}

                                        </div>

                                    </div>


                                    {profileMessage && (

                                        <div
                                            className={`account-form-error ${profileMessageType ===
                                                    "success"
                                                    ? "success"
                                                    : ""
                                                }`}
                                        >
                                            {
                                                profileMessage
                                            }
                                        </div>

                                    )}


                                    <div className="account-form-actions">

                                        <button
                                            type="button"
                                            className="account-secondary-button"
                                            onClick={
                                                cancelProfileEditing
                                            }
                                        >
                                            CANCEL
                                        </button>


                                        <button
                                            type="submit"
                                            className="account-primary-button"
                                        >
                                            SAVE CHANGES
                                            <CheckIcon />
                                        </button>

                                    </div>

                                </form>

                            )}

                        </section>
                    );

            }
        };


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <main
            className="account-page"
            style={{
                "--profile-background":
                    `url(${profileBackground})`,
            }}
        >

            <div className="account-background-image" />

            <div className="account-background-overlay" />


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


            <div className="account-layout">

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

                        {menuItems.map(
                            (item) => (

                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    className={
                                        activeSection ===
                                            item.id
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => {

                                        setActiveSection(
                                            item.id
                                        );


                                        setSearchParams({
                                            section:
                                                item.id,
                                        });


                                        setProfileMessage(
                                            ""
                                        );


                                        setProfileMessageType(
                                            "success"
                                        );


                                        if (
                                            item.id !==
                                            "profile"
                                        ) {

                                            setEditingProfile(
                                                false
                                            );


                                            setOtpSent(
                                                false
                                            );

                                        }

                                    }}
                                >

                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>


                                    <strong>
                                        →
                                    </strong>

                                </button>

                            )
                        )}

                    </nav>


                    <button
                        type="button"
                        className="account-logout"
                        onClick={
                            handleLogout
                        }
                        disabled={
                            loggingOut
                        }
                    >

                        {
                            loggingOut
                                ? "LOGGING OUT..."
                                : "LOG OUT"
                        }

                    </button>

                </aside>


                <div className="account-main">

                    <div className="account-welcome">

                        <div className="account-avatar">

                            <span>
                                {
                                    initials
                                }
                            </span>

                        </div>


                        <div className="account-welcome-content">

                            <span>
                                WELCOME
                            </span>


                            <h2>
                                {
                                    displayName
                                }
                            </h2>

                        </div>

                    </div>


                    {
                        renderProfileContent()
                    }

                </div>

            </div>

        </main>
    );
}