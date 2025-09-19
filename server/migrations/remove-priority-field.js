const mongoose = require('mongoose');
require('dotenv').config();

async function removePriorityField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔄 Iniciando migración: Eliminando campo priority de todas las tareas...');
    
    // Remove the priority field from all task documents
    const result = await mongoose.connection.db.collection('tasks').updateMany(
      {}, // Match all documents
      { $unset: { priority: "" } } // Remove the priority field
    );
    
    console.log(`✅ Migración completada exitosamente!`);
    console.log(`📊 Documentos modificados: ${result.modifiedCount}`);
    console.log(`📊 Documentos encontrados: ${result.matchedCount}`);
    
    // Verify the migration
    const sampleTask = await mongoose.connection.db.collection('tasks').findOne({});
    if (sampleTask) {
      console.log('🔍 Verificación - Campos en una tarea de muestra:');
      console.log(Object.keys(sampleTask));
      
      if (sampleTask.priority !== undefined) {
        console.log('⚠️  ADVERTENCIA: El campo priority aún existe en algunos documentos');
      } else {
        console.log('✅ Verificación exitosa: El campo priority ha sido eliminado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Run the migration
removePriorityField();
