---
permalink: /snake/
title: "Snake"
author_profile: false
classes: wide
---

<div class="snake-game" data-snake-game>
  <div class="snake-hud">
    <div class="snake-score">Score: <span data-snake-score>0</span></div>
    <div class="snake-status" data-snake-status>Playing</div>
    <div class="snake-actions">
      <button type="button" class="btn btn--primary" data-action="pause">Pause</button>
      <button type="button" class="btn" data-action="restart">Restart</button>
    </div>
  </div>

  <div
    class="snake-grid"
    data-snake-grid
    role="application"
    tabindex="0"
    aria-label="Snake game grid"
  ></div>

  <div class="snake-controls" aria-label="On-screen controls">
    <button type="button" class="btn" data-dir="up">Up</button>
    <div class="snake-controls-row">
      <button type="button" class="btn" data-dir="left">Left</button>
      <button type="button" class="btn" data-dir="down">Down</button>
      <button type="button" class="btn" data-dir="right">Right</button>
    </div>
  </div>

  <p class="snake-help">
    Click the grid to focus. Controls: Arrow keys/WASD to move, Space/P to pause, R to restart.
  </p>
</div>

<style>
  .snake-game {
    max-width: 52rem;
    margin: 0 auto;
  }
  .snake-hud {
    display: flex;
    gap: 1rem;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }
  .snake-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .snake-grid {
    --snake-cell-size: 18px;
    display: grid;
    grid-template-columns: repeat(var(--snake-cols), var(--snake-cell-size));
    grid-template-rows: repeat(var(--snake-rows), var(--snake-cell-size));
    gap: 2px;
    padding: 10px;
    border: 1px solid var(--global-border-color);
    border-radius: 6px;
    background: var(--global-bg-color);
    outline: none;
    touch-action: manipulation;
    user-select: none;
  }
  .snake-grid:focus {
    box-shadow: 0 0 0 3px rgba(19, 171, 95, 0.25);
  }
  .snake-cell {
    width: var(--snake-cell-size);
    height: var(--snake-cell-size);
    border-radius: 3px;
    background: var(--global-thead-color);
  }
  .snake-cell--snake {
    background: var(--global-base-color);
  }
  .snake-cell--head {
    background: var(--global-link-color);
  }
  .snake-cell--food {
    background: #ee5f5b;
  }
  .snake-controls {
    display: none;
    margin-top: 0.75rem;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .snake-controls-row {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
  .snake-help {
    margin-top: 0.75rem;
    color: var(--global-text-color-light);
    font-size: 0.9rem;
  }
  @media (max-width: 640px) {
    .snake-grid {
      --snake-cell-size: 14px;
      margin: 0 auto;
    }
    .snake-controls {
      display: flex;
    }
  }
</style>

<script type="module" src="{{ '/assets/js/snake/game.mjs' | relative_url }}"></script>

