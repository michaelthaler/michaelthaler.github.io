# Exploration

A lightweight browser mockup for a 2-player sequential exploration board game on a side-length-5 hex map.

## Open It

Open [index.html](/Users/mthaler/GitHub/games/exploration/index.html) in a browser. There is no build step.

## Mockup Assumptions

- The larger board is a hexagon of radius 4 around the center, for 61 total hexes.
- Both players start on the center camp.
- Each turn starts with 2 base energy, plus any stored tea from the previous turn.
- Moving to an adjacent hex costs 1 energy.
- Landing on a face-down hex reveals it privately to that player.
- Exploiting costs 1 energy and can happen once per turn.
- Each player may exploit each non-base hex once.
- `destination` is the main VP source and scores a random value from 2 to 5 VP.
- `tea` stores `+2` energy for that player's next turn.
- `spy` reveals every adjacent face-down hex privately.
- `study` unlocks the next ring for that player only.
- A hex becomes public after it is exploited, or after both players have revealed it privately.
- Players may share a hex.
- Two last-ring destination spaces are replaced with end game hexes.
- When both endgame hexes have been exploited, the game ends immediately.
- The browser mockup uses a pass-the-device overlay between turns to avoid leaking private information.

## Ring Distribution

- Ring 1: 1 destination, 1 tea, 2 spy, 2 study.
- Ring 2: 3 destination, 3 tea, 3 spy, 3 study.
- Ring 3: 5 destination, 5 tea, 4 spy, 4 study.
- Ring 4: 10 destination, 6 tea, 6 spy, 0 study, 2 end game.

## Tile Totals

- 19 destination tiles
- 15 tea tiles
- 15 spy tiles
- 9 study tiles
- 2 end game tiles
- 1 center base tile

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

Each destination uses a small custom SVG thumbnail in the mockup, and the destination deck is shuffled before assigning VP hexes on the board.

## Why This Shape Works

- The ring lock system makes `study` meaningful instead of just a tempo boost.
- Random 2-5 VP destination values make private exploration matter without forcing outer-ring math to do all the scoring work.
- Tea improves longer routes without directly scoring.
- Spy helps route planning by revealing the whole neighborhood around its tile.
- Per-player exploitation keeps the board contested without making discoveries disposable after the first visitor.
- Private reveals create tension around route planning without making the board unreadable forever.
- Endgame hexes give the outer ring a strong strategic purpose beyond just higher VP.

## Good Next Design Questions

- Should endgame hexes have their own VP value, or should they only matter as timing triggers?
- Should a player be allowed to exploit an endgame hex without publicly announcing its type first?
- Should `spy` stay purely informational, or should it later gain denial or bluff mechanics?
- Should there be tie-breakers beyond raw VP once both endgame hexes are exhausted?
