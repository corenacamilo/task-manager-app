const mongoose = require('mongoose');
require('dotenv').config();

async function renameLocationField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('🔄 Iniciando migración: Renombrando campo "location" a "personalContacto"...');
    
    // Rename the location field to personalContacto in all task documents
    const result = await mongoose.connection.db.collection('tasks').updateMany(
      { location: { $exists: true } }, // Only update documents that have the location field
      { $rename: { location: "personalContacto" } } // Rename location to personalContacto
    );
    
    console.log(`✅ Migración completada exitosamente!`);
    console.log(`📊 Documentos modificados: ${result.modifiedCount}`);
    console.log(`📊 Documentos encontrados: ${result.matchedCount}`);
    
    // Verify the migration
    const sampleTask = await mongoose.connection.db.collection('tasks').findOne({});
    if (sampleTask) {
      console.log('🔍 Verificación - Campos en una tarea de muestra:');
      console.log(Object.keys(sampleTask));
      
      if (sampleTask.location !== undefined) {
        console.log('⚠️  ADVERTENCIA: El campo "location" aún existe en algunos documentos');
      } else if (sampleTask.personalContacto !== undefined) {
        console.log('✅ Verificación exitosa: El campo se renombró a "personalContacto"');
      } else {
        console.log('ℹ️  El campo no existía en este documento de muestra');
      }
    }
    
    // Count documents with the new field
    const docsWithPersonalContacto = await mongoose.connection.db.collection('tasks').countDocuments({
      personalContacto: { $exists: true }
    });
    
    console.log(`📊 Documentos con campo "personalContacto": ${docsWithPersonalContacto}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Run the migration
renameLocationField();
