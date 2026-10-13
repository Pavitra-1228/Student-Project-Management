const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        sunken: token('sunken'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        brand: token('brand'),
        'brand-soft': token('brand-soft'),
        'on-brand': token('on-brand'),
        accent: token('accent'),
        sun: token('sun'),
        danger: token('danger'),
        todo: token('todo'),
        progress: token('progress'),
        review: token('review'),
        done: token('done')
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '18px',
        control: '12px'
      },
      boxShadow: {
        card: '0 1px 0 rgb(var(--line) / 0.6), 0 8px 24px -12px rgb(var(--shadow) / 0.18)',
        lift: '0 18px 40px -16px rgb(var(--shadow) / 0.35)'
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        drift: {
          '0%': { transform: 'translateX(-6%)' },
          '100%': { transform: 'translateX(6%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' }
        }
      },
      animation: {
        rise: 'rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-in': 'slideIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slideUp 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        fade: 'fade 180ms ease-out',
        'pulse-soft': 'pulseSoft 1.4s ease-in-out infinite',
        drift: 'drift 7s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
