import { request } from "./client";

export const getRoomStatus = (code, username = "") => {
  return request("/room_status", {
    method: "POST",
    body: { code, username },
  });
};

export const createRoom = (sid, username) => {
  return request("/create_room", {
    method: "POST",
    body: { username, sid },
  });
};

export const joinRoom = (sid, code, username) => {
  return request("/join_room", {
    method: "POST",
    body: { sid, code, username },
  });
};

export const leaveRoom = (sid, code, username) => {
  return request("/leave_room", {
    method: "POST",
    body: { sid, code, username },
  });
};

export const kickPlayer = (sid, code, targetUsername) => {
    return request("/kick_player", {
        method: "POST",
        body: { sid, code, targetUsername },
    });
};