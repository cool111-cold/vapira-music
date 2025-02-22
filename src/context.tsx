import axios from 'axios';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GetAllTrack } from './routs/routs';

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

interface MyContextType {
    langue: string;
    setLangue: React.Dispatch<React.SetStateAction<string>>;
    trackList: TrackData[];
    trackIndex: number;
    setTrackIndex: React.Dispatch<React.SetStateAction<number>>;
    GetFullTrack: (id: string) => TrackData | undefined;
    userIndex: number;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [langue, setLangue] = useState("EN");
    const [trackList, setTrackList] = useState<TrackData[]>([
        {
            id: '',
            name: '',
            artist_name: '',
            cover: "",
            color: "",
            subtitle: '',
            isLike: false,
            background_img: ""
        }]);
    

    useEffect(() => {
        const fetchTracks = async () => {
            const data = await GetAllTrack();
            setTrackList(data);
        };

        fetchTracks();
    }, []);




    const [trackIndex, setTrackIndex] = useState(0);
    const [userIndex, setUserIndex] = useState(1);

    const GetFullTrack = (id: string): TrackData | undefined => {
        return trackList.find((item) => item.id === id);
    };

    return (
        <MyContext.Provider value={{ langue, setLangue, trackList, trackIndex, setTrackIndex, GetFullTrack, userIndex }}>
            {children}
        </MyContext.Provider>
    );
};

export const useMyContext = () => {
    const context = useContext(MyContext);
    if (context === undefined) {
        throw new Error('useMyContext must be used within a MyProvider');
    }
    return context;
};
