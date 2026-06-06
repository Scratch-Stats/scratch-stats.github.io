/**
 * Scratch Stats Backend Server
 * Serves API endpoints that interact with the Scratch API
 */

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../'));

// Constants
const SCRATCH_API_BASE = 'https://api.scratch.mit.edu/v3';
const DEFAULT_TIMEOUT = 10000;
const RATE_LIMIT_DELAY = 100;

// ============================================
// Utility Functions
// ============================================

async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScratchStatsBot/1.0 (Express)',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(url, maxRetries = 3, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithTimeout(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const backoffDelay = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// API Routes - User
// ============================================

app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = `${SCRATCH_API_BASE}/users/${username}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:username/projects', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/users/${username}/projects?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:username/followers', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/users/${username}/followers?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:username/following', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/users/${username}/following?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:username/favorites', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/users/${username}/favorites?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:username/studios', async (req, res) => {
  try {
    const { username } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/users/${username}/studios?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Routes - Projects
// ============================================

app.get('/api/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/projects/${projectId}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/project/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/projects/${projectId}/stats`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/project/:projectId/comments', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/projects/${projectId}/comments?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/project/:projectId/remixes', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/projects/${projectId}/remixes?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Routes - Studios
// ============================================

app.get('/api/studio/:studioId', async (req, res) => {
  try {
    const { studioId } = req.params;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/studios/${studioId}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/studio/:studioId/projects', async (req, res) => {
  try {
    const { studioId } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/studios/${studioId}/projects?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/studio/:studioId/comments', async (req, res) => {
  try {
    const { studioId } = req.params;
    const { limit = 40, offset = 0 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/studios/${studioId}/comments?limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Routes - Search
// ============================================

app.get('/api/search/projects', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/search/projects?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search/users', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/search/users?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API Routes - Analytics
// ============================================

app.get('/api/stats/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await fetchWithRetry(`${SCRATCH_API_BASE}/users/${username}`);
    const projects = await fetchWithRetry(`${SCRATCH_API_BASE}/users/${username}/projects?limit=1`);
    const followers = await fetchWithRetry(`${SCRATCH_API_BASE}/users/${username}/followers?limit=1`);
    const following = await fetchWithRetry(`${SCRATCH_API_BASE}/users/${username}/following?limit=1`);
    
    res.json({
      username: user.username,
      id: user.id,
      status: user.profile.status,
      bio: user.profile.bio,
      joined: user.history.joined,
      isScratchTeam: user.scratchteam,
      projectCount: user.statistics.projects,
      followerCount: user.statistics.followers,
      followingCount: user.statistics.following,
      commentCount: user.statistics.comments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const [project, stats] = await Promise.all([
      fetchWithRetry(`${SCRATCH_API_BASE}/projects/${projectId}`),
      fetchWithRetry(`${SCRATCH_API_BASE}/projects/${projectId}/stats`),
    ]);
    
    res.json({
      id: project.id,
      name: project.name,
      author: project.author.username,
      description: project.description,
      instructions: project.instructions,
      created: project.created,
      modified: project.modified,
      shared: project.share_date,
      visibility: project.visibility,
      isPublished: project.is_published,
      commentsAllowed: project.comments_allowed,
      stats: {
        views: stats.views,
        loves: stats.loves,
        favorites: stats.favorites,
        remixes: stats.remixes,
        comments: stats.comments,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    await sleep(RATE_LIMIT_DELAY);
    const url = `${SCRATCH_API_BASE}/search/projects?q=*&mode=trending&limit=${limit}`;
    const data = await fetchWithRetry(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Server Startup
// ============================================

app.listen(PORT, () => {
  console.log(`Scratch Stats Backend running on http://localhost:${PORT}`);
  console.log('Serving Scratch API endpoints');
});
