
"use strict";

// =======================================
// CONFIGURACIÓN
// =======================================

const API_URL =
    "https://fakestoreapi.com/products/category/electronics";

const CLAVE_CARRITO = "hardwareStoreCarrito";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD"
});

const contenedorProductos =
    document.getElementById("contenedor-productos");

const estadoProductos =
    document.getElementById("estado-productos");

const listaCarrito =
    document.getElementById("lista-carrito");

const contadorCarrito =
    document.getElementById("contador-carrito");

const totalCarrito =
    document.getElementById("total-carrito");

const mensajeCarrito =
    document.getElementById("mensaje-carrito");

const botonVaciar =
    document.getElementById("vaciar-carrito");

const botonFinalizar =
    document.getElementById("finalizar-compra");

const formulario =
    document.getElementById("formulario-contacto");

const errorFormulario =
    document.getElementById("error-formulario");

// =======================================
// ESTADO DE LA APLICACIÓN
// =======================================

let productos = [];
let carrito = cargarCarrito();

// =======================================
// LOCAL STORAGE
// =======================================

function cargarCarrito() {
    try {
        const guardado = localStorage.getItem(CLAVE_CARRITO);

        if (!guardado) {
            return [];
        }

        const datos = JSON.parse(guardado);

        if (!Array.isArray(datos)) {
            return [];
        }

        return datos.filter(item =>
            Number.isInteger(item.id) &&
            typeof item.titulo === "string" &&
            typeof item.precio === "number" &&
            Number.isFinite(item.precio) &&
            item.precio >= 0 &&
            Number.isInteger(item.cantidad) &&
            item.cantidad > 0 &&
            item.cantidad <= 99
        );
    } catch (error) {
        console.warn("No se pudo recuperar el carrito:", error);
        return [];
    }
}

function guardarCarrito() {
    try {
        localStorage.setItem(
            CLAVE_CARRITO,
            JSON.stringify(carrito)
        );
    } catch (error) {
        console.warn("No se pudo guardar el carrito:", error);
        mostrarMensaje(
            "El navegador no permitió guardar el carrito."
        );
    }
}

// =======================================
// API REST
// =======================================

async function obtenerProductos() {
    estadoProductos.textContent = "Cargando productos...";

    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(
                "Error HTTP: " + respuesta.status
            );
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error("Formato de datos inválido");
        }

        productos = datos.filter(producto =>
            Number.isInteger(producto.id) &&
            typeof producto.title === "string" &&
            typeof producto.image === "string" &&
            typeof producto.price === "number" &&
            Number.isFinite(producto.price) &&
            producto.price >= 0
        );

        if (productos.length === 0) {
            estadoProductos.textContent =
                "No hay productos disponibles.";
            return;
        }

        mostrarProductos(productos);

        estadoProductos.textContent =
            `${productos.length} productos disponibles.`;

    } catch (error) {
        console.error("Error al cargar productos:", error);

        estadoProductos.textContent =
            "No se pudieron cargar los productos. " +
            "Comprobá tu conexión e intentá nuevamente.";

        const botonReintentar =
            document.createElement("button");

        botonReintentar.type = "button";
        botonReintentar.className =
            "btn btn-primary d-block mx-auto";

        botonReintentar.textContent = "Reintentar";

        botonReintentar.addEventListener(
            "click",
            () => {
                botonReintentar.remove();
                obtenerProductos();
            }
        );

        contenedorProductos.replaceChildren(
            botonReintentar
        );
    }
}

// =======================================
// RENDERIZACIÓN DE PRODUCTOS
// =======================================

function mostrarProductos(lista) {
    contenedorProductos.replaceChildren();

    lista.forEach(producto => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "card-producto";

        const imagen = document.createElement("img");
        imagen.src = producto.image;
        imagen.alt = producto.title;
        imagen.loading = "lazy";

        const titulo = document.createElement("h3");
        titulo.textContent = producto.title;

        const precio = document.createElement("p");
        precio.className = "precio-producto";
        precio.textContent = formatoPrecio.format(
            producto.price
        );

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn btn-primary";
        boton.textContent = "Agregar al carrito";

        boton.addEventListener("click", () => {
            agregarAlCarrito(producto.id);
        });

        tarjeta.append(
            imagen,
            titulo,
            precio,
            boton
        );

        contenedorProductos.appendChild(tarjeta);
    });
}

// =======================================
// AGREGAR PRODUCTOS
// =======================================

function agregarAlCarrito(id) {
    const producto = productos.find(
        item => item.id === id
    );

    if (!producto) {
        return;
    }

    const existente = carrito.find(
        item => item.id === id
    );

    if (existente) {
        if (existente.cantidad >= 99) {
            mostrarMensaje(
                "La cantidad máxima por producto es 99."
            );
            return;
        }

        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            titulo: producto.title,
            precio: producto.price,
            cantidad: 1
        });
    }

    actualizarCarrito();

    mostrarMensaje(
        "Producto agregado al carrito."
    );
}

// =======================================
// MODIFICAR CANTIDADES
// =======================================

