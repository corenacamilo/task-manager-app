const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { msalInstance, scopes } = require('../config/azureConfig');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate login URL for Azure Entra ID
router.get('/login', async (req, res) => {
  try {
    const authCodeUrlParameters = {
      scopes: scopes,
      redirectUri: process.env.AZURE_REDIRECT_URI,
    };

    const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Error generating authentication URL' });
  }
});

// Handle Azure callback and create/update user
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    const tokenRequest = {
      code: code,
      scopes: scopes,
      redirectUri: process.env.AZURE_REDIRECT_URI,
    };

    // Exchange code for tokens
    const response = await msalInstance.acquireTokenByCode(tokenRequest);
    const { accessToken, account } = response;

    // Get user profile from Microsoft Graph
    const userProfile = await getUserProfile(accessToken);

    // Find or create user in database
    let user = await User.findOne({ azureId: account.homeAccountId });

    if (!user) {
      // Create new user
      user = new User({
        azureId: account.homeAccountId,
        email: userProfile.mail || userProfile.userPrincipalName,
        name: userProfile.displayName,
        profilePicture: userProfile.photo ? userProfile.photo['@odata.mediaContentType'] : null,
        department: userProfile.department,
        role: 'commercial', // Default role
        lastLogin: new Date()
      });
    } else {
      // Update existing user
      user.name = userProfile.displayName;
      user.email = userProfile.mail || userProfile.userPrincipalName;
      user.lastLogin = new Date();
      if (userProfile.department) user.department = userProfile.department;
    }

    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture
      },
      accessToken: accessToken // Store for Microsoft Graph API calls
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-azureId');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

// Helper function to get user profile from Microsoft Graph
async function getUserProfile(accessToken) {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile from Graph API:', error);
    throw error;
  }
}

module.exports = router;
