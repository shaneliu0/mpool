import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import moment from "moment";
import { PoolMemberStatus } from "../dataAccess/poolData";
import React from 'react';

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

export function truncateAndEllipsis(text: string, len: number) {
    if (text.length <= len) return text;
    return text.substring(0, len) + "...";
}

export function getIconFromPoolMemberStatus(status: PoolMemberStatus | undefined): JSX.Element {
    switch (status) {
        case "potential":
            return <MaterialCommunityIcons name="account-clock" size={24} color="black" />;
        default:
            return <AntDesign name="arrowright" size={24} color="black" style={{ marginRight: 15, }} />;
    }
}

export const placeCatEnum = {
    airport_terminal: "airport_terminal",
    dorm: "dorm",
    apartment_complex: "apartment_complex",
    "": "",
};