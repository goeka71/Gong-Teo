// api/user.js

import {
  apiGet,
  apiPost,
  apiPatch,
} from "./client";

export function signup(data) {
  return apiPost("/api/users/signup/", data);
}

export function login(data) {
  return apiPost("/api/users/login/", data);
}

export function getMyInfo() {
  return apiGet("/api/users/me/");
}

export function updateMyInfo(data) {
  return apiPatch("/api/users/me/", data);
}

export function refreshAccessToken(refresh) {
  return apiPost("/api/users/token/refresh/", {
    refresh,
  });
}