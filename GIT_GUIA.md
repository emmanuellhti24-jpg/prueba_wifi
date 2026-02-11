# 📤 Guía para Subir a GitHub

## ✅ Estado Actual

El repositorio Git local está listo con:
- ✅ 2 commits realizados
- ✅ .gitignore configurado
- ✅ README.md creado
- ✅ 46 archivos versionados

## 🚀 Pasos para Subir a GitHub

### Opción 1: Crear Repositorio Nuevo en GitHub

#### 1. Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repositorio: `momoys-burger` (o el que prefieras)
3. Descripción: "Sistema de pedidos para restaurante con menú digital"
4. **NO marques** "Initialize with README" (ya lo tienes)
5. Click en "Create repository"

#### 2. Conectar tu repositorio local
```bash
cd /home/emmanuel/prueba_wifi

# Agregar remote (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/momoys-burger.git

# Verificar que se agregó
git remote -v

# Subir código
git push -u origin master
```

#### 3. Ingresar credenciales
GitHub te pedirá autenticación:
- **Usuario**: Tu usuario de GitHub
- **Contraseña**: Usa un Personal Access Token (no tu contraseña)

**Crear Token**:
1. Ve a https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Nombre: "Momoys Burger Deploy"
4. Permisos: Marca "repo"
5. Click "Generate token"
6. **Copia el token** (solo se muestra una vez)
7. Úsalo como contraseña al hacer push

---

### Opción 2: Usar SSH (Recomendado)

#### 1. Generar clave SSH (si no tienes)
```bash
ssh-keygen -t ed25519 -C "tu_email@ejemplo.com"
# Presiona Enter 3 veces (usa valores por defecto)
```

#### 2. Copiar clave pública
```bash
cat ~/.ssh/id_ed25519.pub
# Copia todo el contenido
```

#### 3. Agregar a GitHub
1. Ve a https://github.com/settings/keys
2. Click "New SSH key"
3. Título: "Mi PC Local"
4. Pega la clave pública
5. Click "Add SSH key"

#### 4. Conectar repositorio
```bash
cd /home/emmanuel/prueba_wifi

# Agregar remote con SSH
git remote add origin git@github.com:TU_USUARIO/momoys-burger.git

# Subir código
git push -u origin master
```

---

## 📋 Comandos Útiles

### Ver estado del repositorio
```bash
git status
```

### Ver commits
```bash
git log --oneline
```

### Ver remotes configurados
```bash
git remote -v
```

### Hacer cambios futuros
```bash
# 1. Hacer cambios en archivos
# 2. Agregar cambios
git add .

# 3. Commit
git commit -m "Descripción del cambio"

# 4. Subir a GitHub
git push
```

---

## 🔒 Archivos Excluidos (No se suben)

El `.gitignore` excluye:
- ✅ `node_modules/` (dependencias)
- ✅ `.env` (variables de entorno)
- ✅ `public/uploads/*` (imágenes subidas)
- ✅ `src/` (carpeta experimental)
- ✅ Logs y archivos temporales

**Esto es correcto** - no quieres subir estos archivos.

---

## ⚠️ Importante Antes de Subir

### 1. Verificar que no hay datos sensibles
```bash
# Buscar posibles secretos
grep -r "password" --include="*.js" --exclude-dir=node_modules .
grep -r "secret" --include="*.js" --exclude-dir=node_modules .
```

### 2. Verificar .env no está incluido
```bash
git status | grep .env
# No debe aparecer nada
```

### 3. Verificar archivos a subir
```bash
git ls-files | head -20
```

---

## 🎯 Después de Subir

### 1. Verificar en GitHub
- Ve a tu repositorio en GitHub
- Verifica que todos los archivos estén
- Lee el README.md

### 2. Clonar en otra máquina (opcional)
```bash
git clone https://github.com/TU_USUARIO/momoys-burger.git
cd momoys-burger
npm install
cp .env.example .env
node scripts/create_admin.js
node server.js
```

### 3. Compartir
Comparte el link: `https://github.com/TU_USUARIO/momoys-burger`

---

## 🐛 Solución de Problemas

### Error: "remote origin already exists"
```bash
git remote remove origin
# Luego vuelve a agregar el remote
```

### Error: "Permission denied (publickey)"
- Verifica que agregaste tu clave SSH a GitHub
- O usa HTTPS en lugar de SSH

### Error: "Authentication failed"
- Si usas HTTPS, necesitas un Personal Access Token
- No uses tu contraseña de GitHub directamente

### Error: "Updates were rejected"
```bash
# Si el repositorio remoto tiene cambios
git pull origin master --rebase
git push
```

---

## ✅ Checklist Final

Antes de hacer push:
- [ ] .gitignore configurado
- [ ] .env no está en git
- [ ] README.md creado
- [ ] Commits con mensajes descriptivos
- [ ] Remote configurado
- [ ] Credenciales listas (Token o SSH)

---

## 🎉 Listo

Una vez que hagas `git push`, tu código estará en GitHub y podrás:
- ✅ Compartirlo con otros
- ✅ Clonarlo en otras máquinas
- ✅ Tener backup en la nube
- ✅ Colaborar con otros desarrolladores

---

## 📞 Comandos Rápidos

```bash
# Ver este archivo
cat GIT_GUIA.md

# Subir a GitHub (después de configurar remote)
git push -u origin master

# Ver estado
git status

# Ver remotes
git remote -v
```
