import React, { useEffect, useState, CSSProperties } from "react";
import { GetTagsById } from "../../../routs/routs";
import { Tag } from "../../../components/types";
import { TagContainer } from "./tag";
import { Icon } from "../../../components/icon";
import { AddTag } from "./add-tag";
import { GetTagsByAuthorId, AddTrackTag, DeleteTrackTag } from "../../../routs/routs";
import { useMyContext } from "../../../context";

interface TagsTableProps {
    id: string;
}

export const TagsTable: React.FC<TagsTableProps> = ({ id }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [result, setResult] = useState<string | undefined>("");
    const [findContainer, setFindContainer] = useState<Tag[]>([]);
    const { userIndex } = useMyContext();

    useEffect(() => {
        const fetchTracks = async () => {
            let newId = Number(id);
            const data = await GetTagsById({ id: newId });
            setTags(data);
        };

        const fetchTagsByAuthorId = async () => {
            const allTags = await GetTagsByAuthorId({ id: userIndex });
            setAllTags(allTags);
        };

        fetchTracks();
        fetchTagsByAuthorId();
    }, [id, userIndex]);

    useEffect(() => {
        if (allTags && tags) {
            setFindContainer(allTags.filter((item) => !tags.some((e) => e.id === item.id)));
        }
    }, [allTags, tags]);

    const handleDelTag = (index: number) => {
        setTags(tags.filter((item) => item.id !== index));
        DeleteTrackTag({ tag_id: index, track_id: Number(id), user_id: userIndex });
    };

    const finding = (findText: string | undefined) => {
        if (!findText) {
            return allTags.filter((item) => !tags.some((e) => e.id === item.id));
        }

        return allTags.filter(
            (item) =>
                item.name.toLowerCase().includes(findText.toLowerCase()) &&
                !tags.some((e) => e.id === item.id)
        );
    };

    useEffect(() => {
        setFindContainer(finding(result));
    }, [result, allTags, tags]);

    const handleAddTag = (index: number) => {
        if (allTags && tags) {
            setTags([...tags, ...allTags.filter((item) => item.id === index)]);
            setFindContainer((prev) => prev.filter((item) => item.id !== index));
            AddTrackTag({ tag_id: index, track_id: Number(id), user_id: userIndex });
        }
    };

    if (!tags.length) {
        return (
            <Icon
                name="load"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 100 }}
            />
        );
    }

    const blockStyle:CSSProperties = {
        display: "flex",
        gap: 10,
        marginTop: 16,
        width: "100%",
        flexWrap: 'wrap'
    };

    return (
        <div style={{ width: "100%" }}>
            <div style={blockStyle}>
                {tags.map((item) => (
                    <TagContainer
                        key={item.id}
                        title={item.name}
                        color={item.color}
                        image={item.image}
                        id={item.id}
                        onClick={handleDelTag}
                        type="del"
                    />
                ))}
            </div>
            <AddTag style={blockStyle} result={setResult} content={findContainer} onAddTag={handleAddTag} />
        </div>
    );
};