function modificarCantidad(id, cantidad) {
    const producto = carrito.find(
        item => item.id === id
    );

    if (!producto) {
        return;
    }

    const nuevaCantidad = Number(cantidad);

    if (
        !Number.isInteger(nuevaCantidad) ||
        nuevaCantidad < 1 ||
        nuevaCantidad > 99
    ) {
        mostrarMensaje(
            "Ingresá una cantidad entre 1 y 99."
        );
        renderizarCarrito();
        return;
    }

    producto.cantidad = nuevaCantidad;
    actualizarCarrito();
}

// =======================================
// ELIMINAR PRODUCTOS
// =======================================

function eliminarProducto(id) {
    carrito = carrito.filter(
        item => item.id !== id
    );

    actualizarCarrito();

    mostrarMensaje(
        "Producto eliminado del carrito."
    );
}

// =======================================
// VISUALIZACIÓN DEL CARRITO
// =======================================

function renderizarCarrito() {
    listaCarrito.replaceChildren();

    if (carrito.length === 0) {
        const vacio = document.createElement("p");
        vacio.textContent =
            "Tu carrito está vacío.";

        listaCarrito.appendChild(vacio);
        return;
    }

    carrito.forEach(producto => {
        const fila = document.createElement("article");
        fila.className = "producto-carrito";

        const detalle = document.createElement("div");
        detalle.className = "detalle-carrito";

        const titulo = document.createElement("h3");
        titulo.textContent = producto.titulo;

        const precio = document.createElement("p");
        precio.textContent =
            "Precio unitario: " +
            formatoPrecio.format(producto.precio);

        const subtotal = document.createElement("p");
        subtotal.textContent =
            "Subtotal: " +
            formatoPrecio.format(
                producto.precio * producto.cantidad
            );

        detalle.append(titulo, precio, subtotal);

        const controles = document.createElement("div");
        controles.className = "controles-carrito";

        const etiqueta = document.createElement("label");
        const idCantidad = `cantidad-${producto.id}`;
        etiqueta.htmlFor = idCantidad;
        etiqueta.textContent = "Cantidad:";

        const cantidad = document.createElement("input");
        cantidad.type = "number";
        cantidad.id = idCantidad;
        cantidad.className = "cantidad-carrito";
        cantidad.min = "1";
        cantidad.max = "99";
        cantidad.step = "1";
        cantidad.value = producto.cantidad;

        cantidad.addEventListener("change", () => {
            modificarCantidad(
                producto.id,
                cantidad.value
            );
        });

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "btn btn-danger btn-sm";
        eliminar.textContent = "Eliminar";

        eliminar.addEventListener("click", () => {
            eliminarProducto(producto.id);
        });

        controles.append(
            etiqueta,
            cantidad,
            eliminar
        );

        fila.append(detalle, controles);
        listaCarrito.appendChild(fila);
    });
}

// =======================================
// TOTAL Y CONTADOR
// =======================================

function actualizarCarrito() {
    const cantidadTotal = carrito.reduce(
        (acumulado, producto) =>
            acumulado + producto.cantidad,
        0
    );

    const precioTotal = carrito.reduce(
        (acumulado, producto) =>
            acumulado +
            producto.precio * producto.cantidad,
        0
    );

    contadorCarrito.textContent = cantidadTotal;

    totalCarrito.textContent =
        formatoPrecio.format(precioTotal);

    botonVaciar.disabled = carrito.length === 0;
    botonFinalizar.disabled = carrito.length === 0;

    guardarCarrito();
    renderizarCarrito();
}

function mostrarMensaje(texto) {
    mensajeCarrito.textContent = texto;
}

// =======================================
// VACIAR CARRITO
// =======================================

botonVaciar.addEventListener("click", () => {
    if (carrito.length === 0) {
        return;
    }

    const confirmar = window.confirm(
        "¿Querés vaciar todo el carrito?"
    );

    if (!confirmar) {
        return;
    }

    carrito = [];
    actualizarCarrito();

    mostrarMensaje(
        "El carrito se vació correctamente."
    );
});

// =======================================
// SIMULAR COMPRA
// =======================================

botonFinalizar.addEventListener("click", () => {
    if (carrito.length === 0) {
        mostrarMensaje(
            "Agregá productos antes de finalizar."
        );
        return;
    }

    const confirmar = window.confirm(
        "¿Confirmás la compra simulada?"
    );

    if (!confirmar) {
        return;
    }

    carrito = [];
    actualizarCarrito();

    mostrarMensaje(
        "¡Compra simulada realizada con éxito! " +
        "No se efectuó ningún pago real."
    );
});

// =======================================
// VALIDACIÓN DEL FORMULARIO
// =======================================

formulario.addEventListener("submit", (evento) => {
    errorFormulario.textContent = "";

    const nombre =
        document.getElementById("nombre").value.trim();

    const email =
        document.getElementById("email").value.trim();

    const mensaje =
        document.getElementById("mensaje").value.trim();

    const patronEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombre || !email || !mensaje) {
        evento.preventDefault();

        errorFormulario.textContent =
            "Todos los campos son obligatorios.";
        return;
    }

    if (!patronEmail.test(email)) {
        evento.preventDefault();

        errorFormulario.textContent =
            "Ingresá un correo electrónico válido.";
        return;
    }

    // Si los datos son válidos, el navegador
    // envía el formulario a Formspree.
});

// =======================================
// INICIALIZACIÓN
// =======================================

actualizarCarrito();
obtenerProductos();
