import axios from 'axios';
import type { Database } from '../types';

const JSONBIN_API_KEY = '$2a$10$2EXYkBLG9hlyY8HZN7ABKOVwtBKpIsi86FZ72iU8.AJ4SFD92D3Wy'; // Replace with your JSONBin.io API key
const BIN_ID = '67a12c15e41b4d34e4838ee6'; // Replace with your bin ID
const BASE_URL = 'https://api.jsonbin.io/v3/b';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Master-Key': JSONBIN_API_KEY,
    'Content-Type': 'application/json',
  },
});

export async function fetchData(): Promise<Database> {
  try {
    const response = await api.get(`/${BIN_ID}/latest`);
    return response.data.record;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}

export async function updateData(data: Database): Promise<void> {
  try {
    await api.put(`/${BIN_ID}`, data);
  } catch (error) {
    console.error('Error updating data:', error);
    throw new Error(`Failed to update data: ${error.message}`);
  }
}