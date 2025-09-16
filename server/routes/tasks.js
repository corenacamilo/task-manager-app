const express = require('express');
const axios = require('axios');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const { msalInstance } = require('../config/azureConfig');

const router = express.Router();

// Helper function to get access token for system operations
async function getSystemAccessToken() {
  try {
    const clientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };
    
    const response = await msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
    return response.accessToken;
  } catch (error) {
    console.error('Error getting system access token:', error);
    
    // Fallback: try to get token from user session if available
    try {
      const userToken = await msalInstance.acquireTokenSilent({
        scopes: ['https://graph.microsoft.com/Calendars.ReadWrite'],
        account: null
      });
      return userToken.accessToken;
    } catch (fallbackError) {
      console.error('Fallback token acquisition failed:', fallbackError);
      return null;
    }
  }
}

// Helper function to create Outlook calendar event
async function createOutlookEvent(task, userAccessToken = null) {
  if (!userAccessToken) {
    console.log('No user access token provided, skipping Outlook integration');
    return null;
  }

  // Format dates properly for Microsoft Graph
  const startDateTime = new Date(`${task.scheduledDate.toISOString().split('T')[0]}T${task.scheduledTime}:00.000Z`);
  const endDateTime = new Date(startDateTime.getTime() + (task.duration * 60000));

  const eventData = {
    subject: task.title,
    body: {
      contentType: 'Text',
      content: task.description || 'Sin descripción'
    },
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC'
    }
  };

  // Add optional fields only if they exist
  if (task.location) {
    eventData.location = { displayName: task.location };
  }

  if (task.clientEmail && task.clientName) {
    eventData.attendees = [{
      emailAddress: {
        address: task.clientEmail,
        name: task.clientName
      }
    }];
  }

  try {
    console.log('Creating Outlook event with data:', JSON.stringify(eventData, null, 2));
    
    // Create event in the authenticated user's calendar
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      eventData,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update task with Outlook event information
    task.outlookEventId = response.data.id;
    task.outlookMeetingUrl = response.data.webLink;
    task.status = 'scheduled';
    await task.save();

    console.log(`Outlook event created successfully: ${task.title}`);
    return response.data;
  } catch (error) {
    console.error('Detailed error creating Outlook event:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Headers:', error.response?.headers);
    
    // Don't throw error to avoid breaking task creation
    return null;
  }
}

// Helper function to calculate end date time
function getEndDateTime(scheduledDate, scheduledTime, duration) {
  const startDateTime = new Date(`${scheduledDate.toISOString().split('T')[0]}T${scheduledTime}:00`);
  const endDateTime = new Date(startDateTime.getTime() + (duration * 60000));
  return endDateTime.toISOString();
}

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      scheduledDate,
      scheduledTime,
      duration = 60,
      assignedTo,
      priority = 'medium',
      category = 'general',
      location,
      clientName,
      clientEmail,
      clientPhone,
      accessToken
    } = req.body;

    // Validate required fields
    if (!title || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ message: 'Title, scheduled date, and time are required' });
    }

    // For commercial users, they can only assign tasks to themselves
    // For admin users, they can assign tasks to any commercial user
    let finalAssignedTo = assignedTo;
    
    if (req.user.role === 'commercial') {
      finalAssignedTo = req.user._id;
    } else if (req.user.role === 'admin' && assignedTo) {
      // Verify the assigned user exists and is commercial
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser || assignedUser.role !== 'commercial') {
        return res.status(400).json({ message: 'Invalid assigned user' });
      }
    } else {
      finalAssignedTo = req.user._id;
    }

    const task = new Task({
      title,
      description,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration,
      assignedTo: finalAssignedTo,
      createdBy: req.user._id,
      priority,
      category,
      location,
      clientName,
      clientEmail,
      clientPhone
    });

    await task.save();

    // Populate user information
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Automatically create Outlook calendar event when task is created
    if (accessToken) {
      try {
        await createOutlookEvent(task, accessToken);
        console.log(`Task created and Outlook event scheduled successfully for: ${task.title}`);
      } catch (error) {
        console.error('Error creating Outlook event:', error);
        // Don't fail task creation if Outlook integration fails
      }
    } else {
      console.log('No access token provided, task created without Outlook integration');
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Schedule task in Outlook
router.post('/:id/schedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token required for Outlook integration' });
    }

    const task = await Task.findById(id).populate('assignedTo', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create Outlook calendar event
    const eventData = {
      subject: task.title,
      body: {
        contentType: 'HTML',
        content: `
          <h3>Task Details</h3>
          <p><strong>Description:</strong> ${task.description || 'No description'}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Category:</strong> ${task.category}</p>
          ${task.location ? `<p><strong>Location:</strong> ${task.location}</p>` : ''}
          ${task.clientName ? `
            <h4>Client Information</h4>
            <p><strong>Name:</strong> ${task.clientName}</p>
            ${task.clientEmail ? `<p><strong>Email:</strong> ${task.clientEmail}</p>` : ''}
            ${task.clientPhone ? `<p><strong>Phone:</strong> ${task.clientPhone}</p>` : ''}
          ` : ''}
        `
      },
      start: {
        dateTime: `${task.scheduledDate.toISOString().split('T')[0]}T${task.scheduledTime}:00`,
        timeZone: 'UTC'
      },
      end: {
        dateTime: getEndDateTime(task.scheduledDate, task.scheduledTime, task.duration),
        timeZone: 'UTC'
      },
      location: task.location ? { displayName: task.location } : undefined,
      attendees: task.clientEmail ? [{
        emailAddress: {
          address: task.clientEmail,
          name: task.clientName
        }
      }] : []
    };

    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      eventData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update task with Outlook event ID
    task.outlookEventId = response.data.id;
    task.outlookMeetingUrl = response.data.webLink;
    task.status = 'scheduled';
    await task.save();

    res.json({ 
      message: 'Task scheduled in Outlook successfully', 
      task,
      outlookEvent: response.data 
    });

  } catch (error) {
    console.error('Error scheduling task in Outlook:', error);
    if (error.response) {
      console.error('Outlook API Error:', error.response.data);
    }
    res.status(500).json({ message: 'Error scheduling task in Outlook' });
  }
});

