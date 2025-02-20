import React from "react";
import { IconType } from "../types";

export const AllIcon:React.FC<IconType> = ({size = 25, color = 'white', isClick}) => {
    return (
        <svg 
            width={size}
            height={size}
            viewBox="0 0 18 21" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{cursor: isClick ? 'pointer': 'default'}}>
            <path 
                d="M7.12117 20.0781L6.27338 19.1513L14.8522 10.5391L6.27338 1.92684L7.12117 1L16.6237 10.5391L7.12117 20.0781ZM11.3503 10.5391L1.8482 1L1 1.92684L9.57883 10.5391L1 19.1513L1.8482 20.0781L11.3503 10.5391Z" 
                fill={color}
                stroke={color}/>
        </svg>
    )
}