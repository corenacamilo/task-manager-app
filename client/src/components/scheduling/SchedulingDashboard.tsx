import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../../services/api';
import { User, Task } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Download, Filter, ArrowLeft, Clock, MapPin, User as UserIcon } from 'lucide-react';

interface SchedulingDashboardProps {
  user: User;
}

const SchedulingDashboard: React.FC<SchedulingDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });
  const [filter, setFilter] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filter, pagination.currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filter.status, filter.startDate, filter.endDate]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filter
      });
      setTasks(response.data.tasks);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0
      }));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleExportToExcel = async () => {
    try {
      const response = await tasksAPI.exportToExcel(filter);
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agendamientos-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error al exportar a Excel. Por favor, inténtalo de nuevo.');
    }
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


  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <div className="flex justify-between items-center bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Agendamientos
              </h1>
              <p className="text-gray-600 mt-1">
                {user.role === 'admin' 
                  ? 'Todos los agendamientos del sistema' 
                  : 'Tus agendamientos programados'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select 
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                <input 
                  type="date"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filter.startDate}
                  onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                <input 
                  type="date"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span>Lista de Agendamientos</span>
                </CardTitle>
                <CardDescription>
                  {tasks.length} agendamiento{tasks.length !== 1 ? 's' : ''} encontrado{tasks.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                onClick={handleExportToExcel}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay agendamientos</h3>
                <p className="text-gray-500">No se encontraron agendamientos con los filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Motivo Visita</th>
                      {user.role === 'admin' && (
                        <th className="text-left p-3 font-semibold">Asignado a</th>
                      )}
                      <th className="text-left p-3 font-semibold">Fecha</th>
                      <th className="text-left p-3 font-semibold">Hora</th>
                      <th className="text-left p-3 font-semibold">Duración</th>
                      <th className="text-left p-3 font-semibold">Estado</th>
                      <th className="text-left p-3 font-semibold">Cliente</th>
                      <th className="text-left p-3 font-semibold">Personal Contacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>
                        {user.role === 'admin' && (
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{task.assignedTo.name}</span>
                            </div>
                          </td>
                        )}
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {formatDate(task.scheduledDate)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{task.scheduledTime}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-600">{task.duration} min</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' && 'Pendiente'}
                            {task.status === 'scheduled' && 'Agendada'}
                            {task.status === 'completed' && 'Completada'}
                            {task.status === 'cancelled' && 'Cancelada'}
                          </span>
                        </td>
                        <td className="p-3">
                          {task.clientName ? (
                            <div className="text-sm">
                              <div className="font-medium">{task.clientName}</div>
                              {task.clientEmail && (
                                <div className="text-gray-500">{task.clientEmail}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin cliente</span>
                          )}
                        </td>
                        <td className="p-3">
                          {task.personalContacto ? (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{task.personalContacto}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin personal contacto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 mt-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} a{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} de{' '}
                        {pagination.total} resultados
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchedulingDashboard;
