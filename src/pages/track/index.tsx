import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
    const [currentContainer, setCurrentContainer] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState<boolean | undefined>();
    const containers = ['info', 'tags', 'setting'];

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
        console.log(isFavorite)
    },[trackData?.isLike])

    if (!trackData) {
        return <Icon name='load' style={{width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center'}} />;
    }

    return (
        <div className="defoult-page">
            <div className="track-page" style={trackData.background_img?{background: `url(${trackData.background_img}) center center / cover`}:{backgroundColor: trackData.color}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div style={{background: `url(${trackData.cover}) center center / cover`, width: 300, height: 300, position: 'relative', bottom: 0, pointerEvents: 'all'}} />
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 20}}>
                    <Text content={trackData.name} inBlock color={Colors.default} size={40} styleBlock={{padding: 5, paddingRight: 25}}/>
                    <Text content={trackData.artist_name} inBlock color={Colors.bodyfont} size={25} styleBlock={{marginTop: 10, paddingRight: 25, padding: 5, width: 'fit-content'}}/>
                </div>
            </div>
            <div style={{height: 50, display: 'flex', marginTop: 10, width: 60, justifyContent: 'space-between'}}>
                <Icon name='addList'/>
                <Icon name='heard' isClick={ isFavorite? isFavorite : false }/>
            </div>
            </div>
            <div className="" style={{width: '100%', borderBottom: `1px solid ${Colors.bodyfont}`, height: 50, marginTop: 400, display: 'flex', alignItems: 'center', justifyContent: 'flex-start'}}>
                {trackData.subtitle&&<Button title='subtitle' onClick={()=>null} type='choice'/>}
                {containers.map((item)=>{
                    return (
                        <Button title={item} onClick={()=>setCurrentContainer(item)} type='choice' active={item === currentContainer}/>
                    )
                })}
            </div>
            {currentContainer === 'tags' && id && <TagsTable id={id}/>} 
        </div>
    );
};
