document.addEventListener('DOMContentLoaded', function() {
    const createUserModal = document.getElementById('create-user-account-modal');

    if (createUserModal) {
        const saveUserBtn = document.getElementById('save-user-account-btn');

        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', async function() {
                const nombre = document.getElementById('user-nombre').value;
                const email = document.getElementById('user-email').value;
                const password = document.getElementById('user-password').value;
                const role = document.getElementById('user-role').value;

                if (!nombre || !email || !password || !role) {
                    showError('Por favor, completa todos los campos.');
                    return;
                }

                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ nombre, email, password, rol: role }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        showSuccess('Usuario creado exitosamente.');
                        UI.closeModal('create-user-account-modal');
                        // Optionally, refresh the user list
                    } else {
                        showError(result.message || 'Error al crear el usuario.');
                    }
                } catch (error) {
                    showError('Error de red al crear el usuario.');
                }
            });
        }
    }
});
