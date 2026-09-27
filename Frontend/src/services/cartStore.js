import { useSyncExternalStore } from "react";

/*
|--------------------------------------------------------------------------
| CART STORAGE
|--------------------------------------------------------------------------
| We use a new key so the old demo cart data is not loaded.
|--------------------------------------------------------------------------
*/

const CART_STORAGE_KEY = "geeka-cart-v2";


/*
|--------------------------------------------------------------------------
| CART BUSINESS RULES
|--------------------------------------------------------------------------
| These are temporary frontend rules.
| Your backend developer can later move these rules to the backend.
|--------------------------------------------------------------------------
*/

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 99;


/*
|--------------------------------------------------------------------------
| INTERNAL CART STATE
|--------------------------------------------------------------------------
*/

let cartItems = readCart();

const listeners = new Set();


/*
|--------------------------------------------------------------------------
| READ CART FROM LOCAL STORAGE
|--------------------------------------------------------------------------
*/

function readCart() {
    try {
        const saved = localStorage.getItem(
            CART_STORAGE_KEY
        );

        const parsed = saved
            ? JSON.parse(saved)
            : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map(normalizeCartItem)
            .filter(Boolean);

    } catch {
        return [];
    }
}


/*
|--------------------------------------------------------------------------
| NORMALIZE CART ITEM
|--------------------------------------------------------------------------
| Makes sure every cart item has a consistent structure.
|--------------------------------------------------------------------------
*/

function normalizeCartItem(item) {

    if (
        !item ||
        item.id === undefined ||
        item.id === null
    ) {
        return null;
    }

    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (
        !Number.isFinite(price) ||
        !Number.isFinite(quantity)
    ) {
        return null;
    }

    return {
        id: item.id,

        name:
            item.name ||
            "Product",

        category:
            item.category ||
            "",

        color:
            item.color ||
            "",

        price,

        image:
            item.image ||
            "",

        quantity:
            Math.max(
                1,
                Math.floor(quantity)
            ),
    };
}


/*
|--------------------------------------------------------------------------
| SAVE CART
|--------------------------------------------------------------------------
*/

function persist() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cartItems)
        );

    } catch {
        // In-memory cart still works if localStorage fails.
    }
}


/*
|--------------------------------------------------------------------------
| NOTIFY SUBSCRIBERS
|--------------------------------------------------------------------------
*/

function notify() {

    listeners.forEach(
        (listener) => listener()
    );
}


/*
|--------------------------------------------------------------------------
| UPDATE INTERNAL CART
|--------------------------------------------------------------------------
*/

function update(nextItems) {

    cartItems = nextItems
        .map(normalizeCartItem)
        .filter(Boolean);

    persist();

    notify();
}


/*
|--------------------------------------------------------------------------
| SUBSCRIBE
|--------------------------------------------------------------------------
| Used by useSyncExternalStore.
|--------------------------------------------------------------------------
*/

export function subscribe(listener) {

    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}


/*
|--------------------------------------------------------------------------
| GET CURRENT CART
|--------------------------------------------------------------------------
*/

export function getCartSnapshot() {
    return cartItems;
}


/*
|--------------------------------------------------------------------------
| ADD PRODUCT TO CART
|--------------------------------------------------------------------------
| If product already exists:
|     quantity + 1
|
| Otherwise:
|     create new cart item with quantity 1
|--------------------------------------------------------------------------
*/

export function addToCart(product) {

    if (
        !product ||
        product.inStock === false
    ) {
        return;
    }

    const existing = cartItems.find(
        (item) =>
            String(item.id) ===
            String(product.id)
    );

    /*
    |--------------------------------------------------------------
    | PRODUCT ALREADY IN CART
    |--------------------------------------------------------------
    */

    if (existing) {

        update(

            cartItems.map((item) =>

                String(item.id) ===
                    String(product.id)

                    ? {
                        ...item,

                        quantity:
                            item.quantity + 1,
                    }

                    : item
            )

        );

        return;
    }


    /*
    |--------------------------------------------------------------
    | NEW PRODUCT
    |--------------------------------------------------------------
    */

    update([
        ...cartItems,

        {
            id: product.id,

            name: product.name,

            category:
                product.category,

            color:
                product.color || "",

            price:
                product.price,

            image:
                product.image || "",

            quantity: 1,
        },
    ]);
}


