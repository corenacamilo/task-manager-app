# 📋 Task Manager App

Una aplicación moderna de gestión de tareas construida con MERN stack, autenticación Azure Entra ID e integración con Outlook Calendar.

## 🚀 Características

- ✅ **Autenticación Azure Entra ID** - Login seguro con Microsoft
- 📅 **Integración Outlook Calendar** - Creación automática de eventos
- 👥 **Gestión de Roles** - Administradores y Comerciales
- 📊 **Dashboard Interactivo** - Estadísticas y métricas en tiempo real
- 📱 **Diseño Responsive** - Optimizado para móvil y desktop
- 📈 **Exportación Excel** - Reportes de tareas
- 🔄 **Automatización** - Completado automático de tareas vencidas
- 🎨 **UI Moderna** - Tailwind CSS y shadcn/ui
- **Gestión de Tareas**: Creación, asignación y seguimiento de tareas
- **Integración Outlook**: Agendado automático de tareas en el calendario
- **Dashboard Interactivo**: Visualización de estadísticas y tareas
- **Exportación Excel**: Reportes descargables para análisis
- **Diseño Responsive**: Optimizado para dispositivos móviles

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** con Express.js
- **MongoDB** con Mongoose
- **Azure MSAL Node** para autenticación
- **Microsoft Graph API** para integración con Outlook
- **ExcelJS** para exportación de reportes
- **JWT** para manejo de sesiones

### Frontend
- **React** con TypeScript
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Azure MSAL React** para autenticación
- **Axios** para peticiones HTTP
- **React Router** para navegación

## 📋 Requisitos Previos

1. **Node.js** (v16 o superior)
2. **MongoDB** (local o Atlas)
3. **Cuenta Azure** con permisos para crear aplicaciones
4. **Git** para control de versiones

## 🔧 Configuración del Proyecto

### 1. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd task-manager-app

# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del servidor
npm run install-server

# Instalar dependencias del cliente
npm run install-client
```

### 2. Configuración Azure Entra ID

1. **Crear una aplicación en Azure Portal**:
   - Ve a Azure Portal > Azure Active Directory > App registrations
   - Clic en "New registration"
   - Nombre: "Task Manager App"
   - Redirect URI: `http://localhost:3000/auth/callback`

2. **Configurar permisos**:
   - API permissions > Add permission > Microsoft Graph
   - Agregar permisos delegados:
     - `User.Read`
     - `Calendars.ReadWrite`
     - `Mail.Send`

3. **Crear client secret**:
   - Certificates & secrets > New client secret
   - Copiar el valor generado

### 3. Variables de Entorno

#### Servidor (.env)
```bash
# Copiar archivo de ejemplo
cp server/.env.example server/.env
```

Configurar las siguientes variables:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/taskmanager

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Azure Entra ID Configuration
AZURE_CLIENT_ID=tu_azure_client_id
AZURE_CLIENT_SECRET=tu_azure_client_secret
AZURE_TENANT_ID=tu_azure_tenant_id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Microsoft Graph API
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0
```

#### Cliente (.env)
```bash
# Copiar archivo de ejemplo
cp client/.env.example client/.env
```

Configurar las siguientes variables:
```env
# Azure Entra ID Configuration
REACT_APP_AZURE_CLIENT_ID=tu_azure_client_id
REACT_APP_AZURE_TENANT_ID=tu_azure_tenant_id
REACT_APP_REDIRECT_URI=http://localhost:3000/auth/callback

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Iniciar la Aplicación

```bash
# Desarrollo (ejecuta cliente y servidor simultáneamente)
npm run dev

# O ejecutar por separado:

# Terminal 1 - Servidor
npm run server

# Terminal 2 - Cliente
npm run client
```

La aplicación estará disponible en:
- **Cliente**: http://localhost:3000
- **Servidor**: http://localhost:5000

## 👥 Tipos de Usuario

### Comerciales
- Crear tareas personales
- Agendar tareas en su calendario de Outlook
- Ver dashboard con sus tareas
- Exportar sus tareas a Excel

