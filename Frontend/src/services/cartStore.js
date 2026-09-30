import { useSyncExternalStore } from "react";

import {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart as clearBackendCart,
    getCartErrorMessage,
} from "./cartService";


/*
|--------------------------------------------------------------------------
| CART BUSINESS RULES
|--------------------------------------------------------------------------
| These are retained for compatibility with the existing Cart UI.
|
| IMPORTANT:
| Product price, stock and purchasability come from Django.
| Shipping is not currently part of the documented Cart API response,
| so this frontend shipping rule is retained until checkout/shipping
| endpoints are available from the backend.
|--------------------------------------------------------------------------
*/

export const FREE_SHIPPING_THRESHOLD = 999;

export const SHIPPING_FEE = 99;


/*
|--------------------------------------------------------------------------
| INTERNAL STATE
|--------------------------------------------------------------------------
*/

let cartItems = [];

let isLoading = false;

let isInitialized = false;

let cartError = null;

const listeners = new Set();

let initializationPromise = null;


/*
|--------------------------------------------------------------------------
| SNAPSHOT
|--------------------------------------------------------------------------
*/

function notify() {
    listeners.forEach(
        (listener) => listener()
    );
}


/*
|--------------------------------------------------------------------------
| SUBSCRIBE
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
| GET SNAPSHOT
|--------------------------------------------------------------------------
*/

export function getCartSnapshot() {
    return cartItems;
}


/*
|--------------------------------------------------------------------------
| SERVER SNAPSHOT
|--------------------------------------------------------------------------
| Used by React during SSR/hydration-safe rendering.
|--------------------------------------------------------------------------
*/

export function getCartServerSnapshot() {
    return [];
}


/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

export function isCartLoading() {
    return isLoading;
}

export function getCartError() {
    return cartError;
}

export function isCartInitialized() {
    return isInitialized;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE EXTERNAL CART ITEMS
|--------------------------------------------------------------------------
*/

function normalizeItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.filter(
        (item) =>
            item &&
            item.id &&
            item.variant_id
    );
}


/*
|--------------------------------------------------------------------------
| SET STATE
|--------------------------------------------------------------------------
*/

function setState(
    nextItems,
    {
        loading = isLoading,
        error = cartError,
        initialized = isInitialized,
    } = {}
) {
    cartItems =
        normalizeItems(nextItems);

    isLoading = loading;

    cartError = error;

    isInitialized =
        initialized;

    notify();
}


/*
|--------------------------------------------------------------------------
| LOAD CART FROM DJANGO
|--------------------------------------------------------------------------
*/

export async function loadCart() {
    if (initializationPromise) {
        return initializationPromise;
    }

    isLoading = true;

    cartError = null;

    notify();

    initializationPromise =
        getCart()
            .then((cart) => {
                const items =
                    normalizeItems(
                        cart?.items
                    );

                setState(
                    items,
                    {
                        loading: false,
                        error: null,
                        initialized: true,
                    }
                );

                return items;
            })
            .catch((error) => {
                const message =
                    getCartErrorMessage(
                        error
                    );

                setState(
                    [],
                    {
                        loading: false,
                        error: message,
                        initialized: true,
                    }
                );

                throw error;
            })
            .finally(() => {
                initializationPromise =
                    null;
            });

    return initializationPromise;
}


/*
|--------------------------------------------------------------------------
| INITIALIZE CART
|--------------------------------------------------------------------------
| Called automatically by the first consumer of useCart().
|--------------------------------------------------------------------------
*/

export function initializeCart() {
    if (
        !isInitialized &&
        !isLoading
    ) {
        loadCart().catch(() => {
            /*
            |--------------------------------------------------------------
            | Error is already stored in cartError.
            |--------------------------------------------------------------
            */
        });
    }
}


/*
|--------------------------------------------------------------------------
| ADD TO CART
|--------------------------------------------------------------------------
|
| Supported call styles:
|
| 1.
| addToCart(variantId, quantity)
|
| 2.
| addToCart(product, variant, quantity)
|
| 3.
| addToCart({
|      product,
|      variant,
|      quantity
|    })
|
| This keeps the store flexible while the product pages are being
| migrated from the old product-level cart to the variant-level cart.
|--------------------------------------------------------------------------
*/

