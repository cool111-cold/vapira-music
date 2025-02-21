import React, { useEffect, useState } from "react";
import { GetTagsById } from "../../../routs/routs";
import { Tag } from "../../../components/types";
import { TagContainer } from "./tag";
import { Icon } from "../../../components/icon";
import { AddTag } from "./add-tag";
 
interface TagsTableProps {
    id: string;
}

export const TagsTable:React.FC<TagsTableProps> = ({id}) => {
    const [tags, setTags] = useState<Tag[]>();
    const [result, setResult] = useState<string>();
    const [findContainer, setFindContainer] = useState<Tag[]>();

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

    const blockStyle = {
        display: "flex", 
        gap: 10, 
        marginTop: 16, 
        width: '100%',
    }

    const finding = (findText: string | undefined) => {
        if (!findText) {
            return undefined;
        }
        return tags?.filter((item)=>
            item.name.toLowerCase().includes(findText?.toLowerCase())
        )
    }

    useEffect(()=>{
        console.log(finding(result))
        setFindContainer(finding(result))
    },[result])

    if (!tags) {
        return <Icon name='load' style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 100}} />
    }

    return(
        <div style={{width: '100%'}}>
        <div style={blockStyle}>
            {tags.map((item)=>{
                return (
                    <TagContainer title={item.name} color={item.color} image={item.image} id={item.id} onClick={handleDelTag} type="del"/>
                )
            })}
        </div>
        <AddTag style={blockStyle} result={setResult} content={findContainer}/>
        </div>
    )
}