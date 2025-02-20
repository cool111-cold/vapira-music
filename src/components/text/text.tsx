import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import { RU, RUKeys } from "../../translate";
import { Colors, ColorOptions } from "../../colors";
import { useMyContext } from "../../context";

interface TextProps {
    content: string;
    color?: string;
    size?: number;
    styleBlock?: React.CSSProperties;
    isVisible?: boolean;
    translate?: boolean;
    link?: string;
    inBlock?: boolean;
    textStyle?: React.CSSProperties;
    font?: 'defoult' | 'rubic';
}

export const Text: React.FC<TextProps> = ({content, color='primary', size=16, styleBlock, isVisible, translate, link, inBlock, textStyle, font='defoult' }) => {
    const {langue} = useMyContext();
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const translateText = (txt: string): string => {
        if (langue == "RU") {
            return RU[txt as RUKeys] || txt;
        }else{
            return txt;
        }
    }

    const fonts = {
        'defoult': {
            fontFamily: '"Roboto", serif',
            fontStyle: 'normal',
        },
        'rubic': {
            fontFamily: '"Rubik Mono One", serif',
            fontStyle: 'normal',
        }
    }

    const styleText = {
        color: color,
        fontSize: size,
        cursor: link ? 'pointer' : 'default',
        fontWeight: isHovered && link ? 500 : 400,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        ...fonts[font],
        ...textStyle
    };
    
    const navigate = useNavigate();
    const handleNavigate = () => {
        if (link) {
            navigate(link);
        }
    }
    return (
        <div 
        style={{ ...(inBlock ? { backgroundColor: '#000' } : {}), ...styleBlock }}
        onClick={handleNavigate} 
        onMouseEnter={() => {
            setIsHovered(true);
        }}
        onMouseLeave={() => {
            setIsHovered(false);
        }}>
            <p style={styleText}>{translate ? translateText(content) : content}</p>
        </div>
    )
}