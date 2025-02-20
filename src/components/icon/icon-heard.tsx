import React, {useState} from "react";
import { IconType } from "../types";

export const HeardIcon:React.FC<IconType> = ({size = 25, color = 'white', isClick, active}) => {
    const [click, setClick] = useState<boolean>(active?active:false);
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 12 10" 
            fill={isClick && click ? color : 'none'} 
            xmlns="http://www.w3.org/2000/svg"
            style={{cursor: isClick ? 'pointer': 'default'}}
            onClick={()=>setClick((n)=>!n)}>
                <path 
                    fill-rule="evenodd" 
                    clip-rule="evenodd" 
                    d="M6 2.00009C5.1003 0.951585 3.59688 0.62755 2.46961 1.58767C1.34234 2.54779 1.18363 4.15305 2.06889 5.2886C2.80492 6.2327 5.0324 8.22395 5.76245 8.86845C5.8441 8.94055 5.88495 8.9766 5.9326 8.99075C5.97415 9.0031 6.01965 9.0031 6.06125 8.99075C6.1089 8.9766 6.1497 8.94055 6.2314 8.86845C6.96145 8.22395 9.1889 6.2327 9.92495 5.2886C10.8102 4.15305 10.6709 2.53769 9.5242 1.58767C8.37755 0.63765 6.8997 0.951585 6 2.00009Z" 
                    stroke={color} 
                    stroke-width="1.056" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"/>
        </svg>
    )
}