import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../services/api';
import { User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, ArrowLeft, Shield, UserCheck, UserX, Edit } from 'lucide-react';

interface UserManagementProps {
  user: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [user.role, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'commercial') => {
    try {
      setUpdatingUser(userId);
      await usersAPI.updateUserRole(userId, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      alert(`Rol actualizado exitosamente a ${newRole === 'admin' ? 'Administrador' : 'Comercial'}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error al actualizar el rol del usuario');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUser(userId);
      const newStatus = !currentStatus;
      await usersAPI.updateUserStatus(userId, { isActive: newStatus });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: newStatus } : u
      ));
      
      alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error al actualizar el estado del usuario');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
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
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-1">
                Administrar roles y permisos de usuarios
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <span>Lista de Usuarios</span>
            </CardTitle>
            <CardDescription>
              Gestiona los roles y permisos de todos los usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
                <p className="text-gray-500">No se encontraron usuarios en el sistema.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-semibold">Usuario</th>
                      <th className="text-left p-4 font-semibold">Email</th>
                      <th className="text-left p-4 font-semibold">Rol Actual</th>
                      <th className="text-left p-4 font-semibold">Estado</th>
                      <th className="text-left p-4 font-semibold">Último Acceso</th>
                      <th className="text-left p-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {u.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{u.name}</div>
                              <div className="text-xs text-gray-500">
                                Registrado: {formatDate(u.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-700">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                            {u.role === 'admin' ? 'Administrador' : 'Comercial'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(u.isActive)}`}>
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-600">
                            {u.lastLogin ? formatDate(u.lastLogin) : 'Nunca'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {/* Role Change Buttons */}
                            {u.role === 'commercial' ? (
                              <Button
                                size="sm"
                                onClick={() => handleRoleChange(u.id, 'admin')}
                                disabled={updatingUser === u.id}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Hacer Admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleChange(u.id, 'commercial')}
                                disabled={updatingUser === u.id}
                                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Hacer Comercial
                              </Button>
                            )}

                            {/* Status Toggle Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusToggle(u.id, u.isActive)}
                              disabled={updatingUser === u.id}
                              className={u.isActive 
                                ? "border-red-200 text-red-600 hover:bg-red-50" 
                                : "border-green-200 text-green-600 hover:bg-green-50"
                              }
                            >
                              {u.isActive ? (
                                <>
                                  <UserX className="w-3 h-3 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Información sobre Roles</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Administrador:</strong> Puede ver todas las tareas, gestionar usuarios y asignar tareas a cualquier comercial.</p>
                  <p><strong>Comercial:</strong> Solo puede ver y gestionar sus propias tareas asignadas.</p>
                  <p><strong>Estado Inactivo:</strong> El usuario no podrá iniciar sesión en el sistema.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
