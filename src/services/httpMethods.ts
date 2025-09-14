import axios from 'axios';
import config from "../../config/config";

const API_BASE_URL = `${config.apiBaseUrl}`;

interface RequestParams {
    [key: string]: string | number | boolean;
}

interface Payload {
    [key: string]: unknown;
}

// GET request
export const getRequest = async (endpoint: string, params?: RequestParams): Promise<unknown> => {
    return axios.get(`${API_BASE_URL}${endpoint}`, { params });
};

// POST request
export const postRequest = async (endpoint: string, payload: Payload): Promise<unknown> => {
    return axios.post(`${API_BASE_URL}${endpoint}`, payload);
};

// PUT request
export const putRequest = async (endpoint: string, payload: Payload): Promise<unknown> => {
    return axios.put(`${API_BASE_URL}${endpoint}`, payload);
};

// PATCH request
export const patchRequest = async (endpoint: string, payload: Payload): Promise<unknown> => {
    return axios.patch(`${API_BASE_URL}${endpoint}`, payload);
};

// DELETE request
export const deleteRequest = async (endpoint: string, params?: RequestParams): Promise<unknown> => {
    return axios.delete(`${API_BASE_URL}${endpoint}`, { params });
};
