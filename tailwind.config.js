/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // === NOWOŚĆ: OCHRONA KOLORÓW Z EXCELA ===
  safelist: [
    {
      // Ten wzór chroni przed usunięciem WSZYSTKIE najpopularniejsze kolory tła z Tailwinda.
      // Od teraz możesz wpisać w Excelu np. bg-fuchsia-500, bg-lime-500, bg-cyan-600 itd.!
      pattern: /bg-(slate|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(300|400|500|600|700|800)/,
    }
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}