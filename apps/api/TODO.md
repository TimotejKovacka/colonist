- [ ] JIT auth for game sessions for new players
- [ ] Auth roles, so that we can enforce resource permissions (owner can modify lobby settings, etc.)
- [ ] Create websocket route and handling
- [ ] Figure out how to resolve map reference to map data within lobby service

### Game flow
- Session is reused or initialized & WebSocket established
- Lobby is retrieved through lobby id (6 char) or created (that person gains ownership)
- We subscribe to the websocket `lobby` channel to receive updates
- Owner:
    - Can change game settings (ws support)
    - Can remove players from lobby (ws support)
    - Can start game (ws support)
    - Can leave game -> ownership is transfered to second oldest player in lobby (ws support)
- Player:
    - Can change player color from the available colours (ws support)
    - Can leave game (ws support)
