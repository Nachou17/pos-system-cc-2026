## Dejen aquí un resumen de lo que hicieron en su día de trabajo


Nacho: Módulo de clientes. Revisé y mejoré el clientController.js. Se resolvió la limitación de falta de validación de inputs 
implementando una validación matemática estricta para el RUT chileno en el endpoint POST.

Nacho: Creé el userController.js instalando bcryptjs para encriptar el password_hash por seguridad, resolviendo la vulnerabilidad 
de texto plano. Endpoints CRUD listos.

Nacho: Finalizado el frontend. Actualicé la vista de Clientes agregando el modal para el futuro historial de compras. 
Corregí y adapté la vista de Usuarios asegurando que la edición de roles funcione correctamente con el backend y ocultando 
la edición de contraseñas por seguridad.

Nacho: Frontend finalizado y conectado a la BD en Azure. Validaciones de RUT, encriptación de contraseñas y
vistas de Clientes/Usuarios probadas y funcionando correctamente.
