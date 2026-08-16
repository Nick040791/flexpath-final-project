import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Login() {
    const { login, logout, isAuthenticated, username } = useAuth();
    const navigate = useNavigate();

    const [usernameInput, setUsernameInput] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setErrorMsg("");
        try {
            await login(usernameInput, password);
            navigate("/");
        } catch (error) {
            setErrorMsg(error.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    if (isAuthenticated) {
        return (
            <section className="container py-5">
                <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow border-warning border-2 rounded-4 text-center">
                    <div className="card-body bg-warning-subtle rounded-4 p-4">
                        <h1 className="h4 card-title">Logged in</h1>
                        <p className="card-text">Welcome, {username}!</p>
                        <button type="button" className="btn btn-outline-danger" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
                </div>
                </div>
            </section>
        );
    }

    return (
        <section className="container py-5">
            <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
            <div className="card shadow border-warning border-2 rounded-4 overflow-hidden">
                <div className="card-header text-bg-warning py-3"><h1 className="h4 card-title fw-bold mb-0">Login</h1></div>
                <div className="card-body bg-warning-subtle p-4">
                    {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="login-username">Username</label>
                            <input
                                id="login-username"
                                className="form-control"
                                type="text"
                                value={usernameInput}
                                onChange={(event) => setUsernameInput(event.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                className="form-control"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-warning w-100 fw-bold shadow-sm" disabled={submitting}>
                            {submitting ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
            </div>
            </div>
        </section>
    );
}

export default Login;
