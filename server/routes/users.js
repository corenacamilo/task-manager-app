const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const query = {
      $and: [
        search ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        } : {},
        role ? { role } : {}
      ]
    };

    const users = await User.find(query)
      .select('-azureId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Transform _id to id for frontend compatibility
    const transformedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id.toString()
    }));

    res.json({
      users: transformedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(id).select('-azureId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['commercial', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-azureId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json({ message: 'User role updated successfully', user: transformedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Toggle user active status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-azureId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, 
      user: transformedUser 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
});

// Update user profile
router.patch('/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department } = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-azureId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      ...user.toObject(),
      id: user._id.toString()
    };

    res.json({ message: 'Profile updated successfully', user: transformedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const commercialUsers = await User.countDocuments({ role: 'commercial' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      commercialUsers,
      adminUsers
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

module.exports = router;
