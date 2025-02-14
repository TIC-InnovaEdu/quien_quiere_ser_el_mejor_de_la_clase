// Elementos del DOM
let wheel = document.querySelector("#wheel");
let button = document.querySelector("#spin");
let showContainer = document.querySelector(".popup-container");
let popupBox = document.querySelector(".popup-box");

// Variables del juego
let preguntas = [];
let preguntasRestantes = [];
let juegoActivo = false;
let preguntaActual = null;
let numerosRestantes = Array.from({ length: 12 }, (_, i) => i + 1);
let rotacionTotal = 0;

// Variables de puntaje
let puntos = 0;
let respuestasCorrectas = 0;
let preguntasRespondidas = 0;

// Constantes
const ANGULO_POR_NUMERO = 30;
const CORRECCION_ANGULO = 15;
const PUNTOS_POR_RESPUESTA_CORRECTA = 10;
const TOTAL_PREGUNTAS = 12;

// ====== FUNCIONES DE INICIALIZACIÓN ======

// Verificar estado del juego y cargar preguntas
async function verificarEstadoJuego() {
    try {
        const response = await fetch("/api/estado-juego");
        const data = await response.json();
        juegoActivo = data.isActive;

        console.log("📌 Estado del juego:", juegoActivo);
        await cargarPreguntas();

        if (!juegoActivo) {
            mostrarMensaje("El juego está desactivado. Espera a que el profesor lo active.");
            button.disabled = true;
        } else if (preguntas.length < TOTAL_PREGUNTAS) {
            mostrarMensaje("Faltan preguntas. Consulta a tu profesor.");
            button.disabled = true;
        } else {
            preguntasRestantes = [...preguntas];
            button.disabled = false;
        }
    } catch (error) {
        console.error("❌ Error obteniendo el estado del juego:", error);
        mostrarMensaje("Error al conectar con el servidor. Intenta recargar la página.");
    }
}

// Cargar preguntas del servidor
async function cargarPreguntas() {
    try {
        const response = await fetch("/api/preguntas");
        preguntas = await response.json();
        console.log("📌 Preguntas cargadas:", preguntas.length);
    } catch (error) {
        console.error("❌ Error al cargar preguntas:", error);
        mostrarMensaje("Error al cargar las preguntas. Intenta recargar la página.");
    }
}

// ====== FUNCIONES DE LA RULETA ======

// Girar la ruleta
function spinWheel() {
    if (!juegoActivo || preguntas.length < TOTAL_PREGUNTAS) {
        mostrarMensaje("El juego no está listo para comenzar.");
        return;
    }

    if (preguntasRespondidas >= TOTAL_PREGUNTAS) {
        mostrarMensaje("¡Has completado todas las preguntas!");
        return;
    }

    button.disabled = true;

    // Seleccionar número y pregunta
    const indexNumero = Math.floor(Math.random() * numerosRestantes.length);
    const numeroSeleccionado = numerosRestantes.splice(indexNumero, 1)[0];
    preguntaActual = preguntasRestantes.splice(numeroSeleccionado - 1, 1)[0];

    // Girar la ruleta
    wheel.style.transition = "none";
    wheel.style.transform = `rotate(0deg)`;

    setTimeout(() => {
        const vueltasCompletas = Math.floor(Math.random() * 5) + 5;
        rotacionTotal = 360 * vueltasCompletas + (ANGULO_POR_NUMERO * (numeroSeleccionado - 1)) + CORRECCION_ANGULO;

        wheel.style.transition = "all 3s ease-out";
        wheel.style.transform = `rotate(${rotacionTotal}deg)`;
    }, 50);

    setTimeout(() => {
        mostrarPregunta(preguntaActual);
        button.disabled = false;
    }, 3500);
}

// ====== FUNCIONES DE INTERFAZ ======

// Mostrar mensaje emergente
function mostrarMensaje(mensaje, esFinal = false) {
    popupBox.innerHTML = `
        <h1>${esFinal ? '¡Juego Terminado!' : '¡Atención!'}</h1>
        <p>${mensaje}</p>
        <button class="close-btn">Cerrar</button>
    `;
    showContainer.classList.add("active");
    document.querySelector(".close-btn").onclick = () => cerrarPopup(true);
}

// Cerrar popup
function cerrarPopup(esCierreManual = false) {
    if (esCierreManual && preguntaActual) {
        if (confirm('¿Seguro que quieres salir? Perderás esta pregunta.')) {
            preguntasRespondidas++;
            preguntaActual = null;
            actualizarContadorPreguntas();

            if (preguntasRespondidas >= TOTAL_PREGUNTAS) {
                guardarPuntaje();
            }
        } else {
            // Si el usuario cancela, volver a mostrar la pregunta
            showContainer.classList.add("active");
            document.addEventListener("keydown", handleKeyPress);
            return;
        }
    }

    showContainer.classList.remove("active");
    document.removeEventListener("keydown", handleKeyPress);
}

// Mostrar pregunta
function mostrarPregunta(preguntaData) {
    if (!preguntaData) {
        mostrarMensaje("Error al seleccionar la pregunta. Intenta nuevamente.");
        return;
    }

    popupBox.innerHTML = `
        <h1>Pregunta ${preguntasRespondidas + 1}/${TOTAL_PREGUNTAS}</h1>
        <p>${preguntaData.pregunta}</p>
        <ul>
            ${preguntaData.respuestas.map((respuesta, i) =>
                `<li><strong>${String.fromCharCode(65 + i)}:</strong> ${respuesta}</li>`
            ).join('')}
        </ul>
        <p>Presiona A, B, C o D para seleccionar tu respuesta</p>
        <p class="puntos-actuales">Puntos actuales: ${puntos}</p>
        <p class="progreso-actual">Progreso: ${((preguntasRespondidas/TOTAL_PREGUNTAS) * 100).toFixed(0)}%</p>
        <button class="close-btn">Cerrar</button>
    `;

    showContainer.classList.add("active");
    document.querySelector(".close-btn").onclick = () => cerrarPopup(true);
    document.addEventListener("keydown", handleKeyPress);
}

