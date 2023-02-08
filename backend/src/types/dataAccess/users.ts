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
    errorMsg?: string;
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

export interface CheckedInResp {
    checkedIn: boolean;
    welcomeData: WelcomeMessageData[];
    tosUrl: string;
    errorSignOutMsg?: string;
}
export interface WelcomeMessageData {
    heading: string;
    content: string[];
}
export async function getCheckedIn() {
    const resp = await axios.get('/user/checkedin');
    return (resp.data as CheckedInResp);
}

export async function deleteAccount() {
    await axios.delete('/user');
}

export interface UniversityDataResp {
    universityName?: string;
    universityColors?: object;
}
export async function getUniversityData(): Promise<UniversityDataResp> {
    const resp = await axios.get('/user/university');
    return (resp.data as UniversityDataResp);
}

export async function acceptTos(): Promise<void> {
    await axios.post('/user/accepttos');
}