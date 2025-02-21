import React from "react";
import { IconType } from "../types";

export const CircleAddIcon:React.FC<IconType> = ({size = 25, color = 'white', isClick}) => {
    return (
        <svg 
            x="0px" 
            y="0px" 
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{cursor: isClick ? 'pointer': 'default'}}>
        <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke={color} 
            stroke-width="1.5"/>
        <path 
            d="M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15" 
            stroke={color} 
            stroke-width="1.5" 
            stroke-linecap="round"/>
        </svg>
    )
}