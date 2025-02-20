import React, { useEffect } from "react"
import { Radio } from "../../components/radio"
import { TrackList } from "../../components/track-list"
import { useMyContext } from "../../context"
import axios from "axios"

export const MainPage = () => {
    const {trackList} = useMyContext();
    

    return (
        <div className="defoult-page">
            {/* <Radio/> */}
            <TrackList data={trackList}/>
        </div>
    )
}