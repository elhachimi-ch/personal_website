# Chouaib El Hachimi - Researcher Portfolio

A modern, responsive researcher portfolio website built with React and Tailwind CSS. This is a static site ready to be hosted on GitHub Pages.

## Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Fixed Sidebar Navigation**: Easy navigation with collapsible menu on mobile
- **Day/Night Theme Toggle**: Switch between light and dark modes
- **Multiple Sections**:
  - Homepage with hero section and highlights
  - About Me
  - News & Updates
  - Publications with action links (DOI, Publisher, PDF)
  - Projects & Grants with role badges (PI, Co-PI, Member)
  - Honors and Awards
  - People & Collaborators

## Hosting on GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository named `username.github.io` (replace `username` with your GitHub username)
2. Or create any repository and enable GitHub Pages in settings

### Step 2: Upload the Files

Option A - Using Git:
```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
# Copy all files from this folder into the repository
git add .
git commit -m "Initial commit: Researcher portfolio"
git push origin main
```

Option B - Direct Upload:
1. Go to your repository on GitHub
2. Click "Add file" → "Upload files"
3. Drag and drop all files from this folder
4. Commit the changes

### Step 3: Enable GitHub Pages (if needed)

1. Go to repository Settings
2. Scroll to "GitHub Pages" section
3. Select "main" branch as the source
4. Your site will be available at `https://username.github.io`

## File Structure

```
├── index.html           # Main HTML file (serves all routes)
├── 404.html            # Custom 404 page (enables client-side routing)
├── assets/             # CSS and JavaScript bundles
│   ├── index-*.css     # Compiled Tailwind CSS
│   └── index-*.js      # React application bundle
└── README.md           # This file
```

## Customization

To customize the content, you'll need to rebuild the site. The source code is available in the main project repository.

### Updating Content

Edit the following files in the source project:
- `client/src/pages/Home.tsx` - Homepage content
- `client/src/pages/About.tsx` - About page
- `client/src/pages/Publications.tsx` - Publications
- `client/src/pages/ProjectsAndGrants.tsx` - Projects & Grants
- `client/src/pages/Awards.tsx` - Honors and Awards
- `client/src/pages/People.tsx` - Collaborators
- `client/src/pages/News.tsx` - News updates
- `client/src/components/Sidebar.tsx` - Navigation and profile

### Rebuilding

After making changes:
```bash
pnpm install
pnpm build
# Copy contents of dist/public to your GitHub Pages repository
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Optimized bundle size (~170KB gzipped)
- Fast page loads with client-side routing
- No server required

## License

MIT License - Feel free to use this template for your own portfolio.

## Support

For issues or questions about the portfolio, please refer to the source project documentation.
