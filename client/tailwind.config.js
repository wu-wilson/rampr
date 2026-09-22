/** @type {import('tailwindcss').Config} */

/** Reference a channel-based CSS custom property so Tailwind opacity modifiers resolve. */
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '560px',
      md: '760px',
      lg: '900px',
    },
    extend: {
      colors: {
        paper: ch('--paper'),
        hover: ch('--hover'),
        ink: ch('--ink'),
        'ink-2': ch('--ink-2'),
        'ink-3': ch('--ink-3'),
        line: ch('--line'),
        'line-2': ch('--line-2'),
        'line-3': ch('--line-3'),
        wave: ch('--wave'),
        up: ch('--up'),
        down: ch('--down'),
        flat: ch('--flat'),
      },
      fontFamily: {
        sans: [
          '"Söhne"',
          '"Suisse Int\'l"',
          '"Switzer"',
          '"Helvetica Neue"',
          '-apple-system',
          '"SF Pro Text"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        rail: '1200px',
      },
    },
  },
  plugins: [],
};
