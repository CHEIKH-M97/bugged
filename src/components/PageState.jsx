import { Link } from "react-router";

export default function PageState({ icon, title, message, linkTo = "/", linkLabel = "Back to today", error = false }) {
    return (
        <main className="page-state">
            <div className={`state-icon ${error ? "error" : ""}`}>{icon}</div>
            <h2>{title}</h2>
            <p>{message}</p>
            {linkTo && (
                <Link className="primary-button" to={linkTo}>
                    {linkLabel}
                </Link>
            )}
        </main>
    );
}
