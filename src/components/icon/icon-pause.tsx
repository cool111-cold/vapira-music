import React from "react";
import { IconType } from "../types";

export const PauseIcon: React.FC<IconType> = ({ size, color, isClick }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: isClick ? 'pointer' : 'default' }}
        >
            <path d="M7 20V4M17 20V4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};
