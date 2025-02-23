import React, { CSSProperties, useEffect, useState } from "react";
import { Colors } from "../../../colors";
import { Input } from "../../../components/input";
import { Button } from "../../../components/button";
import { Style } from "../../../style";
import { Icon } from "../../../components/icon";
import { Tag } from "../../../components/types";
import { TagContainer } from "./tag";

interface AddTagProps {
    style: CSSProperties;
    result: (name: string | undefined) => void;
    content?: Tag[];
    onAddTag?: (index: number) => void; // Добавлен проп onAddTag
}

export const AddTag: React.FC<AddTagProps> = ({ style, result, content, onAddTag }) => {
    const [find, setFind] = useState<string>();
    const [indexAddTag, setIndexAddTag] = useState<number>();

    const inputStyle: CSSProperties = {
        border: `2px solid ${!find ? Colors.grey : Colors.primary}`,
        borderRadius: 20,
        height: 40,
        padding: '0px 10px',
        outlineColor: Colors.primary,
        backgroundColor: Colors.none,
        outline: 'none'
    };

    const resultStyle: CSSProperties = {
        width: '80%',
        padding: '0px 12px',
        marginLeft: 12,
        marginRight: 12,
        borderRight: `2px solid ${!find ? Colors.grey : Colors.primary}`,
        borderLeft: `2px solid ${!find ? Colors.grey : Colors.primary}`,
    };

    const resultStyleContainer: CSSProperties = {
        width: '100%',
        display: 'flex',
        gap: 10,
        overflowX: 'scroll',
        scrollbarWidth: 'none',
        flexWrap: 'wrap'
    };

    useEffect(() => {
        result(find);
    }, [find, result]);

    useEffect(() => {
        if (indexAddTag !== undefined && onAddTag) {
            onAddTag(indexAddTag); 
        }
    }, [indexAddTag]);

    return (
        <div style={style}>
            <Input style={inputStyle} onChange={setFind} />
            <div style={resultStyle}>
                <div style={resultStyleContainer}>
                    {content?.map((item, index) => (
                        <TagContainer
                            key={item.id}
                            title={item.name}
                            color={item.color}
                            image={item.image}
                            id={item.id}
                            type="add"
                            onClick={() => setIndexAddTag(item.id)} // Устанавливаем indexAddTag при клике
                        />
                    ))}
                </div>
            </div>
            <Icon name='menu' color={!find ? Colors.grey : Colors.primary} size={35} style={Style.center} isClick />
        </div>
    );
};
