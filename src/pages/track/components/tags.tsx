import React, { useEffect, useState } from "react";
import { GetTagsById } from "../../../routs/routs";
import { Tag } from "../../../components/types";
import { TagContainer } from "./tag";
import { Icon } from "../../../components/icon";
 
interface TagsTableProps {
    id: string;
}

export const TagsTable:React.FC<TagsTableProps> = ({id}) => {
    const [tags, setTags] = useState<Tag[]>();

    useEffect(() => {
        const fetchTracks = async () => {
            let newId = Number(id);
            const data = await GetTagsById({id: newId});
            setTags(data)
        };

        fetchTracks();
    }, [id]);

    const handleDelTag = (id: number) => {
        setTags(tags?.filter((item) => item.id !== id));

    }

    if (!tags) {
        return <Icon name='load' style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 100}} />
    }

    return(
        <div style={{display: "flex", height: 100, gap: 10, marginTop: 16, width: '100%'}}>
            {tags.map((item)=>{
                return (
                    <TagContainer title={item.name} color={item.color} image={item.image} id={item.id} onClick={handleDelTag}/>
                )
            })}
            
        </div>
    )
}