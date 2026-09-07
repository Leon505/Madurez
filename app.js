// Registro de Service Worker para soporte Offline/PWA con Auto-Actualización
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registrado con éxito', reg))
            .catch(err => console.log('Error al registrar SW', err));
        
        // Detectar cuando el SW se ha actualizado en segundo plano y forzar recarga
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload(); // Recarga automáticamente para mostrar la nueva versión
            }
        });
    });
}

// Navegación secuencial con Enter / Tecla Siguiente
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.nav-input');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                    if (nextInput.tagName === 'INPUT') {
                        nextInput.select();
                    }
                } else {
                    calcular();
                }
            }
        });
    });
    // NUEVO: Formatear No.Caps/QQ con comas mientras se escribe
    const capsInput = document.getElementById('caps');
    capsInput.addEventListener('input', function(e) {
        // Eliminar cualquier cosa que no sea número
        let value = e.target.value.replace(/\D/g, '');
        // Agregar separador de miles
        if (value !== '') {
            value = parseInt(value, 10).toLocaleString('en-US');
        }
        e.target.value = value;
    });


});

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 4000);
}

function isInt(value) {
    return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

function calcular() {
    // 1. Validar Fechas
    const fSiembraStr = document.getElementById('fecha-siembra').value;
    const fMuestraStr = document.getElementById('fecha-muestra').value;

    if (!fSiembraStr || !fMuestraStr) {
        showToast("Debe ingresar ambas fechas");
        return;
    }

    const fSiembra = new Date(fSiembraStr);
    const fMuestra = new Date(fMuestraStr);

    if (fSiembra >= fMuestra) {
        showToast("La Fecha de Siembra debe de ser anterior a la Fecha de Muestra");
        return;
    }

    // Cálculo DDS (Días de diferencia)
    const diffTime = Math.abs(fMuestra - fSiembra);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    document.getElementById('res-dds').innerText = diffDays;

    // 2. Validar Muestras (Enteros Positivos)
    const filas = ['negras', 'cafes', 'naranjas', 'amarillas', 'blancas'];
    let m1Total = 0, m2Total = 0, sumaTotal = 0, promTotal = 0;
    const valores = {};

    for (let f of filas) {
        const m1 = document.getElementById(`m1-${f}`).value;
        const m2 = document.getElementById(`m2-${f}`).value;

        if (m1 === "" || m2 === "" || !isInt(m1) || !isInt(m2) || m1 < 0 || m2 < 0) {
            showToast("Debe de llenar todos los datos de las muestras con enteros positivos");
            return;
        }

        const vm1 = parseInt(m1);
        const vm2 = parseInt(m2);
        const suma = vm1 + vm2;
        const prom = suma / 2;

        valores[f] = { m1: vm1, m2: vm2, suma: suma, prom: prom };

        m1Total += vm1;
        m2Total += vm2;
        sumaTotal += suma;
        promTotal += prom;
    }
    
    if (promTotal === 0) {
         showToast("Los valores de muestra no pueden ser todos cero.");
         return;
    }

    // 3. Cálculos en Tabla
    for (let f of filas) {
        document.getElementById(`s-${f}`).innerText = valores[f].suma;
        document.getElementById(`p-${f}`).innerText = valores[f].prom.toFixed(2);
        
        const porc = (valores[f].prom / promTotal) * 100;
        valores[f].porc = porc;
        document.getElementById(`por-${f}`).innerText = porc.toFixed(2) + '%';
    }

    document.getElementById('t-m1').innerText = m1Total;
    document.getElementById('t-m2').innerText = m2Total;
    document.getElementById('t-suma').innerText = sumaTotal;
    document.getElementById('t-prom').innerText = promTotal.toFixed(2);
    document.getElementById('t-por').innerText = "100.00%";

    // 4. Cálculos Inferiores (Fórmulas Excel)
    // Madurez = % Negras + % Cafés + % Naranjas
    const madurez = valores['negras'].porc + valores['cafes'].porc + valores['naranjas'].porc;
    const madEl = document.getElementById('res-madurez');
    madEl.innerText = madurez.toFixed(2) + '%';
    madEl.className = madurez < 70 ? 'result-value alert' : 'result-value';

    // Porcentaje Negras y Cafés = % Negras + % Cafés
    const porcNC = valores['negras'].porc + valores['cafes'].porc;
    const ncEl = document.getElementById('res-porcentaje');
    ncEl.innerText = porcNC.toFixed(2) + '%';
    ncEl.className = porcNC < 40 ? 'result-value alert' : 'result-value';

    // Rendimiento = ROUND(SUMA(E10:E13) * A20 / F20, 2) - C20
    const sumaE10E13 = valores['negras'].prom + valores['cafes'].prom + valores['naranjas'].prom + valores['amarillas'].prom;
    
    const a20 = parseFloat(document.getElementById('metros').value);
    const c20 = parseFloat(document.getElementById('reduccion').value);
    // NUEVO: Reemplazamos la coma por vacío para que JavaScript pueda hacer la matemática
    const f20 = parseFloat(document.getElementById('caps').value.replace(/,/g, ''));

    const rendRaw = (sumaE10E13 * a20) / f20;
    const rendRounded = Math.round(rendRaw * 100) / 100;
    const rendimiento = rendRounded - c20;
    
    document.getElementById('res-rendimiento').innerHTML = rendimiento.toFixed(2) + ' <span class="unit">QQ/Mz</span>';
    
    // Mostrar botón Compartir
    document.getElementById('btn-share').style.display = 'flex';
}

function limpiar() {
    const inputsText = document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], textarea');
    inputsText.forEach(i => i.value = '');
    
    document.getElementById('metros').value = "7683";
    document.getElementById('reduccion').value = "8";
    // NUEVO: Se reasigna con coma
    document.getElementById('caps').value = "30,600";

    const celdas = document.querySelectorAll('.readonly-cell, .total-row td:not(:first-child), .result-value');
    celdas.forEach(c => {
        c.innerText = '';
        c.className = 'result-value';
        c.style.color = ''; 
    });
    
    document.getElementById('btn-share').style.display = 'none';
}

