/**
 * Scratch API Examples - Node.js
 * 
 * This file contains examples for using the Scratch API in Node.js
 * Install: npm install node-fetch (or use built-in fetch in Node.js 18+)
 */

// For Node.js versions below 18, uncomment:
// const fetch = require('node-fetch');

// ============================================
// Constants
// ============================================

const SCRATCH_API_BASE = 'https://api.scratch.mit.edu/v3';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const RATE_LIMIT_DELAY = 100; // ms between requests

// ============================================
// Utility Functions
// ============================================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScratchStatsBot/1.0 (Node.js)',
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

/**
 * Fetch with retry and exponential backoff
 */
async function fetchWithRetry(url, maxRetries = 3, delay = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithTimeout(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const backoffDelay = delay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries - 1} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Sleep function for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// User API Functions
// ============================================

/**
 * Get user profile
 */
async function getUser(username) {
  const url = `${SCRATCH_API_BASE}/users/${username}`;
  return fetchWithRetry(url);
}

/**
 * Get user projects
 */
async function getUserProjects(username, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/users/${username}/projects?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get all user projects (with pagination)
 */
async function getAllUserProjects(username) {
  const allProjects = [];
  let offset = 0;
  const limit = 40;
  
  while (true) {
    const projects = await getUserProjects(username, limit, offset);
    
    if (projects.length === 0) break;
    
    allProjects.push(...projects);
    offset += limit;
  }
  
  return allProjects;
}

/**
 * Get user followers
 */
async function getUserFollowers(username, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/users/${username}/followers?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get users following a user
 */
async function getUserFollowing(username, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/users/${username}/following?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get user favorites
 */
async function getUserFavorites(username, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/users/${username}/favorites?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get user studios
 */
async function getUserStudios(username, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/users/${username}/studios?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

// ============================================
// Project API Functions
// ============================================

/**
 * Get project metadata
 */
async function getProject(projectId) {
  const url = `${SCRATCH_API_BASE}/projects/${projectId}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get project statistics
 */
async function getProjectStats(projectId) {
  const url = `${SCRATCH_API_BASE}/projects/${projectId}/stats`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get project comments
 */
async function getProjectComments(projectId, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/projects/${projectId}/comments?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get project remixes
 */
async function getProjectRemixes(projectId, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/projects/${projectId}/remixes?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

// ============================================
// Studio API Functions
// ============================================

/**
 * Get studio information
 */
async function getStudio(studioId) {
  const url = `${SCRATCH_API_BASE}/studios/${studioId}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get studio projects
 */
async function getStudioProjects(studioId, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/studios/${studioId}/projects?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

/**
 * Get studio comments
 */
async function getStudioComments(studioId, limit = 40, offset = 0) {
  const url = `${SCRATCH_API_BASE}/studios/${studioId}/comments?limit=${limit}&offset=${offset}`;
  await sleep(RATE_LIMIT_DELAY);
  return fetchWithRetry(url);
}

// ============================================
// Analysis Functions
// ============================================

/**
 * Get comprehensive user statistics
 */
async function getUserStats(username) {
  try {
    const [user, projects, followers, following] = await Promise.all([
      getUser(username),
      getUserProjects(username, 1),
      getUserFollowers(username, 1),
      getUserFollowing(username, 1),
    ]);
    
    return {
      username: user.username,
      id: user.id,
      status: user.profile.status,
      bio: user.profile.bio,
      joined: user.history.joined,
      isScratchTeam: user.scratchteam,
      projectCount: projects.length,
      followerCount: followers.length,
      followingCount: following.length,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

/**
 * Get comprehensive project details
 */
async function getProjectDetails(projectId) {
  try {
    const [project, stats] = await Promise.all([
      getProject(projectId),
      getProjectStats(projectId),
    ]);
    
    return {
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
    };
  } catch (error) {
    console.error('Error getting project details:', error);
    throw error;
  }
}

/**
 * Get top projects by views for a user
 */
async function getTopProjectsByViews(username, limit = 10) {
  try {
    const projects = await getAllUserProjects(username);
    
    // Get stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await getProjectStats(project.id);
        return {
          name: project.name,
          id: project.id,
          views: stats.views,
          loves: stats.loves,
          favorites: stats.favorites,
          remixes: stats.remixes,
        };
      })
    );
    
    // Sort by views and return top N
    return projectsWithStats
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top projects:', error);
    throw error;
  }
}

// ============================================
// Usage Examples
// ============================================

/**
 * Example 1: Get user information
 */
async function example1_getUser() {
  console.log('=== Example 1: Get User Info ===');
  try {
    const user = await getUser('Scratch');
    console.log(`Username: ${user.username}`);
    console.log(`Status: ${user.profile.status}`);
    console.log(`Bio: ${user.profile.bio}`);
    console.log(`Joined: ${user.history.joined}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Get user projects
 */
async function example2_getUserProjects() {
  console.log('\n=== Example 2: Get User Projects ===');
  try {
    const projects = await getUserProjects('Scratch', 5);
    console.log(`Found ${projects.length} projects:`);
    projects.forEach((project, i) => {
      console.log(`${i + 1}. ${project.name} (ID: ${project.id})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: Get project details
 */
async function example3_getProjectDetails() {
  console.log('\n=== Example 3: Get Project Details ===');
  try {
    // Assuming project ID 3614697 exists
    const details = await getProjectDetails(3614697);
    console.log(JSON.stringify(details, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 4: Get user statistics
 */
async function example4_getUserStats() {
  console.log('\n=== Example 4: Get User Statistics ===');
  try {
    const stats = await getUserStats('Scratch');
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 5: Get top projects by views
 */
async function example5_getTopProjects() {
  console.log('\n=== Example 5: Get Top Projects by Views ===');
  try {
    const topProjects = await getTopProjectsByViews('Scratch', 5);
    console.log('Top 5 Projects:');
    topProjects.forEach((project, i) => {
      console.log(
        `${i + 1}. ${project.name} - ${project.views.toLocaleString()} views`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Run Examples
// ============================================

// Uncomment to run examples:
/*
(async () => {
  await example1_getUser();
  await example2_getUserProjects();
  await example3_getProjectDetails();
  await example4_getUserStats();
  await example5_getTopProjects();
})();
*/

// Export for module use
module.exports = {
  // User functions
  getUser,
  getUserProjects,
  getAllUserProjects,
  getUserFollowers,
  getUserFollowing,
  getUserFavorites,
  getUserStudios,
  
  // Project functions
  getProject,
  getProjectStats,
  getProjectComments,
  getProjectRemixes,
  
  // Studio functions
  getStudio,
  getStudioProjects,
  getStudioComments,
  
  // Analysis functions
  getUserStats,
  getProjectDetails,
  getTopProjectsByViews,
  
  // Utility functions
  fetchWithRetry,
  sleep,
};
