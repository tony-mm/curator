## Project Overview
This is a React UI Kit developed using Vite as the build tool. The project follows a component-based architecture with Tailwind CSS for styling and includes visualization components using D3.js.

## Technologies
- **Framework**: React 18.2.0 with React Router DOM 6.22.0
- **Build Tool**: Vite 4.3.9 with React plugin
- **Styling**: Tailwind CSS 3.3.1 with PostCSS 8.4.21
- **Visualization**: D3.js (d3-geo, d3-scale, d3-scale-chromatic)
- **State Management**: React's Context API

## Project Structure
- `src/`
  - Components: React functional components (Dashboard.jsx, Links.jsx)
  - Tailwind CSS configuration via `tailwind.config.js`
  - Public assets: `public/_redirects`
- `node_modules/`
  - Libraries: uuid, react-hot-toast, i18n-iso-countries

## Recent Changes
1. Added new components and updated routing logic (08da402)
2. UI improvements and state management updates (799bf24)
3. Initial project setup (a9ea09b)

## Key Features
- Responsive design system using Tailwind's utilities
- Interactive D3 visualizations
- SEO-friendly routing with public redirects
- Hot-reloading development server (Vite)
- i18n support for locale handling

## Development Setup
```bash
npm install
npm run dev
```