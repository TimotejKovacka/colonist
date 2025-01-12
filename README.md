# WebSockets requirements
- Lifecycle of connectivity
    - On socket Connection with ack (ack going from client)
    - On socket About to be disconnected
    - On soccket disconnected
    - On message
## Server
- Namespace per resource type
    - Allows unified business logic handling per resource type
    - Using ResourceIds as the room identifier
- State library requires a publisher
    - Publisher needs access to namespace so that it can send patches to rooms in respective namespace

## Client
- Hook to get socket & connectivity status
- Stable way to attach listener to messages in a hook too


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
- `dice` icons 48x48 pixels

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

### Client architecture

```mermaid
classDiagram
    class GameClient {
        -WebSocketService wsService
        -GameFacade gameFacade
        -UIStore uiStore
        +initialize()
        +cleanup()
    }

    class WebSocketService {
        -socket: WebSocket
        +connect()
        +disconnect()
        +send(message)
        +onMessage(callback)
    }

    class GameFacade {
        -gameState: GameState
        -gameRenderer: GameRenderer
        -actionService: GameActionService
        -turnService: TurnService
        -tradeService: TradeService
        -diceService: DiceService
        +initialize()
        +handleGameAction(action)
        +getCurrentState()
    }

    class GameState {
        -board: Board
        -players: Player[]
        -currentTurn: number
        -gamePhase: GamePhase
        -resources: ResourceMap
        +updateState(newState)
        +getState()
    }

    class GameRenderer {
        -canvas: HTMLCanvasElement
        -sprites: SpriteMap
        -drawingService: DrawingService
        +initialize(canvas)
        +render()
        +handleInput()
    }

    class GameActionService {
        -validationService: ValidationService
        +buildSettlement(position)
        +buildCity(position)
        +buildRoad(position)
        +playDevelopmentCard(card)
    }

    class TurnService {
        -gameState: GameState
        +startTurn()
        +endTurn()
        +handleDiceRoll()
        +handleResourceDistribution()
    }

    class TradeService {
        -gameState: GameState
        +proposeTradeOffer(offer)
        +acceptTrade(tradeId)
        +rejectTrade(tradeId)
        +tradeBankResources(offer)
    }

    class DiceService {
        +rollDice()
        +validateRoll()
        +handleRobber()
    }

    class ValidationService {
        +validateAction(action)
        +checkResourceRequirements()
        +checkPlacementRules()
    }

    class UIStore {
        -activePlayer: Player
        -selectedAction: Action
        -tradeOffers: TradeOffer[]
        -gameMessages: Message[]
        +updateUI(change)
        +getUIState()
    }

    class DrawingService {
        -ctx: CanvasContext
        -assets: AssetMap
        +drawBoard()
        +drawPieces()
        +drawUI()
    }

    GameClient --> GameFacade
    GameClient --> WebSocketService
    GameClient --> UIStore

    GameFacade --> GameState
    GameFacade --> GameRenderer
    GameFacade --> GameActionService
    GameFacade --> TurnService
    GameFacade --> TradeService
    GameFacade --> DiceService

    GameRenderer --> DrawingService
    GameActionService --> ValidationService

    TurnService --> GameState
    TradeService --> GameState
```

## Game Logic

- Default Board has to include the following:
  - 4 wood
  - 4 sheep
  - 4 wheat
  - 3 stone
  - 3 brick
  - 1 desert

# notes

# WS

- Table representing what a sent message means from the perspective of entity

|        | Subscribe                                        | Unsubscribe                                     | Patch                                         |
|--------|--------------------------------------------------|-------------------------------------------------|-----------------------------------------------|
| Server | Confirmation of subscription requested by Client | Confirmation of unsubscribe requested by Client | Telling Client to update state based on patch |
| Client | Requesting subscription                          | Asking to cleanup existing subscription         | Telling Server to update state based on patch |

- Table representing what received message means from the perspective of entity

|        | Subscribe                                         | Unsubscribe                              | Patch                              |
|--------|---------------------------------------------------|------------------------------------------|------------------------------------|
| Server | Client asking to receive updates about a resource | Client asking to be removed from updates | Update server state based on patch |
| Client | Server ack Client's request                       | Server Ack client's request              | Update client state based on patch |