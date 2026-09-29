import { useOutletContext } from "react-router-dom";

import "../style/AdminPages.css";


export default function AdminSettings() {
    const { user } = useOutletContext();

    return (
        <div className="admin-page">
            <section className="admin-page-toolbar">
                <div>
                    <div className="admin-eyebrow">CONFIGURATION</div>
                    <h2>Settings</h2>
                    <p>Admin account and integration information.</p>
                </div>
            </section>

            <div className="admin-settings-grid">
                <section className="admin-panel-card">
                    <div className="admin-panel-heading">
                        <div>
                            <div className="admin-eyebrow">ADMIN ACCOUNT</div>
                            <h3>Current session</h3>
                        </div>
                    </div>

                    <div className="admin-detail-list">
                        <div><span>Name</span><strong>{user?.full_name || "—"}</strong></div>
                        <div><span>Email</span><strong>{user?.email || "—"}</strong></div>
                        <div><span>Account ID</span><strong>{user?.id || "—"}</strong></div>
                        <div><span>Email verified</span><strong>{user?.email_verified == null ? "—" : user.email_verified ? "Yes" : "No"}</strong></div>
                    </div>
                </section>

                <section className="admin-panel-card">
                    <div className="admin-panel-heading">
                        <div>
                            <div className="admin-eyebrow">ARCHITECTURE</div>
                            <h3>Backend authority</h3>
                        </div>
                    </div>

                    <div className="admin-info-stack">
                        <div><strong>Authentication</strong><span>Django server-side session</span></div>
                        <div><strong>Database</strong><span>PostgreSQL through the Django backend</span></div>
                        <div><strong>Images</strong><span>Private Supabase Storage, signed URLs from Django</span></div>
                        <div><strong>Permissions</strong><span>Every admin operation must be checked by Django</span></div>
                    </div>
                </section>
            </div>
        </div>
    );
}
