export type Key =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '+' | '-' | '*' | '/'
  | '.' | '%'
  | '=' | 'C' | 'Backspace';

export type Phase = 'idle' | 'entering' | 'operator' | 'result' | 'error';

export interface CalcState {
  readonly expression: string;
  readonly display: string;
  readonly phase: Phase;
  readonly error: string | null;
}

type EvalResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

export const INITIAL_STATE: CalcState = {
  expression: '',
  display: '0',
  phase: 'idle',
  error: null,
};

function evalExpression(expr: string): EvalResult {
  if (!expr.trim()) return { ok: false, message: 'Empty expression' };

  if (/\/\s*0+(?:\.0*)?\b/.test(expr)) {
    return { ok: false, message: 'Division by zero' };
  }

  try {
    // Safe: expr is assembled only from validated Key characters
    // eslint-disable-next-line no-new-func
    const result = new Function(`'use strict'; return (${expr})`)() as unknown;

    if (typeof result !== 'number' || !isFinite(result)) {
      return { ok: false, message: 'Invalid result' };
    }
    return { ok: true, value: result };
  } catch {
    return { ok: false, message: 'Syntax error' };
  }
}

function formatNumber(n: number): string {
  return parseFloat(n.toPrecision(10)).toString();
}

function buildFullExpression(state: CalcState): string {
  if (state.phase === 'operator') return state.expression.trimEnd();
  if (state.phase === 'result') return state.display;
  return (state.expression + state.display).trim();
}

function handleDigit(state: CalcState, digit: string): CalcState {
  if (state.phase === 'result' || state.phase === 'error') {
    return {
      expression: '',
      display: digit === '0' ? '0' : digit,
      phase: 'entering',
      error: null,
    };
  }

  if (state.phase === 'operator') {
    return {
      ...state,
      display: digit,
      phase: 'entering',
      error: null,
    };
  }

  const newDisplay =
    state.display === '0' ? digit : state.display + digit;

  return { ...state, display: newDisplay, phase: 'entering', error: null };
}

function handleOperator(state: CalcState, op: string): CalcState {
  if (state.phase === 'error') return state;

  // Allow leading minus to start a negative number
  if ((state.phase === 'idle' || state.phase === 'operator') && op === '-') {
    const base = state.phase === 'operator' ? state.expression : '';
    return {
      expression: base,
      display: '-',
      phase: 'entering',
      error: null,
    };
  }

  // Replace trailing operator if already in operator phase
  if (state.phase === 'operator') {
    const trimmed = state.expression.trimEnd();
    const newExpr = trimmed.slice(0, -1) + op + ' ';
    return { ...state, expression: newExpr };
  }

  const fullExpr = buildFullExpression(state);
  const evalResult = evalExpression(fullExpr);

  return {
    expression: fullExpr + ' ' + op + ' ',
    display: evalResult.ok ? formatNumber(evalResult.value) : state.display,
    phase: 'operator',
    error: null,
  };
}

function handleEquals(state: CalcState): CalcState {
  if (state.phase === 'error') return { ...INITIAL_STATE };
  if (state.phase === 'idle') return state;
  if (state.phase === 'operator') return state;
  if (state.phase === 'result') return state;

  const fullExpr = buildFullExpression(state);
  const evalResult = evalExpression(fullExpr);

  if (!evalResult.ok) {
    return {
      expression: fullExpr + ' =',
      display: evalResult.message,
      phase: 'error',
      error: evalResult.message,
    };
  }

  return {
    expression: fullExpr + ' =',
    display: formatNumber(evalResult.value),
    phase: 'result',
    error: null,
  };
}

function handleDecimal(state: CalcState): CalcState {
  if (state.phase === 'result' || state.phase === 'error') {
    return { expression: '', display: '0.', phase: 'entering', error: null };
  }

  if (state.phase === 'operator' || state.phase === 'idle') {
    return { ...state, display: '0.', phase: 'entering', error: null };
  }

  if (state.display.includes('.')) return state;

  return { ...state, display: state.display + '.', phase: 'entering' };
}

function handleBackspace(state: CalcState): CalcState {
  if (state.phase === 'result' || state.phase === 'error') {
    return { ...INITIAL_STATE };
  }

  if (state.phase === 'operator') {
    const trimmed = state.expression.trimEnd();
    const withoutOp = trimmed.slice(0, -1).trimEnd();
    const match = withoutOp.match(/[\d.]+$/);
    return {
      expression: withoutOp.length ? withoutOp + ' ' : '',
      display: match ? match[0] : '0',
      phase: withoutOp.length ? 'operator' : 'idle',
      error: null,
    };
  }

  if (state.display.length <= 1) {
    return {
      ...state,
      display: '0',
      phase: state.expression === '' ? 'idle' : state.phase,
    };
  }

  return { ...state, display: state.display.slice(0, -1) };
}

function handlePercent(state: CalcState): CalcState {
  if (state.phase !== 'entering' && state.phase !== 'result') return state;
  const num = parseFloat(state.display);
  if (isNaN(num)) return state;
  return {
    ...state,
    display: formatNumber(num / 100),
    phase: 'entering',
    error: null,
  };
}

export function handleKey(state: CalcState, key: Key): CalcState {
  switch (key) {
    case 'C':         return { ...INITIAL_STATE };
    case 'Backspace': return handleBackspace(state);
    case '=':         return handleEquals(state);
    case '+':
    case '-':
    case '*':
    case '/':         return handleOperator(state, key);
    case '.':         return handleDecimal(state);
    case '%':         return handlePercent(state);
    default:          return handleDigit(state, key);
  }
}
