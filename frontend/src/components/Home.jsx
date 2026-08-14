import { bearerToken } from "./Login";
import {useState, useEffect} from "react";
import Hero from "./Hero";
import AdminPanel from "./AdminPanel";
//if we are logged in, show the builds, otherwise show a message to log in
//if we are logged in and admin, show the admin panel, otherwise hide it.

function Home() {
    return (
        <>
            <Hero />
            <AdminPanel />
        
        </>
    );
}

export default Home;
