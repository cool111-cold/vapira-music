import React, {useState} from "react"
import { Text } from "../text"
import { Icon } from "../icon";
import { Colors } from "../../colors";
import { useMyContext } from "../../context";

interface TrackProps {
    id: string;
    name: string;
    artist_name: string;
    cover: string;
    isLike?: boolean;
    isPlay?: boolean;
    index?: number;
}

export const Track: React.FC<TrackProps> = ({ name, artist_name, cover, isLike, isPlay, index, id }) => {
    const { setTrackIndex } = useMyContext();
    const [isClick, setIsClick] = useState<boolean>(false);
    const handleChoiceTrack = () => {
        setIsClick((e)=>!e)
    }
    const iconSize = 35;
    
    return (
        <div className="track-block" style={{backgroundColor: isClick? '#000' : '#fff'}} onMouseEnter={handleChoiceTrack} onMouseLeave={handleChoiceTrack}>
            <div className="track" style={{background: `url(${cover})`, backgroundPosition: 'center', backgroundSize: 'cover'}}>
                {isClick&&<div className="shadow-block" style={{backgroundColor: isClick? Colors.shadow : Colors.none }}>
                <Icon name="addList" isClick size={iconSize}/>
                <div onClick={()=>index?setTrackIndex(index): setTrackIndex(0)}>
                    <Icon name="play" size={iconSize} isClick active={isPlay}/>
                </div>
                <Icon name="heard" size={iconSize} isClick active={isLike}/>
                </div>}
            </div>
            <div style={{userSelect: 'none'}}>
            <Text content={name} color={isClick? '#fff' : '#000'} link={`/track/${id}`}/>
            <Text content={artist_name} color="#7D7D7D" link="/"/>
            </div>
        </div>
    )
}