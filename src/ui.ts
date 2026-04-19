import { type Key, type CalcState } from './calculator.js';

type ButtonDescriptor = {
  label: string;
  key: Key;
  className?: string;
};

const BUTTONS: ButtonDescriptor[] = [
  { label: 'C',  key: 'C',         className: 'clear' },
  { label: '⌫',  key: 'Backspace' },
  { label: '%',  key: '%' },
  { label: '/',  key: '/',          className: 'operator' },

  { label: '7',  key: '7' },
  { label: '8',  key: '8' },
  { label: '9',  key: '9' },
  { label: '×',  key: '*',          className: 'operator' },

  { label: '4',  key: '4' },
  { label: '5',  key: '5' },
  { label: '6',  key: '6' },
  { label: '−',  key: '-',          className: 'operator' },

  { label: '1',  key: '1' },
  { label: '2',  key: '2' },
  { label: '3',  key: '3' },
  { label: '+',  key: '+',          className: 'operator' },

  { label: '0',  key: '0',          className: 'wide' },
  { label: '.',  key: '.' },
  { label: '=',  key: '=',          className: 'equals' },
];

const KEYBOARD_MAP: Partial<Record<string, Key>> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '+': '+', '-': '-', '*': '*', '/': '/',
  '.': '.', ',': '.',
  'Enter': '=',
  '=': '=',
  'Escape': 'C',
  'Backspace': 'Backspace',
  'Delete': 'C',
  '%': '%',
};

export function renderButtons(
  container: HTMLElement,
  onKey: (key: Key) => void
): void {
  for (const descriptor of BUTTONS) {
    const btn = document.createElement('button');
    btn.textContent = descriptor.label;
    btn.type = 'button';
    if (descriptor.className) {
      btn.className = descriptor.className;
    }
    btn.addEventListener('click', () => onKey(descriptor.key));
    container.appendChild(btn);
  }
}

export function renderState(
  expressionEl: HTMLElement,
  resultEl: HTMLElement,
  state: CalcState
): void {
  expressionEl.textContent = state.expression;
  resultEl.textContent = state.display;
  resultEl.classList.toggle('error', state.phase === 'error');
}

export function bindKeyboard(onKey: (key: Key) => void): void {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === '/') e.preventDefault();

    const mappedKey = KEYBOARD_MAP[e.key];
    if (mappedKey !== undefined) {
      onKey(mappedKey);
    }
  });
}
