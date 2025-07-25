BookScraping Backend
Este es el backend de la aplicación BookScraping, construida con NestJS y Prisma. Se encarga de la lógica de scraping de libros de un sitio web de ejemplo, la gestión de categorías y libros en la base de datos, y la exposición de una API RESTful para interactuar con estos datos.

🚀 Empezando
Sigue estos pasos para tener una copia operativa de tu proyecto en tu máquina local para desarrollo y pruebas.

📋 Prerrequisitos
Antes de empezar, asegúrate de tener instalado lo siguiente:

Node.js: Se recomienda la versión LTS (v18.x o superior).

Descargar Node.js

npm (Node Package Manager): Viene incluido con Node.js.

⚙️ Instalación
Clona este repositorio:

Instala las dependencias de Node.js:

```bash
npm install
```

Configura las variables de entorno:
Crea un archivo .env en la raíz del proyecto y añade la siguiente variable. (ajustala para configurar tu conexión)
DATABASE_URL="postgresql://postgres:admin@localhost:5433/books?schema=public"

El proyecto usa prisma por lo cual solo se necesita ejecutar las migraciones, en caso de error prueba crear la base de datos "books" manualmente y luego ejecuta las migraciones.
```bash
npx prisma migrate dev
```

Para correr el proyecto:

```bash
npm run start:dev
```

Finalmente ejecuta este curl para hacer scraping y obtener las categorias desde la página.

```bash
curl -X POST http://localhost:3000/scraping/categories
```
