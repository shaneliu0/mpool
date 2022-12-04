import axios from "axios";
import * as Logging from '../Logging';

export interface PoolSeasonData {
    id: number;
    name: string;

    collapsedBodyText: string;
    expandedBodyText: string;
    requestId?: number;
    poolId?: number;
}
export const getPoolSeasons = async (): Promise<PoolSeasonData[]> => {
    const resp = await axios.get('/pool/season');

    return (resp.data as PoolSeasonData[]).map(p => {
        return {
            id: p.id,
            name: p.name,

            collapsedBodyText: p.collapsedBodyText,
            expandedBodyText: p.expandedBodyText,
            requestId: p.requestId,
            poolId: p.poolId,
        }
    });
};

export interface PoolSeasonDetails {
    id: number;
    displayTitle: string;
    destinations: { label: string, value: string, location: { latitude: number, longitude: number } }[];
}
export const defaultPoolSeasonDetails: PoolSeasonDetails = { id: -1, displayTitle: "", destinations: [] };
export const getPoolSeasonDetails = async (seasonId: number): Promise<PoolSeasonDetails> => {
    const resp = await axios.get(`/pool/season/${seasonId}`);

    return (resp.data as PoolSeasonDetails);
}

interface PoolPlace {
    name: string;
    coords: {
        latitude: number;
        longitude: number;
    }
}
export interface PoolRequestData {
    requestId: number;
    seasonName: string;
    seasonId: number;
    statusMessage: string;
    poolId?: number;
    createdAt: number;
    updatedAt: number;
    departTime: number;
    from: PoolPlace;
    to: PoolPlace;
    destinations: { label: string, value: string, location: { latitude: number, longitude: number } }[];
}
export const defaultPoolRequestData: PoolRequestData = {
    requestId: -1,
    seasonName: "",
    seasonId: -1,
    statusMessage: "",
    createdAt: 0,
    updatedAt: 0,
    departTime: 0,
    from: { name: "", coords: { latitude: 0, longitude: 0 }},
    to: { name: "", coords: { latitude: 0, longitude: 0 }},
    destinations: [],
};
export const getPoolRequest = async (seasonId: number, requestId: number): Promise<PoolRequestData> => {
    const resp = await axios.get(`/pool/season/${seasonId}/request/${requestId}`);

    return (resp.data as PoolRequestData);
}

export interface SubmitPoolRequestData {
    departDate: number;
    fromId: string;
    toId: string;
}
export interface SubmitPoolRequestResp {
    requestId: number;
}
export const postPoolRequest = async (seasonId: number, data: SubmitPoolRequestData): Promise<SubmitPoolRequestResp> => {
    const resp = await axios.post(`/pool/season/${seasonId}`, data);

    return (resp.data as SubmitPoolRequestResp);
}


export interface PoolMember {
    userId: string;
    name: string;
    username?: string;
    photoUrl: string;
}
export type PoolStatus = "potential" | "confirmed";
export interface PoolData {
    poolId: number;
    seasonName: string;
    status: PoolStatus;
    statusMessage: string;
    departTime: number;
    from: PoolPlace;
    to: PoolPlace;
    members: PoolMember[]
}
export const defaultPoolData: PoolData = {
    poolId: -1,
    seasonName: "",
    status: "potential",
    statusMessage: "",
    departTime: 0,
    from: { name: "", coords: { latitude: 0, longitude: 0 }},
    to: { name: "", coords: { latitude: 0, longitude: 0 }},
    members: [],
}
export const getPool = async (poolId: number): Promise<PoolData> => {
    const resp = await axios.get(`/pool/${poolId}`);

    return (resp.data as PoolData);
}