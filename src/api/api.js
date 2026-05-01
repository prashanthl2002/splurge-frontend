import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const getTransactions = (category, month, year) =>
  axios.get(`${BASE_URL}/gettransactions`, { params: { category, month, year } });

export const addTransaction = (data) =>
  axios.post(`${BASE_URL}/transactions`, data);

export const getSummary = (month, year) =>
  axios.get(`${BASE_URL}/transactions/summary`, { params: { month, year } });

export const setBudget = (data) =>
  axios.put(`${BASE_URL}/budget`, data);

export const deleteTransaction = (id) =>
  axios.delete(`${BASE_URL}/deletetransactions/${id}`);

export const getRoast = (month, year) =>
  axios.get(`${BASE_URL}/ai/analysis`, { params: { month, year } });