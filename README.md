# Depatitos backend

Backend de depatitos hecho con NodeJS y Express

## Características y dependencias
* Uso de `express` como servidor core y que sirve la API REST consumida por el frontend.
* Uso de `MongoDB` y el ODM `mongoose` para interactuar con la base de datos.
* Validación de datos enviados a los endpoints usando `express-validator`.
* Los nombres de los anuncios son parseados a `slugs` utilizando `mongoose-slug-updater`.
* Documentación dinámica del API utilizando `swagger-ui-express`.
* Envío de emails al usuario mediante `@sendgrid/mail`.
* Uso de JWT token para tener a un usuario autenticado.
* Tests unitarios que comprueban algunos endpoints del API utilizando una base de datos paralela que no afecta a la principal.
* Gestión de variables de entorno con `dotenv`.
* Filtrado y paginado de anuncios directamente en la base de datos.

El proyecto hace uso de las siguientes dependencias:

* @sendgrid/mail
* bcrypt
* connect-multiparty
* dotenv
* express
* express-validator
* http-errors
* jsonwebtoken
* mongoose
* mongoose-slug-updater
* swagger-ui-express

A nivel de desarrollo también se hace uso de las dependencias necesarias para los tests y para ejecutar el backend modo *hot reloading*:

* mocha
* supertest
* nodemon

## Configuración del proyecto
Clona el proyecto y en la raíz de este, instala todas las dependencias:
```
$ git clone 'url'
$ cd wc-backend
$ npm install
```

### Configuración de las variables de entorno
Crea un archivo `.env` (utiliza `.env.example` como guía) donde almacenarás todas las variables de entorno necesarias. Te tiene que quedar un archivo similar a esto:

```
MONGODB_URL=mongodb://...
MONGODB_URL_TEST=mongodb://...
JWT_SECRET=...
SENDGRID_API_KEY=...
PORT=3005
FRONT_URL=http://localhost:3000
DB_INSTALL_CLASSIC_MODE=classicDb
DB_INSTALL_TEST_MODE=testDb
```

* MONGODB_URL: URL para la conexión con MongoDB
* MONGODB_URL_TEST: URL para la conexión con MongoDB en la que se harán los tests
* JWT_SECRET: Password secreta para generar JSON Web Tokens
* SENDGRID_API_KEY: API Key de Sendgrid de tu cuenta para que se envíen los correos a partir de ella.
* PORT: Puerto en el que correrá el servidor.
* FRONT_URL: URL en la que opera el front
* DB_INSTALL_CLASSIC_MODE: String que refleja el modo de añadir datos base a una BD 'normal'
* DB_INSTALL_TEST_MODE: String que refleja el modo de añadir datos base a una BD de 'test'

## Configuración de la base de datos

Por defecto, la aplicación asume que tienes una instancia de MongoDB en localhost en el puerto por defecto, de no ser así, debes de instalar una y ejecutarla.


### Cargando los datos de muestra en la BD
Puedes utilizar el comando `npm run db_init` para importar todos los datos de muestra que están preparados en la carpeta `data/`. Todos los datos antiguos de la BD serán eliminados y, en su lugar, se introducirán los nuevos.

Los datos que se van a cargar son:
* Usuarios
* Tags
* Anuncios

A los anuncios se les asignará un usuario creador y unos tags aleatoriamente. A los usuarios se les asignará unos anuncios favoritos de forma aleatoria también.

## Ejecutando el servidor para desarrollo
Una vez que el proyecto está configurado y la base de datos está inicializada, debería de poder arrancar el proyecto en modo desarrollo o modo normal. La diferencia está en el uso de `nodemon`. En este caso, probaremos a arrancarlo como si fueramos a desarrollar:

```
// In wc-backend root folder
$ npm run dev
```

Este comando ejecutará la aplicación de express y la ejecutará en el puerto `3005`.

## API

### Autenticación por JWT

Un usuario será autenticado en la API utilizando **JWT**. Con cualquiera de los usuarios de muestra, puedes utilizar sus crendeciales de `username` y `password` para obtener un token JWT que te permitirá utilizar los endpoints que requieran esta autenticación. Para ello se utiliza un middleware que comprueba si el token existe, es válido y no haya expirado todavía.

En el caso de que mandes una petición a un endpoint que requiere autenticación y lo hagas <u>sin token</u> o con un <u>token expirado</u>, el API devolverá una respuesta con status 401 y un mensaje de error.

### Filtrado de anuncios

* por **tag** (*tag*): buscar incluyendo un tag como condición.
* por **tipo de anuncio** (*for_sale*) : busca anuncios que se vendan o se compren.
* por **rango de precios** (*price*): precio mínimo y precio máximo:  
  * `min-max` : anuncios cuyo precio está entre ambos parámetros.
  * `min-` : anuncios cuyo precio es mayor que el valor `min`.
  * `-max` : anuncios cuyo precio es menor que el valor `max`.
  * `value` : anuncios cuyo precio es el mismo que el de `value`.
* por **nombre** (*name*): busca anuncios cuyo nombre empiece por el valor del parámetro `name`.

### Filtros de paginación
Puedes obtener anuncios paginados para evitar obtener todos de golpe.
* por **página** (*page*): indica qué página de la paginación quieres obtener.
* por **límite** (*limit*): indica cuántos anunucios quieres obtener.
* por **ordenación** (*sort*): indica por qué campo quieres ordenar los resultados.

Un ejemplo de *query* puede ser la siguiente:
```
GET
http://localhost:3005/api-v1/adverts?tag=mobile&for_sale=false&name=ip&price=50-&page=0&limit=3&sort=price
```

### Tests unitarios
Se han añadido varios tests unitarios para probar distintos endpoints del API. Para que no afecten a la base de datos "principal", se utiliza una URL de la base de datos distinta a la principal.

Por ello, cuando queramos arrancar los tests por primera vez o queramos resetear este base de datos de tests, es necesario utiliza el comando: 

```
$ npm run db_init_test
```

Con este comando crearemos en MongoDB una nueva BD sobre la que actuarán los tests.

Para lanzar los tests a funcionar utilizamos el comando:

```
$ npm run test
```

Para los tests utilizamos `mocha` junto con `supertest` para lanzar peticiones al API.
