import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/header/header";
import { Player } from "../components/player";
import { MyProvider } from "../context";

export const Layout = () => {
    return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
        <MyProvider>
            <Header/>
            <Outlet/>
            <Player/>
        </MyProvider>
    </div>
    );
};