/*
|--------------------------------------------------------------------------
| CHANGE QUANTITY
|--------------------------------------------------------------------------
| change = +1
| change = -1
|--------------------------------------------------------------------------
*/

export function updateCartQuantity(
    productId,
    change
) {

    update(

        cartItems.map((item) => {

            if (
                String(item.id) !==
                String(productId)
            ) {
                return item;
            }

            return {
                ...item,

                quantity:
                    Math.max(
                        1,
                        item.quantity + change
                    ),
            };
        })

    );
}


/*
|--------------------------------------------------------------------------
| SET EXACT QUANTITY
|--------------------------------------------------------------------------
*/

export function setCartQuantity(
    productId,
    quantity
) {

    const safeQuantity =
        Math.max(
            1,
            Math.floor(
                Number(quantity) || 1
            )
        );

    update(

        cartItems.map((item) =>

            String(item.id) ===
                String(productId)

                ? {
                    ...item,
                    quantity:
                        safeQuantity,
                }

                : item
        )

    );
}


/*
|--------------------------------------------------------------------------
| REMOVE PRODUCT
|--------------------------------------------------------------------------
*/

export function removeFromCart(
    productId
) {

    update(

        cartItems.filter(
            (item) =>
                String(item.id) !==
                String(productId)
        )

    );
}


/*
|--------------------------------------------------------------------------
| CLEAR ENTIRE CART
|--------------------------------------------------------------------------
*/

export function clearCart() {

    update([]);
}


/*
|--------------------------------------------------------------------------
| TOTAL ITEM COUNT
|--------------------------------------------------------------------------
*/

export function getCartCount(
    items = cartItems
) {

    return items.reduce(
        (total, item) =>
            total + item.quantity,

        0
    );
}


/*
|--------------------------------------------------------------------------
| SUBTOTAL
|--------------------------------------------------------------------------
*/

export function getCartSubtotal(
    items = cartItems
) {

    return items.reduce(
        (total, item) =>
            total +
            item.price *
            item.quantity,

        0
    );
}


/*
|--------------------------------------------------------------------------
| SHIPPING
|--------------------------------------------------------------------------
*/

export function getCartShipping(
    items = cartItems
) {

    const subtotal =
        getCartSubtotal(items);

    if (
        subtotal === 0 ||
        subtotal >=
        FREE_SHIPPING_THRESHOLD
    ) {
        return 0;
    }

    return SHIPPING_FEE;
}


/*
|--------------------------------------------------------------------------
| FINAL TOTAL
|--------------------------------------------------------------------------
*/

export function getCartTotal(
    items = cartItems
) {

    return (
        getCartSubtotal(items) +
        getCartShipping(items)
    );
}


/*
|--------------------------------------------------------------------------
| CROSS-TAB SYNCHRONIZATION
|--------------------------------------------------------------------------
| Keeps the cart synchronized if the same website is opened
| in another browser tab.
|--------------------------------------------------------------------------
*/

function handleStorage(event) {

    if (
        event.key !==
        CART_STORAGE_KEY
    ) {
        return;
    }

    cartItems = readCart();

    notify();
}


if (
    typeof window !==
    "undefined"
) {

    window.addEventListener(
        "storage",
        handleStorage
    );
}


/*
|--------------------------------------------------------------------------
| REACT CART HOOK
|--------------------------------------------------------------------------
| This lets Header, Shop and Cart all use the SAME cart.
|--------------------------------------------------------------------------
*/

export function useCart() {

    const items =
        useSyncExternalStore(
            subscribe,
            getCartSnapshot,
            () => []
        );

    return {

        cartItems: items,

        cartCount:
            getCartCount(items),

        subtotal:
            getCartSubtotal(items),

        shipping:
            getCartShipping(items),

        total:
            getCartTotal(items),

        addItem:
            addToCart,

        updateQuantity:
            updateCartQuantity,

        setQuantity:
            setCartQuantity,

        removeItem:
            removeFromCart,

        clearCart,
    };
}