# WhatsApp Bot VIA 🤖

Bot de WhatsApp con API REST para gestión de grupos y comandos administrativos.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# O con pnpm
pnpm install
```

## 📱 Uso

### Iniciar el bot
```bash
npm start
```

### Desarrollo (con recarga automática)
```bash
npm run dev
```

### Limpiar credenciales (reiniciar sesión)
```bash
npm run clean
```

## 📋 Comandos Disponibles

| Comando | Descripción | Permisos |
|---------|-------------|----------|
| `!ping` | Responde "Pong!" | Todos |
| `!hola` | Saludo del bot | Todos |
| `!lock` | Bloquear grupo (solo admins) | Admins |
| `!unlock` | Desbloquear grupo (todos pueden escribir) | Admins |
| `!help` | Mostrar ayuda | Todos |

## 🌐 API REST

### Endpoints

#### GET `/`
Información general de la API

#### GET `/qr`
QR de conexión en HTML (se actualiza automáticamente)

#### GET `/status`
Estado del bot
```json
{
  "connected": true,
  "user": {...},
  "qrPending": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/message`
Enviar mensaje
```bash
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{
    "jid": "1234567890@s.whatsapp.net",
    "text": "Hola desde la API!"
  }'
```

#### POST `/command`
Ejecutar comando
```bash
curl -X POST http://localhost:3000/command \
  -H "Content-Type: application/json" \
  -d '{
    "jid": "120363406844378206@g.us",
    "command": "lock"
  }'
```

## 🏗️ Arquitectura

```
VIA/
├── 📁 bot/
│   ├── app.ts          # Clase WhatsAppBot
│   ├── handlers.ts     # Eventos y comandos
│   ├── types.ts        # Interfaces TypeScript
│   └── index.ts        # Exportaciones
├── 📁 auth_info_baileys/  # Credenciales WhatsApp
├── 📄 index.ts         # Servidor Express + API
├── 📄 package.json     # Dependencias
└── 📄 README.md        # Esta documentación
```

## 🔧 Configuración

### Variables de entorno
```bash
PORT=3000  # Puerto del servidor (opcional)
```

### Configuración del bot
```typescript
const bot = new WhatsAppBot({
  authPath: 'auth_info_baileys',  // Directorio de credenciales
  logLevel: 'silent',             // Nivel de logging
  connectTimeoutMs: 60000,        // Timeout de conexión
})
```

## 📱 Primer Uso

1. **Ejecutar el bot:**
   ```bash
   npm start
   ```

2. **Escanear QR:**
   - Abre WhatsApp en tu teléfono
   - Ve a **Ajustes → Dispositivos vinculados**
   - Toca **"Vincular dispositivo"**
   - Escanea el QR que aparece en la terminal

3. **Usar comandos:**
   - Envía `!help` en el grupo para ver comandos disponibles

## 🔒 Seguridad

- Solo administradores pueden usar comandos de gestión de grupo
- Las credenciales se almacenan localmente en `auth_info_baileys/`
- El bot verifica permisos antes de ejecutar comandos

## 🐛 Solución de Problemas

### Error "Connection Failure"
```bash
# Limpiar credenciales y reiniciar
npm run clean
npm start
```

### Puerto ocupado
```bash
# Cambiar puerto
PORT=3001 npm start
```

### Dependencias faltantes
```bash
npm install
```

## 📝 Desarrollo

### Agregar nuevos comandos
1. Editar `bot/handlers.ts`
2. Agregar caso en el switch de `bot.onMessage()`

### Agregar nuevas rutas API
1. Editar `index.ts`
2. Agregar rutas Express antes del middleware 404

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para soporte técnico, contacta al desarrollador.</content>
<parameter name="filePath">f:\testing\craft-world-wiki\VIA\README.md