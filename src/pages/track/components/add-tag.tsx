import React, {CSSProperties, useEffect, useState} from "react"
import { Colors } from "../../../colors";
import { Input } from "../../../components/input";
import { Button } from "../../../components/button";
import { Style } from "../../../style";
import { Icon } from "../../../components/icon";
import { Tag } from "../../../components/types";
import { TagContainer } from "./tag";


interface AddTagProps {
    style: CSSProperties;
    result: (name: string)=>void;
    content?: Tag[];
}

export const AddTag:React.FC <AddTagProps> = ({style, result, content}) => {

    const [find, setFind] = useState<string>();

    const inputStyle: CSSProperties = {
        border: `2px solid ${!find ? Colors.grey: Colors.primary}`,
        borderRadius: 20,
        height: 35,
        padding: '0px 10px',
        outlineColor: Colors.primary,
    }

    const resultStyle: CSSProperties = {
        width: '80%',
        padding: '0px 12px',
        marginLeft: 12,
        marginRight: 12,
        borderRight: `2px solid ${!find ? Colors.grey: Colors.primary}`,
        borderLeft: `2px solid ${!find ? Colors.grey: Colors.primary}`,
    }

    const resultStyleContainer: CSSProperties = {
        width: '100%',
        display: 'flex',
        gap: 10,
        overflowX: 'scroll',
        scrollbarWidth: 'none'
    }

    useEffect(()=>{
        if (find) {
            result(find);
        }
    },[find])

    return (
        <div style={style}>
            <Input style={inputStyle} placeholder="find..." onChange={setFind}/>
            <div style={resultStyle}>
                <div style={resultStyleContainer}>
                    {content?.map((item)=>(
                        <TagContainer title={item.name} color={item.color} image={item.image} id={item.id} type="add"/>
                    ))}
                </div>
            </div>
            <Icon name='menu' color={!find ? Colors.grey: Colors.primary} size={35} style={Style.center} isClick/>
        </div>
    )
}