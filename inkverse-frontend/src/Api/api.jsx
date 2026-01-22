import axios from "axios";
import qs from "qs";

// const api = axios.create({
//   baseURL: "https://localhost:5221/api",
// });

const api = axios.create({
  baseURL: "https://localhost:5221/api",
  paramsSerializer: (params) =>
    qs.stringify(params, { arrayFormat: "repeat" }),
});


api.interceptors.request.use((config) => {
  const saved = localStorage.getItem("auth");
  const auth = saved ? JSON.parse(saved) : null;
  const token = auth?.accessToken;
  

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export const reactToReview = (reviewId, type) => {
  return api.post(`/reviews/${reviewId}/react`, {
    reactionType: type,
  });
};

export default api;
