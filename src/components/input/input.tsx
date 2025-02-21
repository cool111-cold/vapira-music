import React, { CSSProperties, useState } from "react";

interface InputProps {
    type?: 'text' | 'range';
    placeholder?: string;
    style: CSSProperties;
    initialValue?: string;
    onChange?: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
    type = 'text',
    placeholder,
    style,
    initialValue = '',
    onChange
}) => {
    const [content, setContent] = useState<string>(initialValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setContent(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <input
            type={type}
            style={style}
            placeholder={placeholder}
            value={content}
            onChange={handleChange}
        />
    );
};