export async function addToCart(
    firstArg,
    secondArg,
    thirdArg
) {
    let variantId = "";

    let quantity = 1;

    /*
    |--------------------------------------------------------------------------
    | STYLE 1
    |--------------------------------------------------------------------------
    | addToCart("variant-uuid", 1)
    */

    if (
        typeof firstArg === "string" ||
        typeof firstArg === "number"
    ) {
        variantId =
            String(
                firstArg
            ).trim();

        quantity =
            secondArg ?? 1;
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE 2
    |--------------------------------------------------------------------------
    | addToCart(product, variant, quantity)
    */

    else if (
        firstArg &&
        secondArg
    ) {
        const variant =
            secondArg;

        variantId =
            String(
                variant?.id ??
                variant?.variant_id ??
                ""
            ).trim();

        quantity =
            thirdArg ?? 1;
    }

    /*
    |--------------------------------------------------------------------------
    | STYLE 3
    |--------------------------------------------------------------------------
    | addToCart({
    |   product,
    |   variant,
    |   quantity
    | })
    */

    else if (
        firstArg &&
        typeof firstArg ===
        "object"
    ) {
        const payload =
            firstArg;

        const variant =
            payload?.variant ||
            payload;

        variantId =
            String(
                payload?.variant_id ??
                variant?.variant_id ??
                variant?.id ??
                ""
            ).trim();

        quantity =
            payload?.quantity ??
            secondArg ??
            1;
    }

    if (!variantId) {
        const error =
            new Error(
                "Select a product variant before adding the item to cart."
            );

        cartError =
            error.message;

        notify();

        throw error;
    }

    const safeQuantity =
        Math.max(
            1,
            Math.floor(
                Number(quantity) || 1
            )
        );

    isLoading = true;

    cartError = null;

    notify();

    try {
        await addCartItem(
            variantId,
            safeQuantity
        );

        /*
        |--------------------------------------------------------------------------
        | Re-fetch complete cart.
        |
        | This ensures we use backend-calculated:
        | - price
        | - quantity
        | - subtotal
        | - stock
        | - is_purchasable
        |--------------------------------------------------------------------------
        */

        const cart =
            await getCart();

        setState(
            cart?.items || [],
            {
                loading: false,
                error: null,
                initialized: true,
            }
        );

        return cart;
    } catch (error) {
        const message =
            getCartErrorMessage(
                error
            );

        isLoading = false;

        cartError = message;

        notify();

        throw error;
    }
}


/*
|--------------------------------------------------------------------------
| UPDATE QUANTITY
|--------------------------------------------------------------------------
|
| New preferred usage:
|
| updateCartQuantity(cartItemId, quantity)
|
| Legacy usage:
|
| updateCartQuantity(id, +1)
| updateCartQuantity(id, -1)
|
|--------------------------------------------------------------------------
*/

export async function updateCartQuantity(
    itemId,
    quantityOrChange
) {
    const item =
        cartItems.find(
            (cartItem) =>
                String(
                    cartItem.id
                ) ===
                String(itemId)
        );

    if (!item) {
        throw new Error(
            "Cart item was not found."
        );
    }

    let nextQuantity;

    /*
    |--------------------------------------------------------------------------
    | Explicit quantity
    |--------------------------------------------------------------------------
    | set to current quantity when value is greater than 0.
    |--------------------------------------------------------------------------
    */

    if (
        Number.isInteger(
            Number(
                quantityOrChange
            )
        )
    ) {
        const numericValue =
            Number(
                quantityOrChange
            );

        /*
        |--------------------------------------------------------------------------
        | Preserve the old +1 / -1 interface.
        |--------------------------------------------------------------------------
        */

        if (
            numericValue === 1 ||
            numericValue === -1
        ) {
            nextQuantity =
                Math.max(
                    1,
                    item.quantity +
                    numericValue
                );
        } else {
            nextQuantity =
                Math.max(
                    1,
                    Math.floor(
                        numericValue
                    )
                );
        }
    } else {
        nextQuantity =
            item.quantity;
    }

    return setCartQuantity(
        itemId,
        nextQuantity
    );
}


/*
|--------------------------------------------------------------------------
| SET EXACT QUANTITY
|--------------------------------------------------------------------------
*/

export async function setCartQuantity(
    itemId,
    quantity
) {
    const safeItemId =
        String(
            itemId ?? ""
        ).trim();

    if (!safeItemId) {
        throw new Error(
            "A cart item ID is required."
        );
    }

    const safeQuantity =
        Math.max(
            1,
            Math.floor(
                Number(quantity) || 1
            )
        );

    isLoading = true;

    cartError = null;

    notify();

    try {
        await updateCartItem(
            safeItemId,
            safeQuantity
        );

        const cart =
            await getCart();

        setState(
            cart?.items || [],
            {
                loading: false,
                error: null,
                initialized: true,
            }
        );

        return cart;
    } catch (error) {
        const message =
            getCartErrorMessage(
                error
            );

        isLoading = false;

        cartError =
            message;

        notify();

        throw error;
    }
}


/*
|--------------------------------------------------------------------------
| REMOVE ITEM
|--------------------------------------------------------------------------
*/

export async function removeFromCart(
    itemId
) {
    const safeItemId =
        String(
            itemId ?? ""
        ).trim();

    if (!safeItemId) {
        throw new Error(
            "A cart item ID is required."
        );
    }

    isLoading = true;

    cartError = null;

    notify();

    try {
        await removeCartItem(
            safeItemId
        );

        const cart =
            await getCart();

        setState(
            cart?.items || [],
            {
                loading: false,
                error: null,
                initialized: true,
            }
        );

        return cart;
    } catch (error) {
        const message =
            getCartErrorMessage(
                error
            );

        isLoading = false;

        cartError =
            message;

        notify();

        throw error;
    }
}


/*
|--------------------------------------------------------------------------
| CLEAR ENTIRE CART
|--------------------------------------------------------------------------
*/

export async function clearCart() {
    isLoading = true;

    cartError = null;

    notify();

    try {
        await clearBackendCart();

        setState(
            [],
            {
                loading: false,
                error: null,
                initialized: true,
            }
        );

        return true;
    } catch (error) {
        const message =
            getCartErrorMessage(
                error
            );

        isLoading = false;

        cartError =
            message;

        notify();

        throw error;
    }
}


/*
|--------------------------------------------------------------------------
| CART COUNT
|--------------------------------------------------------------------------
*/

export function getCartCount(
    items = cartItems
) {
    return items.reduce(
        (total, item) =>
            total +
            Math.max(
                0,
                Number(
                    item?.quantity
                ) || 0
            ),
        0
    );
}


/*
|--------------------------------------------------------------------------
| CART SUBTOTAL
|--------------------------------------------------------------------------
| Uses backend-returned/current cart item prices.
|--------------------------------------------------------------------------
*/

export function getCartSubtotal(
    items = cartItems
) {
    return items.reduce(
        (total, item) => {
            const price =
                Number(
                    item?.price
                ) || 0;

            const quantity =
                Number(
                    item?.quantity
                ) || 0;

            return (
                total +
                price *
                quantity
            );
        },
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
        getCartSubtotal(
            items
        );

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
        getCartSubtotal(
            items
        ) +
        getCartShipping(
            items
        )
    );
}


/*
|--------------------------------------------------------------------------
| RELOAD CART
|--------------------------------------------------------------------------
*/

export async function refreshCart() {
    return loadCart();
}


/*
|--------------------------------------------------------------------------
| REACT HOOK
|--------------------------------------------------------------------------
*/

export function useCart() {
    const items =
        useSyncExternalStore(
            subscribe,
            getCartSnapshot,
            getCartServerSnapshot
        );

    /*
    |--------------------------------------------------------------------------
    | Ensure the backend cart is loaded.
    |--------------------------------------------------------------------------
    */

    initializeCart();

    return {
        /*
        |--------------------------------------------------------------------------
        | Data
        |--------------------------------------------------------------------------
        */

        cartItems:
            items,

        /*
        |--------------------------------------------------------------------------
        | Cart totals
        |--------------------------------------------------------------------------
        */

        cartCount:
            getCartCount(
                items
            ),

        subtotal:
            getCartSubtotal(
                items
            ),

        shipping:
            getCartShipping(
                items
            ),

        total:
            getCartTotal(
                items
            ),

        /*
        |--------------------------------------------------------------------------
        | State
        |--------------------------------------------------------------------------
        */

        loading:
            isLoading,

        isLoading:
            isLoading,

        initialized:
            isInitialized,

        error:
            cartError,

        /*
        |--------------------------------------------------------------------------
        | Actions
        |--------------------------------------------------------------------------
        */

        addItem:
            addToCart,

        updateQuantity:
            updateCartQuantity,

        setQuantity:
            setCartQuantity,

        removeItem:
            removeFromCart,

        clearCart,

        refreshCart:
            loadCart,
    };
}