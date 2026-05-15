import React from "react";
import { IconType } from "../types";

export const SkipBackIcon: React.FC<IconType> = ({ size, color, isClick }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: isClick ? 'pointer' : 'default' }}
        >
            <path d="M5 20.1483L5 3.85174M17.5639 20.7493L9.50015 12.6011C9.17163 12.2691 9.17163 11.7309 9.50015 11.3989L17.5639 3.25067C18.0939 2.71518 19 3.09444 19 3.85174L19 20.1483C19 20.9056 18.0939 21.2848 17.5639 20.7493Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};
