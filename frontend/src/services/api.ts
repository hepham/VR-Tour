import axios from 'axios';
import { Tour, Scene, NavigationData } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const tourAPI = {
  getTours: async (): Promise<Tour[]> => {
    const response = await apiClient.get('/tours/');
    return response.data.results || response.data;
  },

  getTourDetail: async (tourId: number): Promise<Tour> => {
    const response = await apiClient.get(`/tours/${tourId}/`);
    return response.data;
  },

  getTourNavigation: async (tourId: number): Promise<NavigationData> => {
    const response = await apiClient.get(`/tours/${tourId}/navigation/`);
    return response.data;
  },
};

export const sceneAPI = {
  getSceneDetail: async (sceneId: number): Promise<Scene> => {
    const response = await apiClient.get(`/scenes/${sceneId}/`);
    return response.data;
  },
};

export const getMediaUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
}; 