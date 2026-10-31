/* Número que recibe las inscripciones (con código de país: 57 = Colombia) */
const NUMERO_WHATSAPP = "573205810086";

/* ===== Cuenta regresiva ===== */
const cuenta = document.getElementById("cuenta");
const fechaEvento = new Date(cuenta.dataset.fecha).getTime();
const els = {
  dias: document.getElementById("dias"),
  horas: document.getElementById("horas"),
  minutos: document.getElementById("minutos"),
  segundos: document.getElementById("segundos"),
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function actualizar(el, valor) {
  if (el.textContent !== valor) {
    el.textContent = valor;
    el.classList.remove("tick");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("tick");
  }
}

function actualizarCuenta() {
  const resta = fechaEvento - Date.now();
  if (resta <= 0) {
    clearInterval(timer);
    cuenta.innerHTML = "<p><strong>¡La carrera ya comenzó!</strong></p>";
    return;
  }
  const s = Math.floor(resta / 1000);
  actualizar(els.dias, pad(Math.floor(s / 86400)));
  actualizar(els.horas, pad(Math.floor((s % 86400) / 3600)));
  actualizar(els.minutos, pad(Math.floor((s % 3600) / 60)));
  actualizar(els.segundos, pad(s % 60));
}

const timer = setInterval(actualizarCuenta, 1000);
actualizarCuenta();

/* ===== Validación del formulario ===== */
const form = document.getElementById("formulario");
const confirmacion = document.getElementById("confirmacion");
const EDAD_MINIMA = { "5": 8, "10": 14, familiar: 5 };

function calcularEdad(fechaTexto) {
  const hoy = new Date();
  const nac = new Date(fechaTexto);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// Cada regla devuelve un mensaje de error, o "" si es válido
const reglas = {
  nombre(v) {
    if (!v) return "Escribe tu nombre completo.";
    if (v.split(/\s+/).length < 2 || v.length < 5) return "Incluye nombre y apellido.";
    return "";
  },
  documento(v) {
    if (!v) return "Escribe tu documento de identidad.";
    if (!/^\d{6,12}$/.test(v)) return "Usa solo números (de 6 a 12 dígitos).";
    return "";
  },
  correo(v) {
    if (!v) return "Escribe tu correo electrónico.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Formato inválido. Ejemplo: nombre@correo.com";
    return "";
  },
  telefono(v) {
    if (!v) return "Escribe tu teléfono.";
    if (!/^\d{7,12}$/.test(v)) return "Usa solo números (de 7 a 12 dígitos).";
    return "";
  },
  nacimiento(v) {
    if (!v) return "Indica tu fecha de nacimiento.";
    if (new Date(v) > new Date()) return "La fecha no puede ser futura.";
    const cat = form.categoria.value;
    if (cat && calcularEdad(v) < EDAD_MINIMA[cat]) {
      return `Para esta categoría la edad mínima es ${EDAD_MINIMA[cat]} años.`;
    }
    return "";
  },
  categoria(v) {
    return v ? "" : "Selecciona una categoría.";
  },
  talla(v) {
    return v ? "" : "Selecciona tu talla de camiseta.";
  },
};

function validarCampo(nombre) {
  const campo = form[nombre];
  const error = reglas[nombre](campo.value.trim());
  const contenedor = campo.closest(".field");
  document.getElementById("err-" + nombre).textContent = error;
  contenedor.classList.toggle("invalid", Boolean(error));
  contenedor.classList.toggle("valid", !error);
  campo.setAttribute("aria-invalid", error ? "true" : "false");
  return !error;
}

// Validación en tiempo real
Object.keys(reglas).forEach((nombre) => {
  const campo = form[nombre];
  campo.addEventListener("blur", () => validarCampo(nombre));
  campo.addEventListener("input", () => {
    if (campo.closest(".field").classList.contains("invalid")) validarCampo(nombre);
  });
});

// Al cambiar la categoría, se revisa de nuevo la edad
form.categoria.addEventListener("change", () => {
  if (form.nacimiento.value) validarCampo("nacimiento");
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  confirmacion.hidden = true;

  const resultados = Object.keys(reglas).map(validarCampo);
  const primerError = form.querySelector(".invalid input, .invalid select");

  if (primerError) {
    primerError.focus();
    return;
  }

  const nombre = form.nombre.value.trim().split(/\s+/)[0];
  const categoriaTexto = form.categoria.options[form.categoria.selectedIndex].text;

  // Mensaje que llegará por WhatsApp al número de la fundación
  const mensaje =
    "*Nueva inscripción – Carrera Solidaria Manos Unidas*\n" +
    `Nombre: ${form.nombre.value.trim()}\n` +
    `Documento: ${form.documento.value.trim()}\n` +
    `Correo: ${form.correo.value.trim()}\n` +
    `Teléfono: ${form.telefono.value.trim()}\n` +
    `Fecha de nacimiento: ${form.nacimiento.value}\n` +
    `Categoría: ${categoriaTexto}\n` +
    `Talla de camiseta: ${form.talla.value}`;

  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener");

  confirmacion.textContent = `¡Gracias, ${nombre}! Se abrió WhatsApp con tu inscripción: solo falta pulsar «Enviar».`;
  confirmacion.hidden = false;
  form.reset();
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("valid", "invalid"));
  confirmacion.scrollIntoView({ behavior: "smooth", block: "center" });
});

/* ===== Aparición al hacer scroll ===== */
const aRevelar = document.querySelectorAll(".card, .route, .form, .marquee, .lead");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  aRevelar.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = (i % 3) * 0.12 + "s";
    obs.observe(el);
  });
}