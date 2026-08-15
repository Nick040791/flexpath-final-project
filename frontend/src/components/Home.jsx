//if we are logged in, show the builds, otherwise show a message to log in after the hero section.
//if we are logged in and admin, show the admin panel, otherwise hide it.


function Home() {
    return (
        <>
            <section className="hero">
                <h1 className="display-4 fw-bold text-center mb-4">Welcome to Builders Home</h1>
                <p className="lead text-center mb-4">Your one-stop shop for all your building needs</p>
                <div className="text-center">
                    <a href="/search" className="btn btn-primary btn-lg">Search for Parts</a>
                </div>
            </section>
            <section className="container py-5">
            </section>
        </>
    );
}

export default Home;
