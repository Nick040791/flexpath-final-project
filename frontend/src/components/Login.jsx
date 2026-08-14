import React from "react";

let bearerToken = "";
//Get the bearer token from the login endpoint and store it in a variable that can be accessed by other components
function Login() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    async function handleLogin() {
        try {
            const response = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.token) {
                bearerToken = data.token;
            }
        } catch (error) {
            console.error("Login failed", error);
        }
    }

    return (
        <div>
            <h1>Login</h1>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>  
        </div>
    );
}

export default Login;
export { bearerToken };