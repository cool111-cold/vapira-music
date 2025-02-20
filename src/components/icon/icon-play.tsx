import React, {useState} from "react";
import { IconType } from "../types";

export const PlayIcon:React.FC<IconType> = ({size = 25, color = 'white', isClick, active}) => {
    const [click, setClick] = useState<boolean>(active?active:false);
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 15 15" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{cursor: isClick ? 'pointer': 'default'}}
            onClick={()=>setClick((n)=>!n)}>
            <path 
                d="M7.5 1C3.91022 1 1 3.91022 1 7.5C1 11.0898 3.91022 14 7.5 14C11.0898 14 14 11.0898 14 7.5C14 3.91022 11.0898 1 7.5 1ZM7.5 12.9167C4.50853 12.9167 2.08334 10.4915 2.08334 7.5C2.08334 4.50853 4.50853 2.08334 7.5 2.08334C10.4915 2.08334 12.9167 4.50853 12.9167 7.5C12.9167 10.4915 10.4915 12.9167 7.5 12.9167Z" 
                fill={color} 
                stroke={color} 
                stroke-width="0.390625"/>
            {click? <><rect 
                x="5.95" 
                y="3.95"
                width="1.1" 
                height="7.1" 
                rx="0.55" 
                fill={color} 
                stroke={color}
                stroke-width="0.1"/>
            <rect 
                x="7.95" 
                y="3.95" 
                width="1.1" 
                height="7.1" 
                rx="0.55" 
                fill={color}
                stroke={color}
                stroke-width="0.1"/></>: <path 
                d="M6.79968 4.40865C6.58815 4.19712 6.24518 4.19712 6.03365 4.40865C5.82212 4.62018 5.82212 4.96315 6.03365 5.17468L8.35897 7.50001L6.03365 9.82533C5.82212 10.0369 5.82212 10.3798 6.03365 10.5914C6.24518 10.8029 6.58815 10.8029 6.79968 10.5914L9.50802 7.88302C9.71955 7.67149 9.71955 7.32852 9.50802 7.11699L6.79968 4.40865Z" 
                fill={color}
                stroke={color} 
                stroke-width="0.390625"/>}
        </svg>
    )
}


