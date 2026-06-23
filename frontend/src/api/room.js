import { request } from "./client";


export const getRoomStatus = (code, username = "") => {
  request("/room_status", {
    method: "POST",
    body: JSON.stringify({code, username}),
  });
}

export const createRoom = (sid, username) => {
  request("/create_room", {
    method: "POST",
    body: JSON.stringify({ username, sid }),
  });
}

export const joinRoom = (sid, code, username) => {
  request("/join_room", {
    method: "POST",
    body: {sid, code, username}
  });
}

export const leaveRoom = (sid, code, username) => {
  request("/leave_room", {
    method: "POST",
    body: {sid, code, username}
  });
}