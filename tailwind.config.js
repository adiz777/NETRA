/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#070A0F',
        surface: {
          DEFAULT: '#0D121D',
          elevated: '#151C2C',
          subtle: '#1A2338'
        },
        grid: '#1E293B',
        tactical: {
          cyan: '#00F0FF',
          dim: '#06B6D4',
          amber: '#F59E0B',
          crimson: '#EF4444',
          emerald: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      }
    }
  },
  plugins: []
};
