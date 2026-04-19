import { INITIAL_STATE, handleKey, type CalcState, type Key } from './calculator.js';
import { renderButtons, renderState, bindKeyboard } from './ui.js';

function main(): void {
  const expressionEl = document.getElementById('expression')!;
  const resultEl = document.getElementById('result')!;
  const buttonsEl = document.getElementById('buttons')!;

  let state: CalcState = INITIAL_STATE;

  function onKey(key: Key): void {
    state = handleKey(state, key);
    renderState(expressionEl, resultEl, state);
  }

  renderButtons(buttonsEl, onKey);
  bindKeyboard(onKey);
  renderState(expressionEl, resultEl, state);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
