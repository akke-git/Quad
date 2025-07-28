/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          'ubuntu-mono': ['Ubuntu Mono', 'monospace'],
          'nanum-gothic': ['Nanum Gothic', 'sans-serif'],
          'apple-gothic': ['Apple SD Gothic Neo', 'sans-serif'],
        },
        colors: {
          green: {
            400: '#4ade80',
            600: '#16a34a',
            700: '#15803d',
          },
        },
      },
    },
    plugins: [],
  }