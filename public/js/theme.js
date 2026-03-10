/**
 * THEME MANAGER - Dark/Light Mode Toggle
 * Maneja el cambio de tema con persistencia en localStorage
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme();
        this.init();
    }

    // Obtener tema guardado o detectar preferencia del sistema
    getStoredTheme() {
        const stored = localStorage.getItem('momoys-theme');
        if (stored) return stored;
        
        // Detectar preferencia del sistema
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Inicializar tema
    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
        this.bindEvents();
        
        // Escuchar cambios en preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('momoys-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Aplicar tema al DOM
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.updateToggleIcon();
        
        // Dispatch evento personalizado para otros componentes
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme } 
        }));
    }

    // Cambiar tema
    setTheme(theme) {
        this.applyTheme(theme);
        localStorage.setItem('momoys-theme', theme);
    }

    // Toggle entre dark/light
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Animación de feedback
        this.animateToggle();
    }

    // Crear botón toggle
    createToggleButton() {
        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.id = 'themeToggle';
        button.setAttribute('aria-label', 'Cambiar tema');
        button.innerHTML = '<i class="fas fa-sun"></i>';
        
        document.body.appendChild(button);
    }

    // Actualizar icono del botón
    updateToggleIcon() {
        const button = document.getElementById('themeToggle');
        if (button) {
            const icon = this.currentTheme === 'dark' ? 'fa-moon' : 'fa-sun';
            button.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    // Animación de feedback
    animateToggle() {
        const button = document.getElementById('themeToggle');
        if (button) {
            button.style.transform = 'scale(0.8) rotate(180deg)';
            setTimeout(() => {
                button.style.transform = 'scale(1) rotate(0deg)';
            }, 200);
        }
    }

    // Bind eventos
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle')) {
                this.toggleTheme();
            }
        });

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'T' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    // API pública
    getCurrentTheme() {
        return this.currentTheme;
    }

    isDark() {
        return this.currentTheme === 'dark';
    }

    isLight() {
        return this.currentTheme === 'light';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}