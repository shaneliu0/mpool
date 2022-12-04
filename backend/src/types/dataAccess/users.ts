import axios from "axios";

export interface ProfileContentBlock {
    heading: string;
    text?: string;
    tiles?: string[];
}
export interface Profile {
    photoUrl: string;
    name: string;
    description: string;
    content: ProfileContentBlock[];
}
export const defaultProfile: Profile = {
    photoUrl: "",
    name: "",
    description: "",
    content: [],
};
export async function getProfile(userId: string): Promise<Profile> {
    const resp = await axios.get(`/user/${userId}/profile`);
    return (resp.data as Profile);
}