import { useEffect, useState } from "react";
import { AddTag } from "../../pages/track/components/add-tag"
import { Tag } from "../types";
import { GetTagsByAuthorId } from "../../routs/routs";

export const Radio = () => {
    const [result, setResult] = useState<string>();
    const [findContainer, setFindContainer] = useState<Tag[]>();
    const [allTags, setAllTags] = useState<Tag[]>();

    useEffect(() => {
        const fetchTagsByAuthorId = async () => {
            const allTags = await GetTagsByAuthorId({ id: 1 });
            setAllTags(allTags);
        };

        fetchTagsByAuthorId();
    }, []);
    

    const finding = (findText: string | undefined) => {
        if (!findText) {
            return undefined;
        }

        return allTags?.filter((item)=>
            item.name.toLowerCase().includes(findText?.toLowerCase())
        )
    }

    useEffect(()=>{
        setFindContainer(finding(result))
    },[result])

    const blockStyle = {
        display: "flex", 
        gap: 10, 
        marginTop: 16, 
        width: '100%',
    }

    return (
        <div className="radio" style={
            findContainer && findContainer.length > 0 && findContainer[0].image
              ? { background: `url('${findContainer[0].image}') center center / contain` }
              : {}
          }>
            <AddTag style={blockStyle} result={setResult} content={findContainer} />
        </div>
    )
}