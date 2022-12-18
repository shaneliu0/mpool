import moment from "moment";


export function removeTextInParenthesis(text: string) {
    return text.replace(/\([^)]*\)/g, '');
}

export function databaseReadyCurrentTime() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

export function roundCoordinatesTo3Decimals(coords: { latitude: number, longitude: number }) {
    return {
        latitude: Math.round(coords.latitude * 1000) / 1000,
        longitude: Math.round(coords.longitude * 1000) / 1000,
    }
}