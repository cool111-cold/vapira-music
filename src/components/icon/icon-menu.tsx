import React, {useState} from "react";
import { IconType } from "../types";

export const MenuIcon:React.FC<IconType> = ({size = 25, color = 'white', isClick, active}) => {
    const [click, setClick] = useState<boolean>(active?active:false);
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 25 25" 
            fill="none">
                <circle cx="12.5" cy="12.5" r="1.5" fill={color}/>
                <circle cx="12.5" cy="6.5" r="1.5" fill={color}/>
                <circle cx="12.5" cy="18.5" r="1.5" fill={color}/>
                <circle cx="12.5" cy="12.5" r="11.5" stroke={color} stroke-width="2"/>
        </svg>
        
    )
}





