/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Adicionando sua paleta de cores personalizada
      colors: {
        'night-indigo': '#1B003F',    // Cor de fundo principal
        'twilight-purple': '#4B0082', // Degradês e acentos
        'midnight-blue': '#191970',   // Variação escura
        'lavender-haze': '#E6E6FA',   // Textos claros e fundos suaves
        'dusky-blue': '#6495ED',      // Botões e destaques
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}
