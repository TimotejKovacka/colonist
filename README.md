# Colonist - Catan like game in pixel art

## Graphics

All graphics have been designed in [photopea](https://photopea.com).

Game sprites are added to a single sprite sheet of size 2048x2048 and shipped in `.webp` or `.png` format based on browser support.

### Sprites

- `settlements/cities` 64x64 pixels
- `roads` 32x128 pixels (accommodates for rotation)
- `resource` icons 32x32 pixels
- `port` icons 48x48 pixels
- `hex` tiles 256x256 pixels (accommodates for detail)

## High level architecture

```mermaid
graph TB
    subgraph Client Layer
        C1[Web Client 1]
        C2[Web Client 2]
        C3[Web Client n]
    end

    subgraph WebSocket Layer
        WS[WebSocket Server]
    end

    subgraph Game Server
        GE[Game Engine]
        GM[Game Manager]
        TM[Turn Manager]
        TR[Trade Manager]
    end

    subgraph Data Layer
        Redis[(Redis - Game State)]
        DB[(Database - Persistent Data)]
    end

    C1 & C2 & C3 <--> WS
    WS <--> GE
    GE <--> GM
    GM <--> TM
    GM <--> TR
    GM <--> Redis
    GM <--> DB
```