### Administradores
- Todas las funciones de comerciales
- Crear tareas para otros usuarios
- Gestionar usuarios (activar/desactivar, cambiar roles)
- Ver dashboard global de todas las tareas
- Exportar todas las tareas del sistema

## 📱 Funcionalidades Principales

### Autenticación
- Inicio de sesión con Azure Entra ID
- Creación automática de usuarios en base de datos
- Manejo de sesiones con JWT
- Logout seguro

### Gestión de Tareas
- **Crear tareas** con información detallada:
  - Título y descripción
  - Fecha y hora de agendado
  - Duración estimada
  - Prioridad (baja, media, alta, urgente)
  - Información del cliente
  - Ubicación

- **Agendar en Outlook**:
  - Creación automática de eventos en calendario
  - Invitación automática a clientes
  - Sincronización bidireccional

- **Estados de tareas**:
  - Pendiente
  - Agendada
  - Completada
  - Cancelada

### Dashboard
- **Estadísticas en tiempo real**:
  - Total de tareas
  - Tareas pendientes/completadas
  - Tareas del día
  - Tareas por prioridad

- **Filtros avanzados**:
  - Por estado
  - Por prioridad
  - Por rango de fechas
  - Búsqueda por texto

- **Tabla interactiva**:
  - Visualización de tareas
  - Ordenamiento
  - Paginación

### Exportación
- **Reportes Excel**:
  - Exportación con filtros aplicados
  - Formato profesional
  - Datos completos de tareas

## 🔒 Seguridad

- **Autenticación Azure**: Integración con Azure Entra ID
- **Autorización por roles**: Control de acceso basado en roles
- **JWT Tokens**: Manejo seguro de sesiones
- **Validación de datos**: Validación en frontend y backend
- **CORS configurado**: Protección contra peticiones no autorizadas

## 📊 Base de Datos

### Modelo de Usuario
```javascript
{
  azureId: String,        // ID único de Azure
  email: String,          // Email del usuario
  name: String,           // Nombre completo
  role: String,           // 'commercial' | 'admin'
  isActive: Boolean,      // Estado del usuario
  profilePicture: String, // URL de foto de perfil
  department: String,     // Departamento
  createdAt: Date,        // Fecha de creación
  updatedAt: Date,        // Última actualización
  lastLogin: Date         // Último inicio de sesión
}
```

### Modelo de Tarea
```javascript
{
  title: String,           // Título de la tarea
  description: String,     // Descripción detallada
  scheduledDate: Date,     // Fecha agendada
  scheduledTime: String,   // Hora agendada
  duration: Number,        // Duración en minutos
  assignedTo: ObjectId,    // Usuario asignado
  createdBy: ObjectId,     // Usuario creador
  status: String,          // Estado de la tarea
  priority: String,        // Prioridad
  category: String,        // Categoría
  location: String,        // Ubicación
  clientName: String,      // Nombre del cliente
  clientEmail: String,     // Email del cliente
  clientPhone: String,     // Teléfono del cliente
  outlookEventId: String,  // ID del evento en Outlook
  outlookMeetingUrl: String, // URL de la reunión
  createdAt: Date,         // Fecha de creación
  updatedAt: Date,         // Última actualización
  completedAt: Date        // Fecha de completado
}
```

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
# Construir cliente
npm run build

# Iniciar servidor en producción
npm start
```

### Variables de Entorno para Producción
- Actualizar URLs de redirect en Azure
- Configurar MongoDB Atlas
- Usar HTTPS para todas las URLs
- Configurar variables de entorno seguras

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte técnico o preguntas:
1. Revisar la documentación
2. Verificar issues existentes
3. Crear nuevo issue con detalles del problema

## 🔄 Actualizaciones Futuras

- [ ] Notificaciones push
- [ ] Integración con Teams
- [ ] Reportes avanzados
- [ ] API móvil nativa
- [ ] Sincronización offline
