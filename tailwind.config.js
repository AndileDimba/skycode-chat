/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'whatsapp-green': '#25D366',
        'whatsapp-light-green': '#dcf8c6',
        'whatsapp-bg': '#e5ddd5',
        'whatsapp-gray': '#f0f2f5',
        'whatsapp-text': '#1c1e21',
        'whatsapp-muted': '#667781',
        'whatsapp-header': '#075e54',
        'whatsapp-header-border': '#128c7e',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 1s linear infinite',
      },
      backgroundImage: {
        'whatsapp-pattern': "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"%23e5ddd5\" opacity=\"0.1\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"%23e5ddd5\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')"
      }
    },
  },
  plugins: [],
}
