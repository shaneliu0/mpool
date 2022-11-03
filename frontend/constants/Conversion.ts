import moment from "moment";

const TIME_MINUTES_PLACEHOLD = "--:-- --";
const TIME_DATE_PLACEHOLD = "---, --- --";

export function formatTime(date: Date, show?: boolean): string {
    if (show !== undefined && !show) return TIME_MINUTES_PLACEHOLD;
    return moment(date).format('LT');
}

export function formatDate(date: Date, show?: boolean): string {
    if (show !== undefined && !show) return TIME_DATE_PLACEHOLD;
    return moment(date).format('ddd, MMM, DD');
}

export function removeInParentheses(text: string) {
    return text.replace(/ *\([^)]*\) */g, "");
}