// Event listeners para staff.html (sin handlers inline)

document.addEventListener('DOMContentLoaded', () => {
    // Tabs de navegación
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Dashboard redirect
    document.querySelector('[data-action="dashboard"]')?.addEventListener('click', () => {
        location.href = '/dashboard.html';
    });
    
    // Logout
    document.querySelector('[data-action="logout"]')?.addEventListener('click', logout);
    
    // Botones de nuevo
    document.querySelector('[data-action="new-product"]')?.addEventListener('click', () => openProductModal());
    document.querySelector('[data-action="new-inventory"]')?.addEventListener('click', () => openInventoryModal());
    document.querySelector('[data-action="new-user"]')?.addEventListener('click', () => openUserModal());
    document.querySelector('[data-action="new-staff"]')?.addEventListener('click', () => openStaffModal());


    // Botones de guardado en modales
    document.querySelector('[data-action="save-product"]')?.addEventListener('click', saveProduct);
    document.querySelector('[data-action="save-inventory"]')?.addEventListener('click', saveInventory);
    document.querySelector('[data-action="save-user"]')?.addEventListener('click', saveUser);
    document.querySelector('[data-action="save-staff"]')?.addEventListener('click', saveStaff);


    // Agregar item a receta
    document.querySelector('[data-action="add-recipe"]')?.addEventListener('click', addRecipeItem);
});
