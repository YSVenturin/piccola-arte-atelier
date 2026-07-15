import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
    throw new Error(
        "The variable VITE_API_BASE_URL was not defined.",
    );
}

export const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10_000,
    headers: {
        Accept: "application/json",
    }
})