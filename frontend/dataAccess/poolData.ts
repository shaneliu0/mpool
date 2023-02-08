import axios from "axios";

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
    destinations: PoolPlaceCategory[];
    defaultTime?: number;
    enforceFromAirport?: boolean;
    enforceToAirport?: boolean;
    infoAlert?: string;
}
export interface PoolPlaceCategory {
    category: string;
    category_id: string;
    places: PoolPlace[];
}
export const defaultPoolSeasonDetails: PoolSeasonDetails = { id: -1, displayTitle: "", destinations: [] };
export const getPoolSeasonDetails = async (seasonId: number): Promise<PoolSeasonDetails> => {
    const resp = await axios.get(`/pool/season/${seasonId}`);

    return (resp.data as PoolSeasonDetails);
}

export interface PoolPlace {
    name: string;
    id: string;
    coords: {
        latitude: number;
        longitude: number;
    }
}
export const defaultPoolPlace: PoolPlace = {
    name: "",
    id: "",
    coords: {
        latitude: -1,
        longitude: -1,
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
    destinations: PoolPlaceCategory[];
    enforceFromAirport?: boolean;
    enforceToAirport?: boolean;
    matchId?: number;
}
export const defaultPoolRequestData: PoolRequestData = {
    requestId: -1,
    seasonName: "",
    seasonId: -1,
    statusMessage: "",
    createdAt: 0,
    updatedAt: 0,
    departTime: 0,
    from: defaultPoolPlace,
    to: defaultPoolPlace,
    destinations: [],
};
export const getPoolRequest = async (requestId: number): Promise<PoolRequestData> => {
    const resp = await axios.get(`/pool/request/${requestId}`);

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
export interface ValidatePoolRequestResp {
    errorMsg?: string;
}
export const validatePoolRequest = async (seasonId: number, data: SubmitPoolRequestData): Promise<ValidatePoolRequestResp> => {
    const resp = await axios.post(`/pool/season/${seasonId}/validate`, data);

    return (resp.data as ValidatePoolRequestResp);
}

export interface UpdatePoolRequestData {
    departDate?: number;
    fromId?: string;
    toId?: string;
}
export const updatePoolRequest = async (requestId: number, data: UpdatePoolRequestData): Promise<PoolRequestData> => {
    await axios.put(`/pool/request/${requestId}`, data);

    const newSeason = await getPoolRequest(requestId);
    return newSeason;
}
export interface ValidateUpdatePoolRequestResp {
    errorMsg?: string;
}
export const validateUpdatePoolRequest = async (requestId: number, data: UpdatePoolRequestData): Promise<ValidateUpdatePoolRequestResp> => {
    const resp = await axios.post(`/pool/request/${requestId}/validate`, data);

    return (resp.data as ValidateUpdatePoolRequestResp);
}

export type PoolMemberStatus = "potential";
export interface PoolMember {
    userId: string;
    name: string;
    username?: string;
    photoUrl: string;
    status?: PoolMemberStatus;
}
export type PoolStatus = "potential" | "confirmed" | "disabled";
export interface PoolData {
    poolId: number;
    seasonName: string;
    status: PoolStatus;
    statusMessage: string;
    departTime: number;
    from: PoolPlace;
    to: PoolPlace;
    members: PoolMember[]
    error?: string;
}
export const defaultPoolData: PoolData = {
    poolId: -1,
    seasonName: "",
    status: "potential",
    statusMessage: "",
    departTime: 0,
    from: defaultPoolPlace,
    to: defaultPoolPlace,
    members: [],
}
export const getPool = async (poolId: number): Promise<PoolData> => {
    const resp = await axios.get(`/pool/${poolId}`);

    return (resp.data as PoolData);
}

export const getPotentialPool = async (matchId: number): Promise<PoolData> => {
    const resp = await axios.get(`/pool/potential/${matchId}`);

    return (resp.data as PoolData);
}

export const acceptPotentialPool = async (matchId: number): Promise<void> => {
    await axios.post(`/pool/potential/${matchId}/accept`);
}

export const declinePotentialPool = async (matchId: number): Promise<void> => {
    await axios.post(`/pool/potential/${matchId}/decline`);
}

export interface MatchedPoolId {
    poolId: number;
    error?: string;
}
export const getMatchedPoolId = async (matchId: number): Promise<MatchedPoolId> => {
    const resp = await axios.get(`/pool/potential/${matchId}/pool`);

    return (resp.data as MatchedPoolId);
}

export interface LeavePoolData {
    poolId: number;
}
export const leavePool = async (poolId: number): Promise<void> => {
    await axios.delete(`/pool/${poolId}`);
}

export interface GetPoolStatusResp {
    matchId?: number;
}
export const getPoolStatus = async (poolId: number): Promise<GetPoolStatusResp> => {
    const resp = await axios.get(`/pool/${poolId}/status`);

    return (resp.data as GetPoolStatusResp);
}

export const cancelPoolRequest = async (requestId: number): Promise<void> => {
    await axios.delete(`/pool/request/${requestId}`);
}