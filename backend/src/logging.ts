import { Response } from "express";


export function resError(res: Response, error: any) {
    console.error(error);
    
    res.status(500).json({ error: "Something went wrong" });
}

export function logError(error: any) {
    console.error(error);
}