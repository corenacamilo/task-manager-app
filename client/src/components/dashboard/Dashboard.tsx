import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../../services/api';
import { User, Task, TaskStats } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import EditTaskModal from '../tasks/EditTaskModal';
import { Calendar, CheckCircle, Clock, Download, Filter, Plus, LogOut, AlertCircle, Users, Edit2, Trash2, Menu, X } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [filter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, statsResponse] = await Promise.all([
        tasksAPI.getTasks({ 
          limit: 10,
          ...filter 
        }),
        tasksAPI.getTaskStats()
      ]);

      setTasks(tasksResponse.data.tasks);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const response = await tasksAPI.exportToExcel(filter);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tareas-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error al exportar a Excel. Por favor, inténtalo de nuevo.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }

    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task._id !== taskId));
      alert('Tarea eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    ));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Agendada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      case 'urgent': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Bienvenido, {user.name}
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-3">
              <Button
                onClick={() => navigate('/scheduling')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendamientos
              </Button>
              {user.role === 'admin' && (
                <Button
                  onClick={() => navigate('/users')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Usuarios
                </Button>
              )}
              <Button
                onClick={handleCreateTask}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => {
                    navigate('/scheduling');
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="justify-start text-blue-600 hover:bg-blue-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendamientos
                </Button>
                {user.role === 'admin' && (
                  <Button
                    onClick={() => {
                      navigate('/users');
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="justify-start text-purple-600 hover:bg-purple-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Usuarios
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleCreateTask();
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="justify-start text-green-600 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="justify-start text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-blue-700">Total Tareas</CardTitle>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">{stats.totalTasks}</div>
                <p className="text-xs text-blue-600 mt-1">Total en el sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-yellow-700">Pendientes</CardTitle>
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-800">{stats.pendingTasks}</div>
                <p className="text-xs text-yellow-600 mt-1">Por agendar</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-green-700">Completadas</CardTitle>
                <div className="p-2 bg-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">{stats.completedTasks}</div>
                <p className="text-xs text-green-600 mt-1">Finalizadas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-purple-700">Hoy</CardTitle>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">{stats.todaysTasks}</div>
                <p className="text-xs text-purple-600 mt-1">Para hoy</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Estado</label>
                <select 
                  className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filter.status}
                  onChange={(e) => setFilter({...filter, status: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="scheduled">Agendada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Prioridad</label>
                <select 
                  className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filter.priority}
                  onChange={(e) => setFilter({...filter, priority: e.target.value})}
                >
                  <option value="">Todas</option>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Fecha Inicio</label>
                <input 
                  type="date"
                  className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filter.startDate}
                  onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Fecha Fin</label>
                <input 
                  type="date"
                  className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filter.endDate}
                  onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Tareas Recientes</CardTitle>
                <CardDescription className="text-sm">
                  {user.role === 'admin' ? 'Todas las tareas del sistema' : 'Tus tareas asignadas'}
                </CardDescription>
              </div>
              <Button
                onClick={handleExportToExcel}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">Exportar Excel</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile Task Cards */}
            <div className="block md:hidden space-y-4">
              {tasks.map((task) => (
                <Card key={task._id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTask(task)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task._id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Estado:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Prioridad:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Programación:</span>
                        <div className="mt-1 text-xs">
                          {task.scheduledDate ? (
                            <>
                              <div className="font-medium">
                                {formatDate(task.scheduledDate)}
                              </div>
                              <div className="text-gray-500">
                                {task.duration} min
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">Sin programar</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <div className="mt-1 text-xs text-gray-600">
                          {task.clientName || 'Sin cliente'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No hay tareas para mostrar</p>
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 lg:p-4 font-semibold">Tarea</th>
                    <th className="text-left p-3 lg:p-4 font-semibold">Programación</th>
                    <th className="text-left p-3 lg:p-4 font-semibold">Estado</th>
                    <th className="text-left p-3 lg:p-4 font-semibold">Prioridad</th>
                    <th className="text-left p-3 lg:p-4 font-semibold">Cliente</th>
                    <th className="text-left p-3 lg:p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 lg:p-4">
                        <div>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</div>
                        </div>
                      </td>
                      <td className="p-3 lg:p-4">
                        <div className="text-sm">
                          {task.scheduledDate ? (
                            <>
                              <div className="font-medium">
                                {formatDate(task.scheduledDate)}
                              </div>
                              <div className="text-gray-500">
                                {task.duration} min
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">Sin programar</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 lg:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td className="p-3 lg:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                      </td>
                      <td className="p-3 lg:p-4 text-sm text-gray-600">
                        {task.clientName || 'Sin cliente'}
                      </td>
                      <td className="p-3 lg:p-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTask(task)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Editar tarea"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task._id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {tasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas</h3>
                  <p>No se encontraron tareas que coincidan con los filtros.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          user={user}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

export default Dashboard;
