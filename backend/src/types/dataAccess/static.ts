import axios from 'axios';

export interface ContactBlurbResp {
    blurb: string;
}
export const getContactBlurb = async (): Promise<ContactBlurbResp> => {
    const resp = await axios.get('/static/contactblurb');

    return (resp.data as ContactBlurbResp);
}