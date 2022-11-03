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
    destinations: { label: string, value: string, location: { latitude: number, longitude: number } }[];
}
export const getPoolSeasonDetails = async (seasonId: number): Promise<PoolSeasonDetails> => {
    const resp = await axios.get(`/pool/season/${seasonId}`);

    return (resp.data as PoolSeasonDetails);
}