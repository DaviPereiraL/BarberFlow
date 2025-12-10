/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", 
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',    // Laranja (Destaque)
        background: '#18181b', // Preto Fosco (Fundo)
        card: '#27272a',       // Cinza Escuro (Cartões)
        text: '#f4f4f5',       // Branco (Texto Principal)
        muted: '#a1a1aa'       // Cinza Claro (Texto Secundário)
      },
    },
  },
  plugins: [],
}