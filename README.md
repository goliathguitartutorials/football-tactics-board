# Football Tactics Board

An interactive football tactics board built with React and Konva. Design formations, set plays, and create tactical diagrams for football coaching.

## Features

- Interactive canvas for drawing tactical diagrams
- Place and move players on the pitch
- Add footballs, arrows, lines, and other shapes
- Multiple color options for different teams
- Formation templates for quick setup
- Save and load board states
- Player numbering

## Tech Stack

- React 19
- Vite 6
- React Konva for canvas manipulation

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured for GitHub Pages deployment. The deployment happens automatically when changes are pushed to the main branch, using GitHub Actions.

### Manual Deployment

If you need to deploy manually:

1. Build the project: `npm run build`
2. The built files will be in the `dist` directory
3. These files can be deployed to any static hosting service

## Browser Support

Tested and working on modern browsers (Chrome, Firefox, Edge, Safari).

## License

MIT


User info

- To Push changes to your GitHub repository:

git add .
git commit -m "Configure for GitHub Pages deployment"
git push


- To overwrite your local changes with the version on GitHub:

git fetch origin
git reset --hard origin/main

Replace main with your branch name if it's different.