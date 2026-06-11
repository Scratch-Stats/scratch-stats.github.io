# Scratch Stats

A comprehensive statistics and analytics platform for the Scratch community, powered by the official Scratch API.

## 🌟 Features

- **Real-time Statistics**: Get live data from the Scratch community
- **Project Search**: Search for projects across the Scratch platform
- **User Search**: Find and explore Scratch users
- **Trending Projects**: View currently trending projects
- **User Verification System**: Admin panel to verify and manage users
- **Featured Content**: Showcase featured projects, studios, and users
- **Admin Dashboard**: Manage platform content with secure admin login

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with responsive design
- **JavaScript (Vanilla)**: Interactive functionality without frameworks
- **Language Composition**: JavaScript (67.2%), CSS (19.8%), HTML (13%)

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **CORS**: Cross-Origin Resource Sharing for frontend-backend communication
- **node-fetch**: HTTP client for Scratch API calls

## 📦 Installation & Setup

### Prerequisites
- Node.js 16+ (or 18+ for built-in fetch support)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Scratch-Stats/-.git
   cd Scratch-Stats
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server**
   ```bash
   npm start
   # Or for development with auto-reload
   npm run dev
   ```

4. **Open the frontend**
   - Open `index.html` in your browser
   - Or serve it via a local server (e.g., `python -m http.server`)
   - Backend must be running at `http://localhost:3000`

## 🔌 API Endpoints

### User Endpoints
- `GET /api/user/:username` - Get user profile
- `GET /api/user/:username/projects` - Get user projects
- `GET /api/user/:username/followers` - Get user followers
- `GET /api/user/:username/following` - Get users being followed
- `GET /api/user/:username/favorites` - Get user's favorites
- `GET /api/user/:username/studios` - Get user's studios

### Project Endpoints
- `GET /api/project/:projectId` - Get project metadata
- `GET /api/project/:projectId/stats` - Get project statistics
- `GET /api/project/:projectId/comments` - Get project comments
- `GET /api/project/:projectId/remixes` - Get project remixes

### Studio Endpoints
- `GET /api/studio/:studioId` - Get studio information
- `GET /api/studio/:studioId/projects` - Get studio projects
- `GET /api/studio/:studioId/comments` - Get studio comments

### Search Endpoints
- `GET /api/search/projects?q=query` - Search projects
- `GET /api/search/users?q=query` - Search users

### Analytics Endpoints
- `GET /api/stats/user/:username` - Get comprehensive user statistics
- `GET /api/stats/project/:projectId` - Get comprehensive project details
- `GET /api/stats/trending?limit=10` - Get trending projects

## 📚 Usage Examples

### Frontend API Client

The `frontend/api-client.js` provides a simple interface for backend communication:

```javascript
// Get user information
const user = await getUser('Scratch');

// Search for projects
const projects = await searchProjects('games', 20);

// Get project details with stats
const projectDetails = await getProjectDetails(3614697);

// Get trending projects
const trending = await getTrendingProjects(10);
```

### Direct Backend Calls

```bash
# Get Scratch team user stats
curl http://localhost:3000/api/stats/user/Scratch

# Search for projects
curl "http://localhost:3000/api/search/projects?q=platformer&limit=5"

# Get trending projects
curl http://localhost:3000/api/stats/trending?limit=10
```

## 🔐 Admin Login

**Username**: `Admin1`
**Password**: `Scratch@Admin2024!Secure`

⚠️ **Security Note**: Change these credentials in production and implement proper authentication.

## 📊 Data Management

- Featured content is stored in browser `localStorage`
- Verified users list is persisted locally
- All data syncs automatically on page load

## 🚀 Deployment

### Heroku
```bash
cd backend
git push heroku main
```

### Docker
```bash
docker build -t scratch-stats .
docker run -p 3000:3000 scratch-stats
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Frontend URL for CORS (default: all origins)

## 📝 File Structure

```
Scratch-Stats/
├── backend/
│   ├── server.js          # Express server with API endpoints
│   └── package.json       # Node.js dependencies
├── frontend/
│   └── api-client.js      # Frontend API client utilities
├── index.html             # Main HTML file
├── script.js              # Frontend logic and event handlers
├── styles.css             # Styling
└── README.md              # This file
```

## 🔗 Scratch API Documentation

- Official Scratch API: https://scratch.mit.edu/
- API Status: https://api.scratch.mit.edu/
- Scratchdb: https://scratchdb.org/

## 📋 Changelog

### v1.1.0 - Search Bar Fixes & Improvements
- 🐛 **Fixed**: Search bar event listener delegation and click-outside detection
- ✅ **Enhanced**: Search filter toggle positioning and mobile responsiveness
- ✅ **Improved**: Dropdown positioning on smaller screens
- ✅ **Added**: Proper focus handling for search input
- ✅ **Fixed**: CSS styling for filter button alignment
- ✅ **Updated**: Language composition stats in documentation

### v1.0.0 - Initial Release
- ✅ Backend Express server with full Scratch API integration
- ✅ Frontend API client for backend communication
- ✅ Real-time search functionality
- ✅ Trending projects display
- ✅ Admin dashboard for content management
- ✅ Real statistics from Scratch API

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚖️ Disclaimer

This project is not affiliated with or endorsed by MIT Media Lab or Scratch. All data is sourced from the public Scratch API.

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

**Happy Scratching! 🎨**
