import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import CollectionSection from "./components/CollectionSection";
import BenefitsStrip from "./components/BenefitsStrip";
import WhyChooseUs from "./components/WhyChooseUs";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import NewArrivals from "./components/NewArrivals";
import ProductCatalog from "./components/ProductCatalog";
import Profile from "./components/Profile";
import Shop from "./components/Shop";
import About from "./components/About";
import Contact from "./components/Contact";
import Cart from "./components/Cart";
import ForgotPassword from "./components/ForgotPassword";
import ProductDetails from "./components/ProductDetails";
import "./App.css";


function HomePage() {
    return (
        <div className="store-app">

            <Header />

            <main className="store-main">

                <Hero />

                <CollectionSection />

                <NewArrivals />

                <ProductCatalog />

                <BenefitsStrip />

                <WhyChooseUs />

            </main>

            <Footer />

        </div>
    );
}


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ================================
                    HOME
                ================================= */}

                <Route
                    path="/"
                    element={<HomePage />}
                />


                {/* ================================
                    AUTH
                ================================= */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* ================================
                    ACCOUNT
                ================================= */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* ================================
                    SHOP
                ================================= */}

                <Route
                    path="/shop"
                    element={<Shop />}
                />

                <Route
                    path="/product/:productId"
                    element={<ProductDetails />}
                />
                {/* ================================
                    ABOUT
                ================================= */}

                <Route
                    path="/about"
                    element={<About />}
                />


                {/* ================================
                    CONTACT
                ================================= */}

                <Route
                    path="/contact"
                    element={<Contact />}
                />


                {/* ================================
                    CART
                ================================= */}

                <Route
                    path="/cart"
                    element={<Cart />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>

        </BrowserRouter>
    );
}

export default App;