import { PRODUCTS } from "../data/mockProducts";

/*
|--------------------------------------------------------------------------
| PRODUCT SERVICE
|--------------------------------------------------------------------------
| Frontend-only service layer.
|
| Right now:
|   Products come from mockProducts.js
|
| Later:
|   Your backend developer can replace these functions with API requests
|   without changing the Shop/Cart components.
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/
export async function getProducts() {
    return PRODUCTS;
}


/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
*/
export async function getProductById(id) {
    const product = PRODUCTS.find(
        (item) => String(item.id) === String(id)
    );

    return product || null;
}


/*
|--------------------------------------------------------------------------
| GET PRODUCTS BY CATEGORY
|--------------------------------------------------------------------------
*/
export async function getProductsByCategory(category) {
    if (!category || category === "All") {
        return PRODUCTS;
    }

    return PRODUCTS.filter(
        (product) => product.category === category
    );
}


/*
|--------------------------------------------------------------------------
| GET FEATURED PRODUCTS
|--------------------------------------------------------------------------
*/
export async function getFeaturedProducts() {
    return PRODUCTS.filter(
        (product) => product.featured === true
    );
}


/*
|--------------------------------------------------------------------------
| GET NEW PRODUCTS
|--------------------------------------------------------------------------
*/
export async function getNewProducts() {
    return PRODUCTS.filter(
        (product) => product.isNew === true
    );
}


/*
|--------------------------------------------------------------------------
| GET IN-STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
export async function getInStockProducts() {
    return PRODUCTS.filter(
        (product) => product.inStock === true
    );
}