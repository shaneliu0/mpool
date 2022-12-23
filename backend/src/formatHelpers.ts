import moment from "moment";


export function removeTextInParenthesis(text: string) {
    return text.replace(/\([^)]*\)/g, '');
}

export function databaseReadyCurrentTime() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

export function databaseReadyTime(time: Date) {
    return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

export function getCorrectDate(date: Date) {
    const adjusted = new Date(Date.parse(date.toUTCString()) - date.getTimezoneOffset() * 60000);
    adjusted.setHours(adjusted.getHours() + 12);
    return new Date(adjusted);
}

// takes the distance between two coordinates and converts it to miles
export function convertCoordDistToMiles(coordDist: number) {
    return coordDist / 1609.34;
}

export function roundCoordinatesTo3Decimals(coords: { latitude: number, longitude: number }) {
    return {
        latitude: Math.round(coords.latitude * 1000) / 1000,
        longitude: Math.round(coords.longitude * 1000) / 1000,
    }
}