// Get tasks (with filtering and pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      startDate,
      endDate,
      search
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.user.role === 'commercial') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        task.assignedTo._id.toString() !== req.user._id.toString() &&
        task.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Update task
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        task.assignedTo.toString() !== req.user._id.toString() &&
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update task
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        task[key] = updates[key];
      }
    });

    if (updates.status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions (only creator or admin can delete)
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Task.findByIdAndDelete(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Export tasks to Excel
router.get('/export/excel', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, assignedTo, status } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.role === 'commercial') {
      query.assignedTo = req.user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Apply filters
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Scheduled Date', key: 'scheduledDate', width: 15 },
      { header: 'Scheduled Time', key: 'scheduledTime', width: 15 },
      { header: 'Duration (min)', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Client Name', key: 'clientName', width: 20 },
      { header: 'Client Email', key: 'clientEmail', width: 25 },
      { header: 'Client Phone', key: 'clientPhone', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 }
    ];

    // Add data
    tasks.forEach(task => {
      worksheet.addRow({
        id: task._id.toString(),
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo.name,
        createdBy: task.createdBy.name,
        scheduledDate: task.scheduledDate.toISOString().split('T')[0],
        scheduledTime: task.scheduledTime,
        duration: task.duration,
        status: task.status,
        priority: task.priority,
        category: task.category,
        location: task.location || '',
        clientName: task.clientName || '',
        clientEmail: task.clientEmail || '',
        clientPhone: task.clientPhone || '',
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt ? task.completedAt.toISOString() : ''
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tasks-export-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ message: 'Error exporting tasks' });
  }
});

// Get task statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'commercial') {
      query.assignedTo = req.user._id;
    }

    const totalTasks = await Task.countDocuments(query);
    const pendingTasks = await Task.countDocuments({ ...query, status: 'pending' });
    const scheduledTasks = await Task.countDocuments({ ...query, status: 'scheduled' });
    const completedTasks = await Task.countDocuments({ ...query, status: 'completed' });
    const cancelledTasks = await Task.countDocuments({ ...query, status: 'cancelled' });

    // Tasks by priority
    const highPriorityTasks = await Task.countDocuments({ ...query, priority: 'high' });
    const urgentTasks = await Task.countDocuments({ ...query, priority: 'urgent' });

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTasks = await Task.countDocuments({
      ...query,
      scheduledDate: { $gte: today, $lt: tomorrow }
    });

    res.json({
      totalTasks,
      pendingTasks,
      scheduledTasks,
      completedTasks,
      cancelledTasks,
      highPriorityTasks,
      urgentTasks,
      todaysTasks
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ message: 'Error fetching task statistics' });
  }
});

// Helper function to calculate end date time
function getEndDateTime(scheduledDate, scheduledTime, duration) {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const startDateTime = new Date(scheduledDate);
  startDateTime.setHours(hours, minutes, 0, 0);
  
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
  return endDateTime.toISOString();
}

module.exports = router;
