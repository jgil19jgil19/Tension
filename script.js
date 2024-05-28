let medias=[];//variable global que contendra las medias de agrupaciones de medidas, se usa para ponerlas en el pdf

document.addEventListener("DOMContentLoaded", function () {
    const menuView = document.getElementById("menuView");
    const registroView = document.getElementById("registroView");
    const registrosView = document.getElementById("registrosView");
    const resumenView=document.getElementById("resumenView");
    const form = document.getElementById("registroForm");
    const registrosTableBody = document.querySelector("#registrosTable tbody");
    const mediaTableBody = document.querySelector("#mediaTable tbody");


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

    document.getElementById("generarMediasPdfBtn").addEventListener("click", function () {
        generarMediasPDF();
    });

    document.getElementById("generaResumenBtn").addEventListener("click", function () {
        mostrarVista("resumenView");
        mostrarPromedios(processRecords(JSON.parse(localStorage.getItem("registros"))))
        //mostrarRegistros();
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

    document.getElementById("volverMenuBtn3").addEventListener("click", function () {
        mostrarVista("menuView");
    });

    function mostrarVista(vistaId) {
        menuView.classList.remove("active");
        registroView.classList.remove("active");
        registrosView.classList.remove("active");
        resumenView.classList.remove("active");
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

        const modo = document.getElementById("modo").value;

        const registro = {
            fecha,
            hora,
            brazo,
            sistolica,
            diastolica,
            pulso
        };
        
        let registros = JSON.parse(localStorage.getItem("registros")) || [];
        if(modo==='annadir') registros.push(registro);
        else{ //editar
            registros[+modo]= registro;
            document.getElementById("modo").value='annadir';
        } 
        localStorage.setItem("registros", JSON.stringify(registros));


        mostrarVista("menuView");
    });

    function mostrarRegistros() {
        const registros = JSON.parse(localStorage.getItem("registros")) || [];
        registrosTableBody.innerHTML = "";
        //const ultimosRegistros = registros.slice(-7).reverse();
        const ultimosRegistros = registros.reverse();

        ultimosRegistros.forEach((registro, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${registro.fecha}</td>
                <td>${registro.hora}</td>
                <td>${registro.brazo}</td>
                <td class="destacado">${registro.sistolica}</td>
                <td class="destacado">${registro.diastolica}</td>
                <td>${registro.pulso}</td>
                <td><button class="delete-button" data-index="${registros.length - index - 1}">Eliminar</button>
                <button  class="edita-button" data-index="${registros.length - index - 1}" >Editar</button></td>
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
        document.querySelectorAll(".edita-button").forEach(button => {
            button.addEventListener("click", function () {
                const index = this.getAttribute("data-index");
                //if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
                    editaRegistro(index);
                //}
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
        const registros = JSON.parse(localStorage.getItem("registros")).reverse() || [];
        const ws = XLSX.utils.json_to_sheet(registros);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        XLSX.writeFile(wb, "registros.xlsx");
    }

    async function generarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const registros = JSON.parse(localStorage.getItem("registros")).reverse() || [];

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
    const editaRegistro = (index) => {
        mostrarVista("registroView");

        //const fecha = document.getElementById("fecha").value;
        //const hora = document.getElementById("hora").value;
        //cargarFechaYHoraActual();
        let registros = JSON.parse(localStorage.getItem("registros")) || [];

        document.getElementById("fecha").value = registros[index].fecha;
        document.getElementById("hora").value = registros[index].hora;
        document.getElementById("brazo").value = registros[index].brazo;
        document.getElementById("sistolica").value = registros[index].sistolica;
        document.getElementById("diastolica").value = registros[index].diastolica;
        document.getElementById("pulso").value = registros[index].pulso;

        document.getElementById("modo").value = index;

    }

    ///para crear resumen de datos en una toma.

    const  mostrarPromedios = (promediados) => {
        //const registros = JSON.parse(localStorage.getItem("registros")) || [];
        mediaTableBody.innerHTML = "";
        //const ultimosRegistros = registros.slice(-7).reverse();
        //const ultimosRegistros = registros.reverse();

        medias=promediados;//lo pasamos a la variable global medias
        let alReves= promediados.reverse()

        alReves.forEach((registro, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${registro.fecha}</td>
                <td>${registro.hora}, [${registro.minutosDiferencia}]</td>
                <td>${registro.brazo}</td>
                <td class="destacado">${registro.sistolicaPromedio}</td>
                <td class="destacado">${registro.diastolicaPromedio}</td>
                <td>${registro.pulsoPromedio}</td>
                <td>${registro.numeroRegistros}</td>
            `;
            mediaTableBody.appendChild(row);
        });
    }

    function processRecords(records) {//alert(JSON.stringify(records))
        // Parse and sort the records by date and time
        records.forEach(record => {
          record.datetime = new Date(`${record.fecha}T${record.hora}`);
        });
        records.sort((a, b) => a.datetime - b.datetime);
      
        let result = [];
        let currentGroup = [];      
      
        function finalizeGroup() {
          if (currentGroup.length > 0) {
            let start = currentGroup[0].datetime;
            let end = currentGroup[currentGroup.length - 1].datetime;
            let brazo = currentGroup[0].brazo;
            let systolicSum = 0;
            let diastolicSum = 0;
            let pulseSum = 0;
      
            currentGroup.forEach(record => {
              systolicSum += +record.sistolica;
              diastolicSum += +record.diastolica;
              pulseSum += +record.pulso;
            });
      
            let systolicAvg = systolicSum / currentGroup.length;
            let diastolicAvg = diastolicSum / currentGroup.length;
            let pulseAvg = pulseSum / currentGroup.length;
            let timeDiff = (end - start) / (1000 * 60); // difference in minutes
      
            result.push({
              fecha: currentGroup[0].fecha,
              hora: currentGroup[0].hora,
              minutosDiferencia: timeDiff,
              brazo: brazo,
              sistolicaPromedio: Math.round(systolicAvg),
              diastolicaPromedio: Math.round(diastolicAvg),
              pulsoPromedio: Math.round(pulseAvg),
              numeroRegistros: currentGroup.length,
              datetime: currentGroup[0].datetime
            });
      
            currentGroup = [];
          }
        }

        let currentGroupDer=[];
        let currentGroupIz=[];
      
        for (let i = 0; i < records.length; i++) {
            
            if(records[i].brazo==='Der'){
              if (currentGroupDer.length === 0) {
                currentGroupDer.push(records[i]);
              } else {
                let firstRecord = currentGroupDer[0];
                let timeDiff = (records[i].datetime - firstRecord.datetime) / (1000 * 60); // difference in minutes
          
                if (timeDiff <= 60) {
                  currentGroupDer.push(records[i]);
                } else {
                  currentGroup=currentGroupDer;  
                  finalizeGroup();
                  currentGroupDer=currentGroup;
                  currentGroupDer.push(records[i]);
                }
              }
            }
            if(records[i].brazo==='Izq'){
              if (currentGroupIz.length === 0) {
                currentGroupIz.push(records[i]);
              } else {
                let firstRecord = currentGroupIz[0];
                let timeDiff = (records[i].datetime - firstRecord.datetime) / (1000 * 60); // difference in minutes
          
                if (timeDiff <= 60) {
                  currentGroupIz.push(records[i]);
                } else {
                  currentGroup=currentGroupIz;  
                  finalizeGroup();
                  currentGroupIz=currentGroup
                  currentGroupIz.push(records[i]);
                }
              }
            }
           
        }
        if(currentGroupDer.length>0){
            currentGroup=currentGroupDer;
            finalizeGroup();
        }
        if(currentGroupIz.length>0){
            currentGroup=currentGroupIz;
            finalizeGroup();
        }
        
        result.sort((a, b) => a.datetime - b.datetime);

        return result;
      }


      
      async function generarMediasPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const registros = medias;//la tomamos de la variable global

        doc.text("Registros promedio de Presión Arterial", 10, 20);

        const headers = [["Fecha", "Hora", "brazo", "P. Sis. media", "P. Dias. media", "Pulso medio", "Nº Medidas"]];
        const data = registros.map(registro => [registro.fecha, registro.hora, registro.brazo, registro.sistolicaPromedio, registro.diastolicaPromedio, registro.pulsoPromedio, registro.numeroRegistros]);

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

        doc.save("MediasTension.pdf");
    }
  

      
      
});
