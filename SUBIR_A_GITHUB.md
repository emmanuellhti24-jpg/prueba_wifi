# 🚀 LISTO PARA SUBIR A GITHUB

## ✅ Estado Actual

- ✅ Repositorio local creado
- ✅ 3 commits realizados
- ✅ Remote configurado: https://github.com/emmanuellhti24-jpg/prueba_wifi.git
- ✅ Rama renombrada a `main`

---

## 🔑 PASO FINAL: Autenticación

GitHub necesita que te autentiques. Tienes 2 opciones:

### Opción 1: Personal Access Token (Recomendado)

#### 1. Crear Token
1. Ve a: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Nombre: `Momoys Deploy`
4. Permisos: Marca **"repo"** (todos los checkboxes de repo)
5. Click **"Generate token"**
6. **COPIA EL TOKEN** (solo se muestra una vez)

#### 2. Subir código
```bash
cd /home/emmanuel/prueba_wifi
./push-to-github.sh
```

Cuando te pida credenciales:
- **Username**: `emmanuellhti24-jpg`
- **Password**: Pega tu Personal Access Token (no tu contraseña de GitHub)

---

### Opción 2: GitHub CLI (Más fácil)

```bash
# Instalar GitHub CLI (si no lo tienes)
sudo apt install gh

# Autenticarte
gh auth login
# Selecciona: GitHub.com → HTTPS → Yes → Login with browser

# Subir código
cd /home/emmanuel/prueba_wifi
git push -u origin main
```

---

## 📋 Comandos Manuales

Si prefieres hacerlo paso a paso:

```bash
cd /home/emmanuel/prueba_wifi

# Ver estado
git status

# Ver remote
git remote -v

# Subir código
git push -u origin main
```

---

## ✅ Verificar que Subió

Después de hacer push, verifica en:
https://github.com/emmanuellhti24-jpg/prueba_wifi

Deberías ver:
- ✅ README.md
- ✅ 46 archivos
- ✅ 3 commits
- ✅ Documentación completa

---

## 🐛 Solución de Problemas

### Error: "could not read Username"
- Necesitas autenticarte
- Usa Personal Access Token o GitHub CLI

### Error: "Authentication failed"
- Verifica que el token tenga permisos "repo"
- Verifica que copiaste el token completo
- NO uses tu contraseña de GitHub, usa el token

### Error: "Permission denied"
- Verifica que el repositorio sea tuyo
- Verifica que el token no haya expirado

---

## 🎯 Resumen

**Repositorio**: https://github.com/emmanuellhti24-jpg/prueba_wifi.git  
**Rama**: main  
**Commits listos**: 3  
**Archivos**: 46  

**Próximo paso**: Ejecutar `./push-to-github.sh` y autenticarte

---

## 📞 Ayuda Rápida

```bash
# Ver este archivo
cat SUBIR_A_GITHUB.md

# Ejecutar script de push
./push-to-github.sh

# Ver estado
git status

# Ver log
git log --oneline
```
