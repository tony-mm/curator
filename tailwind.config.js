/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium Color Palette
        'deep-navy': '#0F2784',
        'vibrant-blue': '#1E40AF',
        'navy-accent': '#0a1f6e',
        'sky-blue': '#3B82F6',
        'off-white': '#F8FAFC',
        'border-light': '#E2E8F0',

        // Primary (updated to deep navy)
        primary: '#0F2784',
        'primary-container': '#1E40AF',
        'primary-fixed': '#dde1ff',
        'primary-fixed-dim': '#b8c4ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#a8b8ff',
        'on-primary-fixed': '#001453',
        'on-primary-fixed-variant': '#173bab',
        // Secondary
        secondary: '#00687a',
        'secondary-container': '#57dffe',
        'secondary-fixed': '#acedff',
        'secondary-fixed-dim': '#4cd7f6',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#006172',
        'on-secondary-fixed': '#001f26',
        'on-secondary-fixed-variant': '#004e5c',
        // Tertiary
        tertiary: '#611e00',
        'tertiary-container': '#872d00',
        'tertiary-fixed': '#ffdbce',
        'tertiary-fixed-dim': '#ffb59a',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#ffa583',
        'on-tertiary-fixed': '#380d00',
        'on-tertiary-fixed-variant': '#802a00',
        // Surface & Background (updated)
        background: '#F8FAFC',
        surface: '#F8FAFC',
        'surface-bright': '#F8FAFC',
        'surface-dim': '#d9dadb',
        'surface-container': '#edeeef',
        'surface-container-low': '#f3f4f5',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'surface-container-lowest': '#ffffff',
        'surface-variant': '#e1e3e4',
        // Text & UI
        'on-background': '#191c1d',
        'on-surface': '#191c1d',
        'on-surface-variant': '#444653',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        'inverse-primary': '#b8c4ff',
        // Outlines & Separators (updated)
        outline: '#757684',
        'outline-variant': '#E2E8F0',
        // Status Colors
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        'floating': '0 4px 24px rgba(0,0,0,0.06)',
        'floating-hover': '0 8px 32px rgba(0,0,0,0.12)',
        'glow': '0 0 20px rgba(59,130,246,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.6)',
        'navy-glow': '0 0 15px rgba(15,39,132,0.3)',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-border': 'slide-border 0.3s ease-out',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'slide-border': {
          '0%': { borderLeftWidth: '0px' },
          '100%': { borderLeftWidth: '4px' },
        }
      }
    },
  },
  plugins: [],
}
