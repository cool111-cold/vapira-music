import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { MainPage } from "../pages/main";
import { TrackPage } from "../pages/track";

export const routes = createBrowserRouter([
    {   
        Component: Layout,
        children: [
        {
            path: "/",
            Component: MainPage,
        },
        {
            path: "/track/:id",
            Component: TrackPage,
        }
        ],
    },
]);