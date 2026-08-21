# Exploration

A lightweight browser mockup for a 2-player sequential exploration board game on a fixed, sparse radius-5 hex map.

## Open It

Open [index.html](/Users/mthaler/GitHub/games/exploration/index.html) in a browser. There is no build step.

## Mockup Assumptions

- The board uses the attached photograph's exact connected 59-hex footprint within a radius-5 hexagon. Its occupied coordinates never change between seeds; only hidden resources and decks are reshuffled.
- Cat and Train start together on the center house.
- Each turn starts with 3 base energy, plus any stored tea from the previous turn.
- To offset Cat's first-player advantage, Train receives 1 extra energy on its first turn, for 4 energy total.
- Move, Explore, and Exploit are separate actions, each costs 1 energy, and any action may be taken multiple times while energy remains.
- Move places the pawn on an adjacent unlocked hex without revealing it.
- Explore reveals an unknown current hex privately and marks it explored for that player.
- A player may skip Explore when they already know what is under the current hex—for example, because Spy revealed it privately or the other player made it public by exploiting it. Known hexes may be exploited directly.
- Revealed destination hexes show their first-icon suit symbol. Other resources use a teacup for tea, a magnifying glass for spy, a book for study, and a cat for endgame.
- The five rings match the photograph's coral, pink, lavender, pale grey, and mint bands.
- Exploit resolves the current known hex. A player may Exploit multiple different hexes in one turn if movement and energy permit.
- Each player may exploit each non-base hex once.
- `destination` is the VP source. Exploring one reveals its first icon: Mountain (M), Water (W), History (H), or Building (B). That icon selects the VP deck used when the destination is exploited.
- Exploiting a destination draws its deck's top VP card. The card adds one or two icons to that player's collection.
- A destination cannot be exploited after its indicated seven-card VP deck is empty.
- Final VP is `M² + W² + H² + B² + max(M,W,H,B)² + min(M,W,H,B)²`.
- `tea` stores `+2` energy for that player's next turn.
- `spy` reveals every adjacent face-down hex privately.
- `study` unlocks the next ring for that player only.
- `airplane` appears once in each of rings 2–5. Exploiting it activates an optional free flight to any existing hex within 5 hexes, provided the destination ring is unlocked; gaps and intervening tiles are ignored.
- A hex becomes public after it is exploited, or after both players have revealed it privately.
- Players may share a hex.
- Two last-ring destination spaces are replaced with hidden Cat hexes; their locations are not shown until learned normally.
- The first time a Cat is revealed by Explore or Spy, a public countdown begins without revealing its location. After the current turn, the revealer gets 1 additional turn and the other player gets 2.
- The game ends when those final-turn allowances are exhausted, or immediately if both Cat hexes are exploited first.
- The browser mockup uses a pass-the-device overlay between turns to avoid leaking private information.

## AI Self-Play

The existing `train_ai.py`, `analyze_known_hexes.py`, and saved training results model the earlier filled-board, fixed-value destination rules. They are retained as legacy experiments and have not yet been recalibrated for the sparse board or icon scoring.

## Ring Distribution

- Ring 1: 1 destination, 1 tea, 1 spy, 1 study, plus 2 fixed gaps.
- Ring 2: 2 destination, 2 tea, 2 spy, 2 study, 1 airplane, plus 3 fixed gaps.
- Ring 3: 3 destination, 4 tea, 3 spy, 4 study, 1 airplane, plus 3 fixed gaps.
- Ring 4: 4 destination, 5 tea, 4 spy, 4 study, 1 airplane, plus 6 fixed gaps.
- Ring 5: 4 destination, 3 tea, 2 spy, 1 airplane, 2 end game, plus 18 fixed gaps.

## VP Card Set

- 28 cards total.
- 16 single-icon cards: four M, four W, four H, and four B.
- 12 ordered pair cards: two for every unordered pair, with the order reversed. For example, MW and WM are separate cards.
- Four seven-card decks, one for each icon.
- Each deck contains its icon's four single-icon cards plus a random balanced assignment of three of the six pair cards containing that icon.
- Every pair card belongs to exactly one of its two associated icon decks.

The mockup keeps deck order hidden, shows public cards remaining, and records each drawn ordered pair exactly as printed.

## Tile Totals

- 14 destination tiles
- 15 tea tiles
- 12 spy tiles
- 11 study tiles
- 4 airplane tiles
- 2 end game tiles
- 1 center base tile
- 32 fixed gaps relative to a filled radius-5 board

## Destination Pool

- Marrakesh, Morocco
- Waitomo Caves, New Zealand
- Wengen, Switzerland
- Tiger's Nest, Bhutan
- Alfriston, England
- Lisbon, Portugal
- Yosemite, California
- Paris, France
- Harpers Ferry, West Virginia
- Athens, Greece
- Edinburgh, Scotland
- Vienna, Austria
- Bergen, Norway
- Love Valley, Cappadocia, Turkey
- New York, NY
- Lexington, Kentucky
- Philadelphia, PA
- Washington, DC
- Boston, MA
- London, UK
- Sydney, Australia

Fourteen destinations are drawn from this pool for each board. Each uses a small custom SVG thumbnail, receives a first icon, and is shuffled before assignment.

## Why This Shape Works

- The ring lock system makes `study` meaningful instead of just a tempo boost.
- The photograph's fixed gaps create repeatable chokepoints, detours, and branch choices while preserving a connected route from the center.
- First icons make exploration informative before a VP card is committed, while the four finite decks create visible scarcity.
- Squared icon scoring rewards specialization; the extra maximum and minimum terms sharpen the tension between a dominant suit and a balanced collection.
- Tea improves longer routes without directly scoring.
- Spy helps route planning by revealing the whole neighborhood around its tile.
- Airplanes let players jump sparse-board chokepoints without making ring unlocks irrelevant.
- Per-player exploitation keeps the board contested without making discoveries disposable after the first visitor.
- Private reveals create tension around route planning without making the board unreadable forever.
- Hidden Cat hexes make outer-ring exploration a timing decision: finding one starts a short, symmetric public clock with compensation for the non-revealer.

## Good Next Design Questions

- Should `spy` stay purely informational, or should it later gain denial or bluff mechanics?
- Should there be tie-breakers beyond raw VP when the countdown expires?
