import axios from "axios";
import qs from "qs";



const api = axios.create({
  baseURL: "http://raedodeh-001-site1.anytempurl.com/api",
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
