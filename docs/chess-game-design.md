# Browser Chess Game Design

## Goal

Build a browser-based chess game that fits this Jekyll site's lightweight architecture:

- a single page at `_pages/chess.md`
- JavaScript modules in `assets/js/chess/`
- no framework dependency
- responsive on desktop and mobile

The first shipping version should feel polished and trustworthy before it feels feature-heavy.

## Product Direction

### Core pitch

A clean, readable chess board that works well on the web site, teaches the current position clearly, and makes legal play frictionless.

### Experience goals

- Fast to start: open page and play immediately
- Legible: board state, turn, check, and last move are obvious
- Forgiving: legal move highlighting reduces input errors
- Expandable: same-device play first, bot play and clocks later

### Recommended MVP

Ship local two-player chess on one device first.

This keeps the initial scope manageable while still requiring the full chess rules engine:

- legal movement for all pieces
- check and checkmate
- stalemate
- castling
- en passant
- pawn promotion
- move history
- restart and undo

### Defer until after MVP

- AI opponent
- multiplayer networking
- clocks and time controls
- PGN export/import
- opening explorer
- analysis mode

## Page Layout

### Main layout

Use a two-column layout on desktop and a single column on mobile.

- Left: board
- Right: game panel

### Board panel

- 8x8 board using CSS grid
- coordinates on edges
- selected square highlight
- legal target highlights
- last move highlight
- check highlight on king square

### Game panel

- current turn
- status text
- move list
- captured pieces or material count
- controls: new game, undo, flip board

### Mobile behavior

- board remains largest element
- panel stacks below board
- move list collapses or becomes shorter
- tap-first interaction replaces hover assumptions

## Visual Direction

Keep the look aligned with the existing site rather than introducing an entirely separate game shell.

- Use the site's existing button styles where possible
- Add a slightly richer board treatment than the snake page
- Prefer SVG or inline piece assets over emoji for consistency
- Use motion sparingly: piece move fade/slide, subtle square highlight transitions

Suggested board accents:

- light squares: warm stone
- dark squares: muted green or slate
- last move: translucent gold
- legal moves: soft ring or dot, not bright neon

## Technical Shape

### Suggested file structure

```text
_pages/chess.md
assets/js/chess/game.mjs
assets/js/chess/logic.mjs
assets/js/chess/rules.mjs
assets/js/chess/render.mjs
assets/js/chess/notation.mjs
scripts/chess_logic_test.mjs
```

### Module responsibilities

`game.mjs`

- bootstraps the page
- wires DOM events
- coordinates render/update flow
- schedules delayed bot turns later if added

`logic.mjs`

- owns top-level game state transitions
- handles selection, move submission, undo, restart, promotion flow
- returns next immutable state

`rules.mjs`

- generates pseudo-legal moves
- filters illegal moves that leave king in check
- detects check, mate, stalemate, castling, en passant, promotion

`render.mjs`

- updates board DOM and side panel
- maps state to classes, labels, and move list UI

`notation.mjs`

- generates SAN-like move strings for display
- later can support FEN or PGN export

## State Model

Use a single serializable state object. That makes testing easy and leaves room for undo, save/load, and bot play.

```js
{
  board: Array(64), // null or { color, type }
  turn: "white" | "black",
  selectedSquare: number | null,
  legalTargets: number[],
  lastMove: null | {
    from: number,
    to: number,
    piece: string,
    capture: boolean,
    promotion: string | null,
    castle: "king" | "queen" | null,
    enPassant: boolean
  },
  moveHistory: [],
  captured: {
    white: [],
    black: []
  },
  castlingRights: {
    whiteKingSide: boolean,
    whiteQueenSide: boolean,
    blackKingSide: boolean,
    blackQueenSide: boolean
  },
  enPassantTarget: number | null,
  pendingPromotion: null | {
    from: number,
    to: number,
    color: "white" | "black"
  },
  status: "setup" | "playing" | "promotion" | "checkmate" | "stalemate",
  winner: "white" | "black" | null,
  checkColor: "white" | "black" | null,
  boardFlipped: boolean
}
```

