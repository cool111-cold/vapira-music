import { useContext, useEffect, useState } from "react";
import { Icon } from "../icon"
import { Colors } from "../../colors";
import { Text } from "../text";
import { Modal } from "./modal";
import { useMyContext } from "../../context";
import AudioPlayer from "../../pages/track/components/test";

export const Player = () => {
    const [modalLeft, setModalLeft] = useState<boolean>(false);
    const [modalRight, setModalRight] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [cover, setCover] = useState<string | null>(null)
    const iconSize = 30;
    const { trackList, trackIndex, setTrackIndex} = useMyContext();
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const block = event.currentTarget;
        const rect = block.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setCurrentTime(percentage)
    };
    
    useEffect(()=>{
        setCurrentTime(0);
    },[trackIndex])

    useEffect(()=>{
        if (trackList[trackIndex]?.cover) {
            setCover(trackList[trackIndex]?.cover);
        }
    },[trackList[trackIndex]?.cover])
    
    return (
        <div className="player-container">
            <div className="player-info">      
                <div className="" style={{background: `url(${cover}) center center / cover`, width: 150, height: 150, position: 'relative', bottom: 0, pointerEvents: 'all'}}>
                    {/* <div className="shadow-block" style={{backgroundColor: Colors.shadow }}>
                    <Icon name="addList" size={iconSize}/>
                    <Icon name="play" size={iconSize}/>
                    <Icon name="heard" size={iconSize} isClick/>
                    </div> */}
                    <AudioPlayer trackId={trackIndex} currentTime={currentTime} setCurrentTime={setCurrentTime}/>
                </div>
                <Modal data={trackIndex-1>=0?trackList[trackIndex-1]:null} isVisible={modalLeft}/>
            <div className="" style={{display: 'flex', flexDirection: 'column', marginLeft: 10, pointerEvents: 'all'}}>
                <Text content={trackList[trackIndex]?.name} color={Colors.default} inBlock styleBlock={{paddingBottom: 3, paddingTop: 3, paddingLeft: 5, paddingRight: 15}} link={`/track/${trackList[trackIndex]?.id}`} size={20}/>
                <Text content={trackList[trackIndex]?.artist_name} color={Colors.bodyfont} inBlock styleBlock={{paddingBottom: 3, paddingTop: 3, paddingLeft: 5, paddingRight: 15, marginTop: 5, width: 'fit-content'}} link="/"/>
            </div>
            </div>
            <div className="player-sub">
                {trackList[trackIndex]?.subtitle&&<Text content={trackList[trackIndex]?.subtitle!} inBlock color={Colors.bodyfont}textStyle={{whiteSpace: 'normal', wordWrap: 'break-word'}} styleBlock={{maxWidth: '30%', maxHeight: '50%', pointerEvents: 'all', textAlign: 'right', paddingRight: 15, paddingTop: 5, paddingLeft: 5, paddingBottom: 5}}/>}
                <Modal data={trackIndex+1<=trackList.length-1?trackList[trackIndex+1]:null} isVisible={modalRight} isRight/>
            </div>
            <div className="player-line">
                <div className="player-line-btn" onMouseEnter={()=>setModalLeft(true)} onMouseLeave={()=>setModalLeft(false)} onClick={()=>trackIndex>0 ? setTrackIndex(trackIndex-1) : null}/>
                {/* <div className="player-line-line" onClick={handleClick} style={{background: `linear-gradient(90deg, rgba(0,0,0,1) ${currentTime - 30}%, ${trackList[trackIndex]?.color? trackList[trackIndex].color : '#000'} ${currentTime}%, rgba(255,255,255,0) ${currentTime}%)`}}/> */}
                <input
                    style={{width: '98%', height: '100%', color: 'red',
                        background: `linear-gradient(90deg, rgba(0,0,0,1) ${currentTime - 30}%, ${trackList[trackIndex]?.color? trackList[trackIndex].color : '#000'} ${currentTime}%, rgba(255,255,255,0) ${currentTime}%)`
                    }}
                    // color={trackList[trackIndex]?.color}
                    type="range"
                    min="0"
                    max={100}
                    value={currentTime}
                    onChange={(event)=>setCurrentTime(Number(event.target.value))}
                    className="custom-range"
                />
                <div className="player-line-btn" onMouseEnter={()=>setModalRight(true)} onMouseLeave={()=>setModalRight(false)} onClick={()=>trackIndex<trackList.length-1 ? setTrackIndex(trackIndex+1) : null}/>
            </div>
        </div>
    )
}