import axios from "axios";

export interface ProfileContentBlock {
    heading: string;
    promptId: number;
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
}
export const defaultContentBlock = { heading: "", promptId: -1 };
export async function getProfile(userId: string): Promise<Profile> {
    const resp = await axios.get(`/user/${userId}/profile`);
    return (resp.data as Profile);
}
export async function getOwnProfile(): Promise<Profile> {
    const resp = await axios.get('/user/profile');
    return (resp.data as Profile);
}

export interface ProfileContentPrompt {
    title: string;
    promptId: number;
}
export async function getProfileContentPrompts() {
    const resp = await axios.get('/user/profile/edit/prompts');
    return (resp.data as ProfileContentPrompt[]);
}

export async function saveProfile(newProfile: Profile) {
    const resp = await axios.post('/user/profile', newProfile);
    return (resp.data as Profile);
}