// ====== FUNCIONES DE MANEJO DE RESPUESTAS ======

// Manejar teclas presionadas
function handleKeyPress(event) {
    if (!preguntaActual) return;

    const key = event.key.toUpperCase();
    const validKeys = ['A', 'B', 'C', 'D'];
    if (validKeys.includes(key)) {
        const respuestaIndex = validKeys.indexOf(key);
        verificarRespuesta(respuestaIndex);
    } else if (key === 'ESCAPE') {
        cerrarPopup(true);
    } else {
        // Mostrar mensaje si la tecla no es válida
        const mensajeElement = document.createElement('p');
        mensajeElement.textContent = 'Use las teclas A, B, C o D para responder';
        mensajeElement.className = 'text-warning mt-2';

        // Remover mensaje anterior si existe
        const mensajeAnterior = popupBox.querySelector('.text-warning');
        if (mensajeAnterior) {
            mensajeAnterior.remove();
        }

        popupBox.appendChild(mensajeElement);
    }
}

// Verificar respuesta
function verificarRespuesta(respuestaIndex) {
    console.log("Verificando respuesta:", respuestaIndex);
    cerrarPopup(false);
    preguntasRespondidas++;
    console.log("Preguntas respondidas:", preguntasRespondidas, "de", TOTAL_PREGUNTAS);
    actualizarContadorPreguntas();

    const esCorrecta = respuestaIndex === preguntaActual.correcta;
    if (esCorrecta) {
        puntos += PUNTOS_POR_RESPUESTA_CORRECTA;
        respuestasCorrectas++;
        console.log("Respuesta correcta. Puntos actuales:", puntos);
        actualizarPuntos();
        mostrarMensaje("¡Correcto! +10 puntos");
    } else {
        console.log("Respuesta incorrecta");
        mostrarMensaje(`Incorrecto. La respuesta correcta es: ${preguntaActual.respuestas[preguntaActual.correcta]}`);
    }

    console.log("Verificando si el juego terminó:", preguntasRespondidas >= TOTAL_PREGUNTAS);
    if (preguntasRespondidas >= TOTAL_PREGUNTAS) {
        console.log("Juego terminado, intentando guardar puntaje...");
        guardarPuntaje();
    }

    preguntaActual = null;
}

// Actualizar contador de preguntas
function actualizarContadorPreguntas() {
    const preguntaElement = document.querySelector('.pregunta');
    if (preguntaElement) {
        preguntaElement.textContent = `Pregunta: ${preguntasRespondidas}/${TOTAL_PREGUNTAS}`;
    }
}

// ====== FUNCIONES DE PUNTAJE ======

// Actualizar puntos en la interfaz
function actualizarPuntos() {
    const puntosElement = document.getElementById('puntos');
    if (puntosElement) {
        puntosElement.textContent = `Puntos: ${puntos}`;
    }
}

// Guardar puntaje
async function guardarPuntaje() {
    console.log("Iniciando guardarPuntaje");
    console.log("Datos a enviar:", {
        puntos,
        respuestasCorrectas,
        totalPreguntas: TOTAL_PREGUNTAS
    });

    try {
        const response = await fetch('/api/guardar-puntaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                puntos: puntos,
                respuestasCorrectas: respuestasCorrectas,
                totalPreguntas: TOTAL_PREGUNTAS
            })
        });

        console.log("Estado de la respuesta:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error del servidor: ${errorData.message}`);
        }

        const data = await response.json();
        console.log('✅ Puntaje guardado:', data);
        mostrarMensajeFinal();
    } catch (error) {
        console.error('❌ Error detallado al guardar puntaje:', error);
        mostrarMensaje('Error al guardar el puntaje. Por favor, notifica al profesor.');
    }
}

// Mostrar mensaje final
function mostrarMensajeFinal() {
    popupBox.innerHTML = `
        <h1>¡Juego Terminado!</h1>
        <div class="resumen-final">
            <p class="puntaje-final">Puntaje final: ${puntos}</p>
            <p class="respuestas-correctas">Respuestas correctas: ${respuestasCorrectas}/${TOTAL_PREGUNTAS}</p>
            <p class="porcentaje">Porcentaje de acierto: ${((respuestasCorrectas/TOTAL_PREGUNTAS) * 100).toFixed(1)}%</p>
        </div>
        <div class="botones-finales">
            <button onclick="window.location.reload()" class="close-btn">Jugar de nuevo</button>
            <button onclick="window.location.href='/dashboard/alumno'" class="close-btn">Volver al Dashboard</button>
        </div>
    `;
    showContainer.classList.add("active");
    button.disabled = true;
}

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar puntos existentes del usuario
    const puntosElement = document.getElementById('puntos');
    if (puntosElement) {
        const puntosTexto = puntosElement.textContent;
        puntos = parseInt(puntosTexto.match(/\d+/) || [0]);
    }

    await verificarEstadoJuego();
    actualizarPuntos();
    actualizarContadorPreguntas();
});

// Evento del botón de girar
button.addEventListener("click", spinWheel);
