document.addEventListener("DOMContentLoaded", function () {
    const menuView = document.getElementById("menuView");
    const registroView = document.getElementById("registroView");
    const registrosView = document.getElementById("registrosView");
    const form = document.getElementById("registroForm");
    const registrosTableBody = document.querySelector("#registrosTable tbody");

    document.getElementById("nuevoRegistroBtn").addEventListener("click", function () {
        mostrarVista("registroView");
        cargarFechaYHoraActual();
        document.getElementById("brazo").value='Izq';
        document.getElementById("sistolica").value='';
        document.getElementById("diastolica").value='';
        document.getElementById("pulso").value='';
    });

    document.getElementById("verRegistrosBtn").addEventListener("click", function () {
        mostrarVista("registrosView");
        mostrarRegistros();
    });

    document.getElementById("exportarExcelBtn").addEventListener("click", function () {
        exportarAExcel();
    });

    document.getElementById("generarPdfBtn").addEventListener("click", function () {
        generarPDF();
    });

    document.getElementById("cargaDatosBtn").addEventListener("click", function () {
        cargaDatos();
    });

    document.getElementById("guardaDatosBtn").addEventListener("click", function () {
        guardaDatos();
    });

    document.getElementById("volverMenuBtn").addEventListener("click", function () {
        mostrarVista("menuView");
    });

    document.getElementById("volverMenuBtn2").addEventListener("click", function () {
        mostrarVista("menuView");
    });

    function mostrarVista(vistaId) {
        menuView.classList.remove("active");
        registroView.classList.remove("active");
        registrosView.classList.remove("active");
        document.getElementById(vistaId).classList.add("active");
    }

    function cargarFechaYHoraActual() {
        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];
        const hora = ahora.toTimeString().split(' ')[0].slice(0, 5);

        const fechaInput = document.getElementById("fecha");
        const horaInput = document.getElementById("hora");
            //alert(fecha + hora.replace(':','-'))
            fechaInput.value = fecha;        
            horaInput.value = hora;
        
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const fecha = document.getElementById("fecha").value;
        const hora = document.getElementById("hora").value;
        const brazo = document.getElementById("brazo").value;
        const sistolica = document.getElementById("sistolica").value;
        const diastolica = document.getElementById("diastolica").value;
        const pulso = document.getElementById("pulso").value;

        const registro = {
            fecha,
            hora,
            brazo,
            sistolica,
            diastolica,
            pulso
        };

        let registros = JSON.parse(localStorage.getItem("registros")) || [];
        registros.push(registro);
        localStorage.setItem("registros", JSON.stringify(registros));

        mostrarVista("menuView");
    });

    function mostrarRegistros() {
        const registros = JSON.parse(localStorage.getItem("registros")) || [];
        registrosTableBody.innerHTML = "";
        const ultimosRegistros = registros.slice(-7).reverse();

        ultimosRegistros.forEach((registro, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${registro.fecha}</td>
                <td>${registro.hora}</td>
                <td>${registro.brazo}</td>
                <td class="destacado">${registro.sistolica}</td>
                <td class="destacado">${registro.diastolica}</td>
                <td>${registro.pulso}</td>
                <td><button class="delete-button" data-index="${registros.length - 7 + index}">Eliminar</button></td>
            `;
            registrosTableBody.appendChild(row);
        });

        document.querySelectorAll(".delete-button").forEach(button => {
            button.addEventListener("click", function () {
                const index = this.getAttribute("data-index");
                if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
                    eliminarRegistro(index);
                }
            });
        });
    }

    function eliminarRegistro(index) {
        let registros = JSON.parse(localStorage.getItem("registros")) || [];
        registros.splice(index, 1);
        localStorage.setItem("registros", JSON.stringify(registros));
        mostrarRegistros();
    }

    function exportarAExcel() {
        const registros = JSON.parse(localStorage.getItem("registros")) || [];
        const ws = XLSX.utils.json_to_sheet(registros);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        XLSX.writeFile(wb, "registros.xlsx");
    }

    async function generarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const registros = JSON.parse(localStorage.getItem("registros")) || [];

        doc.text("Registros de Presión Arterial", 10, 20);

        const headers = [["Fecha", "Hora", "brazo", "Sistólica", "Diastólica", "Pulso"]];
        const data = registros.map(registro => [registro.fecha, registro.hora, registro.brazo, registro.sistolica, registro.diastolica, registro.pulso]);

        doc.autoTable({
            head: headers,
            body: data,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 10 },
            margin: { top: 30 },
            didDrawPage: function (data) {
                doc.text(`Página ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save("registros.pdf");
    }

    const guardaDatos = () => {

        const ahora = new Date();
        const fecha = ahora.toISOString().split('T')[0];
        const hora = ahora.toTimeString().split(' ')[0].slice(0, 5).replace(':','-');
        let texto = [];
        texto.push(localStorage.getItem('registros'));
        let contenidoEnBlob = new Blob(texto, {
            type: 'text/plain'
        });
        ///
        let reader = new FileReader();
        reader.onload = (event) => {
            let save = document.createElement('a');
            save.href = event.target.result;
            save.target = '_blank';
            save.download = 'DatosTension'+fecha+'-'+hora+'.txt';
            let clicEvent = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            save.dispatchEvent(clicEvent);
            (window.URL || window.webkitURL).revokeObjectURL(save.href);
        };
        reader.readAsDataURL(contenidoEnBlob);
    };

    const cargaDatos = () => {
        var archivoInput = document.getElementById('fileData');

        var archivo = archivoInput.files[0];
        var lector = new FileReader();

        lector.onload = function (event) {
            var contenido = event.target.result;
            if (confirm('¿Seguro que quieres cambiar los datos antiguos por los nuevos?')) {
                try {
                    let aux = JSON.parse(contenido);                
                    if (aux[0].fecha !== undefined) {//debe tener al menos un dato 
                        localStorage.setItem("registros", contenido);
                        mostrarRegistros();
                    } else {
                        alert('El archivo no contiene datos o no tiene el formato correcto.\n No se carga.')
                    }
                } catch (error) {
                    alert('No se ha cargado nada por error:\n' + error)
                }
            }
        }

        lector.readAsText(archivo);
    }
});
