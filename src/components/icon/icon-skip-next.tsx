import React from "react";
import { IconType } from "../types";

export const SkipNextIcon: React.FC<IconType> = ({ size, color, isClick }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: isClick ? 'pointer' : 'default' }}
        >
             <path d="M31.6666 6.41957V33.5804M10.7267 5.41779L24.1663 18.9982C24.7139 19.5515 24.7139 20.4485 24.1663 21.0018L10.7267 34.5822C9.84345 35.4747 8.33325 34.8426 8.33325 33.5804L8.33325 6.41957C8.33325 5.1574 9.84345 4.5253 10.7267 5.41779Z" stroke={color} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/> 
        </svg>
    );
};
