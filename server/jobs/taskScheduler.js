const cron = require('node-cron');
const Task = require('../models/Task');

// Function to check and complete expired tasks
async function checkExpiredTasks() {
  try {
    const now = new Date();
    
    // Find tasks that are scheduled and have passed their end time
    const expiredTasks = await Task.find({
      status: { $in: ['pending', 'scheduled'] },
      scheduledDate: { $lte: now }
    });

    for (const task of expiredTasks) {
      // Calculate the end time of the task
      const taskDateTime = new Date(`${task.scheduledDate.toISOString().split('T')[0]}T${task.scheduledTime}:00`);
      const taskEndTime = new Date(taskDateTime.getTime() + (task.duration * 60000));
      
      // If current time is past the task end time, mark as completed
      if (now >= taskEndTime) {
        task.status = 'completed';
        task.completedAt = now;
        await task.save();
        
        console.log(`Task "${task.title}" automatically marked as completed at ${now}`);
      }
    }
  } catch (error) {
    console.error('Error checking expired tasks:', error);
  }
}

// Schedule the job to run every 5 minutes
const scheduleTaskCompletion = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Checking for expired tasks...');
    checkExpiredTasks();
  });

  // Also run immediately on startup
  checkExpiredTasks();
  
  console.log('Task scheduler initialized - checking for expired tasks every 5 minutes');
};

module.exports = {
  scheduleTaskCompletion,
  checkExpiredTasks
};
