import React, {useState, CSSProperties} from "react"
import { Text } from "../../../components/text";
import { Icon } from "../../../components/icon";

interface TagContainerProps {
    id: number
    title: string;
    color: string;
    image?: string;
    onClick?: (id: number)=>void;
    type: 'add' | 'del';
}

export const TagContainer:React.FC <TagContainerProps> = ({title, color, image, id, onClick, type}) => {
    const [isHover, setIsHover] = useState<boolean>(false);

    const blockStyle: CSSProperties = {
        width: 'fit-content',
        border: `2px solid`,
        borderColor: color,
        borderRadius: 20,
        background: `url('${image}') center center / cover`,
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        maxHeight: 40,
        position: 'relative' as const,
    };

    const iconStyle: CSSProperties = {
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginLeft: 2,
        transition: 'all ease .25s',
        width: isHover ? 25 : 0
    }

    const iconName = type === 'add' ? 'addCircle' : 'close';
    
    return (
        <div style={blockStyle} onMouseEnter={()=>setIsHover(true)} onMouseLeave={()=>setIsHover(false)}>
            <Text 
                content={title} 
                font='rubic'
                color={ image ? '#fff' : color } 
                styleBlock={{padding: '2px 5px'}} 
                textStyle={{fontWeight: 500}} 
                inBlock={!!image}/> 
            <div onClick={()=> onClick?.(id)}>
                <Icon name={iconName} color={color} isClick style={iconStyle}/>
            </div>
        </div>
    )
}