function compartir() {
    showToast("Generando imagen para compartir...");
    
    const fab = document.querySelector('.fab-container');
    fab.style.display = 'none';
    
    // --- NUEVA ESTRATEGIA: Ocultar inputs y mostrar texto puro ---
    const fSiembraInput = document.getElementById('fecha-siembra');
    const fMuestraInput = document.getElementById('fecha-muestra');
    let tempFS = null;
    let tempFM = null;

    if (fSiembraInput.value) {
        const partes = fSiembraInput.value.split('-'); 
        // Crear un elemento de texto idéntico al input
        tempFS = document.createElement('div');
        tempFS.innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
        tempFS.style.fontSize = '16px';
        tempFS.style.fontWeight = 'bold';
        tempFS.style.color = '#333333';
        tempFS.style.padding = '2px 0';
        
        // Insertarlo antes del input y ocultar el input
        fSiembraInput.parentNode.insertBefore(tempFS, fSiembraInput);
        fSiembraInput.style.display = 'none';
    }
    
    if (fMuestraInput.value) {
        const partes = fMuestraInput.value.split('-'); 
        tempFM = document.createElement('div');
        tempFM.innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
        tempFM.style.fontSize = '16px';
        tempFM.style.fontWeight = 'bold';
        tempFM.style.color = '#333333';
        tempFM.style.padding = '2px 0';
        
        fMuestraInput.parentNode.insertBefore(tempFM, fMuestraInput);
        fMuestraInput.style.display = 'none';
    }
    // -------------------------------------------------------------
    
    window.scrollTo(0,0);
    const captureArea = document.getElementById('capture-area');
    
    html2canvas(captureArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    }).then(canvas => {
        // --- RESTAURAR: Eliminar texto temporal y mostrar calendarios ---
        if (tempFS) {
            tempFS.remove();
            fSiembraInput.style.display = '';
        }
        if (tempFM) {
            tempFM.remove();
            fMuestraInput.style.display = '';
        }
        // ----------------------------------------------------------------
        
        fab.style.display = 'flex';
        
        canvas.toBlob(function(blob) {
            const prod = document.getElementById('productor').value || 'Productor';
            const fileName = `Muestreo_Madurez_${prod}.png`;
            const file = new File([blob], fileName, { type: "image/png" });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    files: [file],
                    title: 'Resultado Muestreo Madurez',
                    text: `Resultados Muestreo Madurez COMASA - Productor: ${prod}`
                })
                .then(() => console.log('Compartido con éxito.'))
                .catch((error) => console.log('Error al compartir', error));
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("Imagen descargada en el dispositivo");
            }
        }, 'image/png');
    });
}

function salir() {
    if (confirm("¿Seguro que desea salir?")) {
        window.close();
        window.location.href = "about:blank";
    }
}