document.addEventListener('DOMContentLoaded', function() {
    const createUserForm = document.getElementById('create-user-form');

    if (createUserForm) {
        createUserForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const nombre = document.getElementById('user-nombre').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;

            if (!nombre || !email || !password || !role) {
                alert('Por favor, completa todos los campos.');
                return;
            }

            try {
                const response = await fetch('/admin/usuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ nombre, email, password, rol: role }),
                });

                const result = await response.json();

                if (result.success) {
                    alert('Usuario creado exitosamente.');
                    UI.closeModal('create-user-account-modal');
                    // Optionally, refresh the user list
                } else {
                    alert(result.message || 'Error al crear el usuario.');
                }
            } catch (error) {
                alert('Error de red al crear el usuario.');
            }
        });
    }
});
