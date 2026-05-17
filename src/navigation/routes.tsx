import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./layout";
import { MainPage } from "../pages/main";
import { TrackPage } from "../pages/track";
import { UploadPage } from "../pages/upload";
import { LibraryPage } from "../pages/library";
import { TracksPage } from "../pages/library/tracks";
import { SavedPage } from "../pages/library/saved";
import { SearchPage } from "../pages/library/search";

export const routes = createBrowserRouter([
    {
        Component: Layout,
        children: [
            { path: "/", Component: MainPage },
            { path: "/track/:id", Component: TrackPage },
            { path: "/upload", Component: UploadPage },
            { path: "/library", Component: LibraryPage },
            { path: "/tracks", Component: TracksPage },
            { path: "/saved", Component: SavedPage },
            { path: "/search", Component: SearchPage },
        ],
    },
]);