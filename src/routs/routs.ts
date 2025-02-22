import axios from 'axios';

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

export const GetAllTrack = async (): Promise<TrackData[]> => {
    const fetchData = async (): Promise<TrackData[]> => {
        try {
            const response = await axios.get('http://y91326yd.beget.tech/tracks');
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error({ error: true, message: error.message });
            } else {
                console.error({ error: true, message: 'An unknown error occurred' });
            }
            return [];
        }
    };

    return await fetchData();
};

// переключатель языка
// полноэкранный режим
//
interface Tags {
    id: number;
    name: string;
    color: string;
    image?: string;
    autor_id: number;
}

interface GetTagsByIdProps {
    id: number;
}

export const GetTagsById = async ({ id }: GetTagsByIdProps): Promise<Tags[]> => {
    const fetchData = async (): Promise<Tags[]> => {
        try {
            const response = await axios.post('http://y91326yd.beget.tech/tags', { id });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error({ error: true, message: error.message });
            } else {
                console.error({ error: true, message: 'An unknown error occurred' });
            }
            return [];
        }
    };

    return await fetchData();
};

export const GetTagsByAuthorId = async ({ id }: GetTagsByIdProps): Promise<Tags[]> => {
    const fetchData = async (): Promise<Tags[]> => {
      try {
        const response = await axios.get(`http://y91326yd.beget.tech/tags/autor/${id}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error({ error: true, message: error.message });
        } else {
          console.error({ error: true, message: 'An unknown error occurred' });
        }
        return [];
      }
    };
  
    return await fetchData();
};

interface TrackTagProps {
  track_id: number;
  tag_id: number;
  user_id: number;
}

export const AddTrackTag = async ({ track_id, tag_id, user_id }: TrackTagProps): Promise<{ message: string }> => {
  const fetchData = async (): Promise<{ message: string }> => {
    try {
      const response = await axios.post('http://y91326yd.beget.tech/trackTags', {
        track_id,
        tag_id,
        user_id,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error({ error: true, message: error.message });
      } else {
        console.error({ error: true, message: 'An unknown error occurred' });
      }
      return { message: 'Failed to add track tag' };
    }
  };

  return await fetchData();
};

export const DeleteTrackTag = async ({ track_id, tag_id, user_id }: TrackTagProps): Promise<{ message: string }> => {
    const fetchData = async (): Promise<{ message: string }> => {
      try {
        const response = await axios.post('http://y91326yd.beget.tech/trackTags/delete', {
          track_id,
          tag_id,
          user_id,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error({ error: true, message: error.message });
        } else {
          console.error({ error: true, message: 'An unknown error occurred' });
        }
        return { message: 'Failed to delete track tag' };
      }
    };
  
    return await fetchData();
};


// export const DelTagsById = async ({ id }: GetTagsByIdProps): Promise<Tags[]> => {
//     const fetchData = async (): Promise<Tags[]> => {
//         try {
//             const response = await axios.delete('http://y91326yd.beget.tech/tags', { id });
//             return response.data;
//         } catch (error) {
//             if (axios.isAxiosError(error)) {
//                 console.error({ error: true, message: error.message });
//             } else {
//                 console.error({ error: true, message: 'An unknown error occurred' });
//             }
//             return [];
//         }
//     };

//     return await fetchData();
// };