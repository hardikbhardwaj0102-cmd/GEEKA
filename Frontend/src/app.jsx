import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import CollectionSection from "./components/CollectionSection";
import BenefitsStrip from "./components/BenefitsStrip";
import WhyChooseUs from "./components/WhyChooseUs";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Register from "./components/Register";
import "./app.css";


function HomePage() {
    return (
        <div className="store-app">
            <Header />

            <main className="store-main">
                <Hero />

                <CollectionSection />

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

                {/* HOME */}
                <Route
                    path="/"
                    element={<HomePage />}
                />

                {/* LOGIN */}
                <Route
                    path="/login"
                    element={<Login />}
                />
                <Route
                    path="/register"
                    element={<Register />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;