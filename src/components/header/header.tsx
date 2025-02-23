import React, {CSSProperties, useState} from "react"
import { Style } from "../../style"
import { Text } from "../text"
import { Colors } from "../../colors";
import { useMyContext } from "../../context";

interface RenderButtonProps {
    title?: string;
    link?: string;
    logo?: boolean;
    index: number;
}

export const Header = () => {
    const [currentPage, setCurrentPage] = useState<string>();
    const { langue, setLangue } = useMyContext();
    const HeaderStyle:CSSProperties = {
        ...Style.center
    }
    const ButtonStyle:CSSProperties = {
        borderLeft: '1px solid #000',
        height: '100%', 
        padding: '0px 25px',
        ...Style.center
    }
    const Buttons = [
        {
            title: 'Home',
            link: '/'
        },
        {
            title: 'Tags',
            link: '/'
        }
    ]

    const middleIndex = Math.floor(Buttons.length / 2);

    const RenderButton:React.FC <RenderButtonProps>= ({title="VɅ", link, logo, index}) => {
        return (
            <div 
                onClick={()=>logo ? setLangue((e)=> e === 'RU' ? 'EN' : 'RU') : setCurrentPage(title)} 
                style={{...ButtonStyle, backgroundColor: currentPage === title ? Colors.primary : Colors.none, borderRight: index === Buttons.length-1 ? '1px solid #000' : undefined}}>
                    <Text
                        content={title}
                        link={link}
                        color="#fff"
                        size={logo ? 30 : 15}
                        translate                                
                    />
            </div>
        )
    }

    return (
        <header style={HeaderStyle}>
            {Buttons.map((item, index) => {
                if (index === middleIndex) {
                    return (
                        <>
                            <RenderButton 
                                index={index-1} 
                                logo 
                            />
                            <RenderButton
                                title={item.title}
                                link={item.link}
                                index={index}
                            />
                           
                        </>
                    
                    );
                }
                return (
                    <RenderButton
                        title={item.title}
                        link={item.link}
                        index={index}
                    />
                );
            })}
        </header>
    );
};