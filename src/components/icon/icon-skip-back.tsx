import React from "react";
import { IconType } from "../types";

export const SkipBackIcon: React.FC<IconType> = ({ size, color, isClick }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: isClick ? 'pointer' : 'default' }}
        >
             <path d="M8.33325 33.5804L8.33325 6.41956M29.2732 34.5822L15.8335 21.0018C15.286 20.4485 15.286 19.5515 15.8335 18.9982L29.2732 5.41779C30.1564 4.5253 31.6666 5.1574 31.6666 6.41957L31.6666 33.5804C31.6666 34.8426 30.1564 35.4747 29.2732 34.5822Z" stroke={color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/> 
        </svg>
    );
};
