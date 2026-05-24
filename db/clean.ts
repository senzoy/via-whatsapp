import { resetMessagesAndPoints } from "./mongodb.js";

resetMessagesAndPoints()
    .then(() => console.log('✅ Limpieza completada'))
    .catch((error) => console.error('❌ Error en la limpieza:', error))