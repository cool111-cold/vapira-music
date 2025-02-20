import React from "react";
import { Track } from "./track"

interface track {
    id: string;
    name: string;
    artist_name: string;
    cover: string;
    color?: string;
    subtitle?: string;
    isLike?: boolean;
    background_img?: string;
}

interface TrackListProps {
    data: track[]
}

export const TrackList:React.FC<TrackListProps> = ({data}) => {
    return (
        <div className="track-list">
            {data.map((item, index)=>(
                <Track {...item} index={index}/>   
            ))}
                    
        </div>
    )
}