## Input Model

Support both pointer and keyboard interaction.

### Pointer flow

- Tap or click a piece to select it
- Tap or click a highlighted target to move
- Tap another friendly piece to switch selection
- Tap outside valid targets to clear selection

### Keyboard flow

- arrow keys move board focus
- enter or space selects
- enter confirms a highlighted move
- escape clears selection

## Core Loop

Chess is event-driven, not tick-driven.

The main loop should be:

1. Render current state
2. Wait for player input
3. Interpret intent: select, reselection, move, undo, restart, flip, promote
4. Validate against legal moves
5. Apply move effects to state
6. Recompute derived status
7. Render next state
8. If the game is over, stop normal move input until restart or undo

### Per-turn loop

```text
Player input
-> choose square or action
-> if selecting friendly piece, compute legal targets
-> if moving to legal target, create move candidate
-> if candidate requires promotion, enter promotion sub-state
-> apply move
-> update castling rights, en passant target, captured pieces, move history
-> detect check, checkmate, or stalemate
-> switch turn if game continues
-> render
```

### Promotion sub-loop

Promotion should pause the normal turn flow.

```text
Pawn reaches back rank
-> set pendingPromotion
-> show promotion chooser overlay or inline tray
-> wait for player choice
-> finalize move with selected piece
-> resume end-of-turn evaluation
```

### Bot-ready extension

If a bot is added later, keep the same loop and insert a delayed decision step after the human move:

```text
Human move resolves
-> render
-> if mode is vs-bot and game still playing
-> lock board input
-> compute bot move after short delay
-> apply move
-> unlock board input
-> render
```

## Rules Strategy

Keep rules pure and deterministic.

Recommended approach:

1. Generate pseudo-legal moves for the selected piece
2. Simulate each move on a copied board
3. Reject moves that leave the moving side in check
4. Use the remaining list as legal moves

This is slower than an optimized engine, but more than fast enough for browser chess and much easier to trust.

## Rendering Strategy

Use a persistent 64-cell board DOM like the snake grid.

Do not rebuild the board on every action. Instead:

- create cells once
- update classes and piece nodes in place
- only repaint changed squares when possible

Useful square classes:

- `chess-square--light`
- `chess-square--dark`
- `chess-square--selected`
- `chess-square--legal`
- `chess-square--capture`
- `chess-square--last-move`
- `chess-square--check`

## Accessibility Notes

- mark the board as an interactive application region
- expose status updates with an `aria-live` region
- give each square an accessible label such as "E4 empty" or "Black knight on F6"
- keep all actions available without hover

## Implementation Phases

### Phase 1: Rules foundation

- board representation
- initial position setup
- move generation per piece
- check detection

### Phase 2: Playable local game

- selection and move input
- legal move highlighting
- capture handling
- castling, en passant, promotion
- mate and stalemate detection

### Phase 3: UX polish

- move list
- last move and check highlights
- undo
- flip board
- improved mobile layout

### Phase 4: Stretch features

- simple bot
- clocks
- FEN/PGN support
- saved games

## Test Plan

Add logic tests similar to the existing snake tests, but focused on rule correctness.

High-value tests:

- each piece's legal movement from representative positions
- king cannot move into check
- pinned piece cannot expose king
- castling blocked or illegal through check
- en passant only on the immediately following move
- promotion flow creates the chosen piece
- checkmate and stalemate recognition
- undo restores full state

## Recommended First Build Slice

If implementation starts next, build in this order:

1. `logic.mjs` state shape and starting board
2. `rules.mjs` for pawns, rooks, bishops, knights, queens, kings
3. simple board render with click selection
4. legal move highlighting and move application
5. special rules
6. move list and polish

That sequence gets a playable board on screen early without painting us into a corner.
