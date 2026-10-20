import { useState } from "react";
import { isEndpointConfigured } from "../services/adminApi";
import "../style/AdminPages.css";
import "../style/AdminCustomers.css";

/*
 * The uploaded API_CONTRACT.md does not document a staff-only customer
 * management endpoint. This page intentionally does not guess one or call
 * customer-facing endpoints to populate an admin-wide customer list.
 */
export default function AdminCustomers() {
    const [showRequirements, setShowRequirements] = useState(true);
    const configured = isEndpointConfigured("customers");

    return (
        <div className="admin-page admin-customers-page">
            <div className="admin-page-toolbar">
                <div>
                    <p className="admin-eyebrow">Store management</p>
                    <h2>Customers</h2>
                    <p>Customer directory and account overview for the Geeka admin team.</p>
                </div>
            </div>

            {configured ? (
                <section className="admin-panel-card admin-customers-placeholder">
                    <h3>Customer endpoint configured</h3>
                    <p>The customer endpoint is configured in <code>adminApi.js</code>. The directory UI should be connected to its confirmed response schema before showing or editing customer records.</p>
                </section>
            ) : (
                <section className="admin-panel-card admin-customers-placeholder">
                    <div className="admin-customers-placeholder-icon" aria-hidden="true">C</div>
                    <p className="admin-eyebrow">Backend endpoint required</p>
                    <h3>Customer management is not documented yet</h3>
                    <p className="admin-customers-lead">The current API contract documents staff-only order management, but it does not specify an admin-wide customer-list endpoint or its response fields. To avoid fake data and broken requests, this page is waiting for that API.</p>
                    <button className="admin-button admin-button-secondary" type="button" onClick={() => setShowRequirements((value) => !value)}>
                        {showRequirements ? "Hide backend requirements" : "Show backend requirements"}
                    </button>
                    {showRequirements && (
                        <div className="admin-customers-requirements">
                            <h4>Ask the backend developer to confirm or add:</h4>
                            <ul>
                                <li>A staff-only paginated endpoint to list customers, for example a route agreed by the backend team.</li>
                                <li>Search by customer name, email, and customer UUID; pagination parameters and response format.</li>
                                <li>Safe customer fields such as ID, name, email, phone (if stored), joined date, and order count (if supported).</li>
                                <li>Whether customer detail retrieval is available and which fields it returns.</li>
                                <li>Whether any customer actions are supported. Do not expose account deletion or status changes unless the backend explicitly implements and authorizes them.</li>
                            </ul>
                            <p><strong>Important:</strong> the example route must be chosen by the backend developer; it is not an existing endpoint confirmed by the contract.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
