/** @type {import('tailwindcss').Config} */

/** Reference a channel-based CSS custom property so Tailwind opacity modifiers resolve. */
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      md: '760px',
    },
    extend: {
      colors: {
        paper: ch('--paper'),
        raised: ch('--raised'),
        ink: ch('--ink'),
        'ink-strong': ch('--ink-strong'),
        brand: ch('--brand'),
        'brand-dark': ch('--brand-dark'),
        'brand-soft': ch('--brand-soft'),
        muted: {
          1: ch('--muted-1'),
          2: ch('--muted-2'),
          3: ch('--muted-3'),
        },
        line: {
          1: ch('--line-1'),
          2: ch('--line-2'),
          3: ch('--line-3'),
          4: ch('--line-4'),
        },
        up: ch('--up'),
        down: ch('--down'),
        flat: ch('--flat'),
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      maxWidth: {
        rail: '1280px',
      },
    },
  },
  plugins: [],
};
