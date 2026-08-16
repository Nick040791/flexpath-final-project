import { Link } from "react-router-dom";


// The not found component for when stuff is...

const NotFound = () => {
    return (
        <section className="container my-5 py-5 text-center border border-warning border-4 bg-warning-subtle rounded-4 shadow">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h1 className="display-1 fw-bold text-danger mb-4">404</h1>
                    <h2 className="h4 mb-3 text-dark">Not Found</h2>
                    <p className="text-muted mb-5">This page either does not exist or I broke it somehow :/</p>
                    <div className="d-grid gap-2 col-md-4 mx-auto">
                        <p className="text-muted">You don&apos;t have to go</p>
                        <Link className="btn btn-warning fw-bold" to="/">HOME</Link>
                        <p className="text-muted">But you can&apos;t stay here</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotFound;