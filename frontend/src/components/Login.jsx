import React from "react";

let bearerToken = ""; // Variable to track login state
let isLoggedIn = false; // Variable to track login state
let isAdmin = false; // Variable to track admin state
//Get the bearer token from the login endpoint and store it in a variable that can be accessed by other components
function Login() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loginState, setLoginState] = React.useState(isLoggedIn); // State to trigger re-render on login/logout

    async function handleLogin() {
        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                const data = await response.json();
                bearerToken = data.token;
                isLoggedIn = true; // Set the logged-in state to true
                isAdmin = data.isAdmin; // Set the admin state based on the response
                console.log("Login successful, token:", bearerToken);
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    }
    return (
        <div>
            <h1>{isLoggedIn ? "Logout" : "Login"}</h1>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>{isLoggedIn ? "Logout" : "Login"}</button>
            {isLoggedIn && (
                <p>Welcome, {username}!</p>
            )}
            {!isLoggedIn && (
                <p>Please log in.</p>
            )}
        </div>
    );
}

export default Login;
export { bearerToken };
export { isLoggedIn };
export { isAdmin };