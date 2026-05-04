export type Tag = {
    id: number;
    name: string;
    color: string;
    image?: string;
    autor_id: number;
}

export type Track = {
    id: number;
    album_id: number;
    artist_id: number;
    name: string;
    artist_name: string;
    is_favorite?: boolean;
    sub: boolean;
    cover: string;
    time: number;
    tags: Tag[];
}

export type PlayList = {
    id: number;
    artist_id: number;
    name: string;
    artist_name: string;
    is_favorite?: boolean;
    cover: string;
    tracks: Track[];
    type: string;
    date: string;
    color?: 'white' | 'black';
}

export type IconType = {
    size?: number;
    color?: string;
    isClick?: boolean;
    active?: boolean;
    hoverColor?: string;
}