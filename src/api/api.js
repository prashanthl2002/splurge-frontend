import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

// matches @GetMapping("/gettransactions")
export const getTransactions = (category = '') => {
    const url = category
        ? `${BASE_URL}/gettransactions?category=${category}`
        : `${BASE_URL}/gettransactions`;
    return axios.get(url);  // ← return was missing before, now added
};

// matches @PostMapping("/transactions")
export const addTransaction = (data) => {
    return axios.post(`${BASE_URL}/transactions`, data);
};

// matches @GetMapping("/transactions/summary")
export const getSummary = (month, year) => {
    return axios.get(`${BASE_URL}/transactions/summary?month=${month}&year=${year}`);
};

// matches @PutMapping("/budget")
export const setBudget = (data) => {
    return axios.put(`${BASE_URL}/budget`, data);
};

// matches @DeleteMapping("/deletetransactions/{id}")
export const deleteTransaction = (id) => {
    return axios.delete(`${BASE_URL}/deletetransactions/${id}`);
};

export const getRoast = (month, year) => {
    return axios.get(`${BASE_URL}/ai/roast?month=${month}&year=${year}`);
};