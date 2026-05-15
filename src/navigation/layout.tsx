import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "../components/header/header";
import { PlayerTwo } from "../components/player/player-two";
import { MyProvider } from "../context";
import { AudioProvider } from "../context/audio-context";

export const Layout = () => {
    return (
        <AudioProvider>
            <MyProvider>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Header />
                    <Outlet />
                    <PlayerTwo />
                </div>
            </MyProvider>
        </AudioProvider>
    );
};