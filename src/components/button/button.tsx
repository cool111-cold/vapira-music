import React from "react";
import { Text } from "../text";
import { Colors } from "../../colors";

interface ButtonProps {
    title: string;
    onClick: () => void;
    type?: 'choice';
    active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ title, onClick, type, active }) => {
    let ButtonStyle = {};
    let TextStyle = {};

    if (type === 'choice') {
        ButtonStyle = {
            backgroundColor: 'transparent', 
            marginRight: 10, 
            marginLeft: 10, 
            border: 'none'
        };
        TextStyle = {     
            color: Colors.header,
            textStyle: {cursor: 'pointer', fontWeight: active ? 600 : 400 },
            size: 18
            
        };
    }

    return (
        <div>
            <button onClick={onClick} style={ButtonStyle}>
                <Text content={title} {...TextStyle} translate/>
            </button>
        </div>
    );
};
