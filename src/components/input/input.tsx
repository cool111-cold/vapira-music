import React, { CSSProperties, useState } from "react";
import { useMyContext } from "../../context";
import { RU, RUKeys } from "../../translate";


interface InputProps {
    type?: 'text' | 'range';
    placeholder?: string;
    style: CSSProperties;
    initialValue?: string;
    onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
    type = 'text',
    placeholder = 'find',
    style,
    initialValue = '',
    onChange
}) => {
    const [content, setContent] = useState<string>(initialValue);
    const { langue } = useMyContext();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setContent(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const translateText = (txt: string): string => {
            if (langue == "RU") {
                return RU[txt as RUKeys] || txt;
            }else{
                return txt;
            }
        }

    return (
        <input
            type={type}
            style={style}
            placeholder={translateText(placeholder) + '...'}
            value={content}
            onChange={handleChange}
        />
    );
};
