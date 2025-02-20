import React, {useState, CSSProperties} from "react"
import { Text } from "../../../components/text";
import { Icon } from "../../../components/icon";

interface TagContainerProps {
    id: number
    title: string;
    color: string;
    image?: string;
    onClick: (id: number)=>void;
}

export const TagContainer:React.FC <TagContainerProps> = ({title, color, image, id, onClick}) => {
    const [isHover, setIsHover] = useState<boolean>(false);

    const blockStyle: CSSProperties = {
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
    
    return (
        <div style={blockStyle} onMouseEnter={()=>setIsHover(true)} onMouseLeave={()=>setIsHover(false)}>
            <Text 
                content={title} 
                font='rubic'
                color={ image ? '#fff' : color } 
                styleBlock={{padding: '2px 5px'}} 
                textStyle={{fontWeight: 500}} 
                inBlock={!!image}/> 
            {/* {isHover &&  */}
            <div onClick={()=> onClick(id)}>
                <Icon name='close' color={color} isClick style={iconStyle}/>
            </div>
            {/* // } */}
        </div>
    )
}