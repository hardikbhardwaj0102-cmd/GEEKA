import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import CollectionSection from "./components/CollectionSection";
import BenefitsStrip from "./components/BenefitsStrip";
import WhyChooseUs from "./components/WhyChooseUs";
import Footer from "./components/Footer";
import Login from "./components/Login";
import ExploreShopBanner from "./components/ExploreShopBanner";
import Register from "./components/Register";
import NewArrivals from "./components/NewArrivals";
import ProductCatalog from "./components/ProductCatalog";
import Profile from "./components/Profile";
import Shop from "./components/Shop";
import About from "./components/About";
import HandmadeBanner from "./components/HandmadeBanner";
import Contact from "./components/Contact";
import OrderDetails from "./components/OrderDetails";
import Checkout from "./components/Checkout";
import Cart from "./components/Cart";
import ForgotPassword from "./components/ForgotPassword";
import ProductDetails from "./components/ProductDetails";

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminProductEditor from "./admin/pages/AdminProductEditor";
import AdminSectionPage from "./admin/pages/AdminSectionPage";
import AdminMessages from "./admin/pages/AdminMessages";
import AdminSettings from "./admin/pages/AdminSettings";

import "./App.css";


/* =========================================================
   HOME PAGE
========================================================= */

function HomePage() {
    return (
        <div className="store-app">

            <Header />

            <main className="store-main">

                <Hero />

                <CollectionSection />

                <NewArrivals />

                <ExploreShopBanner />

                <ProductCatalog />

                <HandmadeBanner />

                <BenefitsStrip />

                <WhyChooseUs />

            </main>

            <Footer />

        </div>
    );
}


/* =========================================================
   APP
========================================================= */

function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* =====================================================
                    HOME
                ===================================================== */}

                <Route
                    path="/"
                    element={<HomePage />}
                />


                {/* =====================================================
                    CUSTOMER AUTH
                ===================================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />


                {/* =====================================================
                    CUSTOMER ACCOUNT
                ===================================================== */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* =====================================================
                    STORE
                ===================================================== */}

                <Route
                    path="/shop"
                    element={<Shop />}
                />

                <Route
                    path="/product/:productId"
                    element={<ProductDetails />}
                />

                <Route
                    path="/about"
                    element={<About />}
                />
                <Route
                    path="/checkout"
                    element={<Checkout />}
                />
                <Route
                    path="/orders/:orderId"
                    element={<OrderDetails />}
                />
                <Route
                    path="/contact"
                    element={<Contact />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />


                {/* =====================================================
                    OLD ADMIN LOGIN URL
                    No separate admin login for Geeka.
                    Redirect it to the normal customer login.
                ===================================================== */}

                <Route
                    path="/admin/login"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />


                {/* =====================================================
                    ADMIN PANEL
                ===================================================== */}

                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >

                    {/* Dashboard */}

                    <Route
                        index
                        element={<AdminDashboard />}
                    />


                    {/* Products */}

                    <Route
                        path="products"
                        element={<AdminProducts />}
                    />


                    {/* Add Product */}

                    <Route
                        path="products/new"
                        element={<AdminProductEditor />}
                    />


                    {/* Edit Product */}

                    <Route
                        path="products/:productId"
                        element={<AdminProductEditor />}
                    />


                    {/* Categories */}

                    <Route
                        path="categories"
                        element={
                            <AdminSectionPage
                                section="categories"
                            />
                        }
                    />


                    {/* Inventory */}

                    <Route
                        path="inventory"
                        element={
                            <AdminSectionPage
                                section="inventory"
                            />
                        }
                    />


                    {/* Orders */}

                    <Route
                        path="orders"
                        element={
                            <AdminSectionPage
                                section="orders"
                            />
                        }
                    />


                    {/* Customers */}

                    <Route
                        path="customers"
                        element={
                            <AdminSectionPage
                                section="customers"
                            />
                        }
                    />


                    {/* Reviews */}

                    <Route
                        path="reviews"
                        element={
                            <AdminSectionPage
                                section="reviews"
                            />
                        }
                    />


                    {/* Messages */}

                    <Route
                        path="messages"
                        element={<AdminMessages />}
                    />


                    {/* Settings */}

                    <Route
                        path="settings"
                        element={<AdminSettings />}
                    />

                </Route>


            </Routes>

        </BrowserRouter>
    );
}


export default App;