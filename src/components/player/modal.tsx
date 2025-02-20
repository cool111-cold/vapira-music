import React from "react";
import { Colors } from "../../colors"
import { Text } from "../text";

interface test {
    name: string;
    artist_name: string;
    cover: string;
    color?: string;
}

interface ModalProps {
    isRight?: boolean;
    data: test | null;
    isVisible: boolean;
}

export const Modal: React.FC<ModalProps> = ({data, isRight, isVisible}) => {
    return (
        <div className="player-modal" style={{
            minWidth: '20%',
            width: 'fit-content', 
            height: 100, 
            backgroundColor: '#000000c7',
            display: isVisible&&data? 'flex' : 'none',
            position: 'absolute'}}>
            {!isRight&&<div className="" style={{background: `url(${data?data.cover:null}) center center / cover`, width: 80, height: 80, position: 'relative', bottom: 0, pointerEvents: 'all'}}/>}
            <div className="" style={{display: 'flex', flexDirection: 'column', marginLeft: 10, marginRight: 50, pointerEvents: 'all'}}>
                <Text content={isRight? 'next' : 'prev'} color={Colors.bodyfont} styleBlock={{position: 'absolute', top: 10}} translate/>
                <Text content={data?data.name:''} color={Colors.default} styleBlock={{width: 'fit-content'}} size={20}/>
                <Text content={data?data.artist_name:''} color={Colors.bodyfont} styleBlock={{width: 'fit-content', marginTop: 1}}/>
            </div>
            {isRight&&<div className="" style={{background: `url(${data?data.cover:null}) center center / cover`, width: 80, height: 80, position: 'relative', bottom: 0, pointerEvents: 'all'}}/>}

        </div>
    )
}