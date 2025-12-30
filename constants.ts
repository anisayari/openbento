export const GITHUB_WORKFLOW_YAML = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export const BASE_COLORS = [
  // Solids
  { name: 'White', bg: 'bg-white', text: 'text-gray-900', hex: '#ffffff', textHex: '#111827', type: 'solid' },
  { name: 'Black', bg: 'bg-gray-900', text: 'text-white', hex: '#111827', textHex: '#ffffff', type: 'solid' },
  { name: 'Gray', bg: 'bg-gray-100', text: 'text-gray-900', hex: '#f3f4f6', textHex: '#111827', type: 'solid' },
  { name: 'Red', bg: 'bg-red-500', text: 'text-white', hex: '#ef4444', textHex: '#ffffff', type: 'solid' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-white', hex: '#f97316', textHex: '#ffffff', type: 'solid' },
  { name: 'Yellow', bg: 'bg-amber-400', text: 'text-gray-900', hex: '#fbbf24', textHex: '#111827', type: 'solid' },
  { name: 'Green', bg: 'bg-emerald-500', text: 'text-white', hex: '#10b981', textHex: '#ffffff', type: 'solid' },
  { name: 'Blue', bg: 'bg-blue-500', text: 'text-white', hex: '#3b82f6', textHex: '#ffffff', type: 'solid' },
  { name: 'Violet', bg: 'bg-violet-500', text: 'text-white', hex: '#8b5cf6', textHex: '#ffffff', type: 'solid' },
  { name: 'Pink', bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899', textHex: '#ffffff', type: 'solid' },
  
  // Gradients
  { name: 'Sunset', bg: 'bg-gradient-to-br from-orange-400 to-rose-400', text: 'text-white', hex: 'linear-gradient(135deg, #fb923c 0%, #fb7185 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Ocean', bg: 'bg-gradient-to-br from-blue-400 to-emerald-400', text: 'text-white', hex: 'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Insta', bg: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', text: 'text-white', hex: 'linear-gradient(45deg, #facc15 0%, #ef4444 50%, #9333ea 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Midnight', bg: 'bg-gradient-to-br from-gray-900 to-blue-900', text: 'text-white', hex: 'linear-gradient(135deg, #111827 0%, #1e3a8a 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Unicorn', bg: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400', text: 'text-white', hex: 'linear-gradient(135deg, #f9a8d4 0%, #d8b4fe 50%, #818cf8 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Hyper', bg: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500', text: 'text-white', hex: 'linear-gradient(90deg, #ec4899 0%, #ef4444 50%, #eab308 100%)', textHex: '#ffffff', type: 'gradient' },
  { name: 'Peachy', bg: 'bg-gradient-to-r from-red-200 via-red-300 to-yellow-200', text: 'text-gray-900', hex: 'linear-gradient(90deg, #fecaca 0%, #fca5a5 50%, #fef08a 100%)', textHex: '#111827', type: 'gradient' },
  { name: 'Aurora', bg: 'bg-gradient-to-t from-gray-900 via-purple-900 to-violet-600', text: 'text-white', hex: 'linear-gradient(0deg, #111827 0%, #581c87 50%, #7c3aed 100%)', textHex: '#ffffff', type: 'gradient' },
];

export const AVATAR_PLACEHOLDER = "https://picsum.photos/200/200";