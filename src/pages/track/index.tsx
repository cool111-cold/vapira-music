import React, { useEffect, useState } from 'react';
import { data, useParams } from 'react-router-dom';
import { useMyContext } from '../../context';
import { Text } from '../../components/text';
import { Colors } from '../../colors';
import { Button } from '../../components/button';
import { Icon } from '../../components/icon';
import { TagsTable } from './components/tags';

interface TrackData {
    id: string;
    name: string;
    artist_name: string;
    cover: string;
    color: string;
    subtitle?: string;
    isLike?: boolean;
    background_img?: string;
}

export const TrackPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { GetFullTrack } = useMyContext();
    const [trackData, setTrackData] = useState<TrackData | null | undefined>(null);
    const subtitle = trackData?.subtitle ? 'subtitle' : null
    const containers = [subtitle, 'info', 'tags', 'setting'];
    const [currentContainer, setCurrentContainer] = useState<string | null>('subtitle');
    const [isFavorite, setIsFavorite] = useState<boolean | undefined>();
    const [fullScreen, setFullScreen] = useState<boolean>(false);
    

    useEffect(() => {
        const fetchTrackData = () => {
            if (id) {
                const data = GetFullTrack(id);
                setTrackData(data);
            }
        };

        fetchTrackData();
    }, [id, GetFullTrack]);

    useEffect(()=>{
        setIsFavorite(trackData?.isLike);
    },[trackData?.isLike])

    if (!trackData) {
        return <Icon name='load' style={{width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center'}} />;
    }

    const bgHeight = fullScreen ? '100vh' : 400;
    const contentPosition = fullScreen ? 'center' : 'flex-end';

    return (
        <div className="defoult-page">
            <div className="track-page" style={trackData.background_img?{background: `url(${trackData.background_img}) center center / cover`, height: bgHeight, justifyContent: contentPosition}:{backgroundColor: trackData.color, height: bgHeight, justifyContent: contentPosition}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{background: `url(${trackData.cover}) center center / cover`, width: 300, height: 300, position: 'relative', bottom: 0, pointerEvents: 'all'}} onClick={()=>setFullScreen((e)=>!e)}/>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 20}}>
                    <Text content={trackData.name} inBlock color={Colors.default} size={40} styleBlock={{padding: 5, paddingRight: 25}}/>
                    <Text content={trackData.artist_name} inBlock color={Colors.bodyfont} size={25} styleBlock={{marginTop: 10, paddingRight: 15, paddingLeft: 5, paddingTop: 5, paddingBottom: 5, width: 'fit-content'}}/>
                </div>
            </div>
            <div style={{height: 50, display: 'flex', marginTop: 10, width: 60, justifyContent: 'space-between'}}>
                <Icon name='addList'/>
                <Icon name='heard' isClick={ isFavorite? isFavorite : false }/>
            </div>
            </div>
            <div className="" style={{width: '100%', borderBottom: `1px solid ${Colors.bodyfont}`, height: 50, marginTop: 400, display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
                {containers.map((item)=>{
                    return (
                        item && <Button title={item} onClick={()=>setCurrentContainer(item)} type='choice' active={item === currentContainer}/>
                    )
                })}
            </div>
            {currentContainer === 'tags' && id && <TagsTable id={id}/>} 
        </div>
    );
};
