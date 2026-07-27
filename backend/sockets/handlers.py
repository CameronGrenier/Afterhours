
def register_socket_handlers(sio, room_service):

    @sio.event
    async def connect(sid, environ):
        print(f"Socket connected with {sid}")

    @sio.event
    async def disconnect(sid, reason=None):
        await room_service.handle_disconnect(sid)

    @sio.on("game_action")
    async def handle_game_action(sid, payload):
        return await room_service.handle_game_action(sid, payload)
