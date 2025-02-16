let data = []; // Dades carregades
let cycles = []; // Llista de cicles únics
let currentCycle = null; // Cicle seleccionat
let showRPM = true, showTemp = true, showThrottle = true, showPump = true, showAux = true; // Controls de visibilitat
let offsetX = 0; // Desplaçament horitzontal
let maxOffsetX = 0; // Desplaçament màxim

// Constants per a l'àrea de dibuix
let MARGIN_LEFT, MARGIN_RIGHT, MARGIN_TOP, MARGIN_BOTTOM, GRAPH_WIDTH, GRAPH_HEIGHT;

function setup() {
  const canvas = createCanvas(windowWidth * 0.8, windowHeight * 0.6);
  canvas.parent('canvasContainer'); // Assigna el canvas al contenidor

  // Defineix les constants dins de setup()
  updateMargins();

  // Configura el file input
  document.getElementById('fileInput').addEventListener('change', handleFile);

  // Configura el selector de cicle
  document.getElementById('cycleSelect').addEventListener('change', (e) => {
    currentCycle = e.target.value;
    offsetX = 0; // Reinicia el desplaçament
    updateScrollBar(); // Actualitza la barra de desplaçament
  });

  // Configura els botons de visibilitat
  document.getElementById('toggleRPM').addEventListener('click', () => {
    showRPM = !showRPM;
    drawLegend();
  });
  document.getElementById('toggleTemp').addEventListener('click', () => {
    showTemp = !showTemp;
    drawLegend();
  });
  document.getElementById('toggleThrottle').addEventListener('click', () => {
    showThrottle = !showThrottle;
    drawLegend();
  });
  document.getElementById('togglePump').addEventListener('click', () => {
    showPump = !showPump;
    drawLegend();
  });
  document.getElementById('toggleAux').addEventListener('click', () => {
    showAux = !showAux;
    drawLegend();
  });

  // Configura la barra de desplaçament
  document.getElementById('scrollBar').addEventListener('input', (e) => {
    offsetX = parseInt(e.target.value);
  });
}

function draw() {
  background(255);
  if (data.length === 0) return;

  // Dibuixa la quadrícula de fons
  drawGrid();

  // Dibuixa els eixos
  drawAxes();

  // Filtra les dades pel cicle seleccionat
  let filteredData = currentCycle ? data.filter(row => row[0] === currentCycle) : data;

  // Dibuixa les línies
  drawLine(filteredData, 4, 'RPM', showRPM, color(255, 0, 0));
  drawLine(filteredData, 3, 'Temperatura', showTemp, color(0, 255, 0));
  drawLine(filteredData, 5, 'Throttle', showThrottle, color(0, 0, 255));
  drawLine(filteredData, 6, 'Pump', showPump, color(255, 0, 255));
  drawLine(filteredData, 2, 'Voltatge de bateria', showAux, color(255, 165, 0));
}

function windowResized() {
  resizeCanvas(windowWidth * 0.8, windowHeight * 0.6);
  updateMargins();
  updateScrollBar();
}

function updateMargins() {
  MARGIN_LEFT = width * 0.1; // Marge esquerre
  MARGIN_RIGHT = width * 0.05; // Marge dret
  MARGIN_TOP = height * 0.1; // Marge superior
  MARGIN_BOTTOM = height * 0.1; // Marge inferior
  GRAPH_WIDTH = width - MARGIN_LEFT - MARGIN_RIGHT; // Amplada de l'àrea de dibuix
  GRAPH_HEIGHT = height - MARGIN_TOP - MARGIN_BOTTOM; // Alçada de l'àrea de dibuix
}

function handleFile(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      processData(content);
    };
    reader.readAsText(file);
  }
}

function processData(content) {
  data = [];
  cycles = new Set();
  const lines = content.split('\n');
  lines.slice(1).forEach(line => {
    const values = line.split(',');
    if (values.length > 1) {
      data.push(values);
      cycles.add(values[0]); // Afegeix el cicle a la llista
    }
  });
  // Actualitza el selector de cicle
  const cycleSelect = document.getElementById('cycleSelect');
  cycleSelect.innerHTML = '<option value="">All cycles</option>';
  cycles.forEach(cycle => {
    cycleSelect.innerHTML += `<option value="${cycle}">Cicle ${cycle}</option>`;
  });
  // Actualitza la llegenda
  drawLegend();

  // Actualitza la barra de desplaçament
  updateScrollBar();
}

function updateScrollBar() {
  // Filtra les dades pel cicle seleccionat
  let filteredData = currentCycle ? data.filter(row => row[0] === currentCycle) : data;

  // Calcula el desplaçament màxim
  maxOffsetX = max(0, filteredData.length * 10 - GRAPH_WIDTH); // 10 píxels per segon, ajustat a l'amplada del canvas
  document.getElementById('scrollBar').max = maxOffsetX;

  // Actualitza el valor de la barra de desplaçament
  document.getElementById('scrollBar').value = offsetX;
}

function getMinMaxValues(data, index) {
  const values = data.map(row => parseFloat(row[index]));
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function drawLine(data, index, label, visible, col) {
  if (!visible || data.length === 0) return;

  // Escala per a RPM
  if (index === 4) {
    const rpmValues = getMinMaxValues(data, 4);
    stroke(col);
    noFill();
    beginShape();
    for (let i = 0; i < data.length; i++) {
      let x = MARGIN_LEFT + i * 10 - offsetX; // 10 píxels per segon
      let y = map(data[i][index], rpmValues.min, rpmValues.max, height - MARGIN_BOTTOM, MARGIN_TOP); // Escala RPM

      // Limita les coordenades x i y dins dels marges
      x = constrain(x, MARGIN_LEFT, width - MARGIN_RIGHT);
      y = constrain(y, MARGIN_TOP, height - MARGIN_BOTTOM);

      vertex(x, y);
    }
    endShape();
  }
  // Escala per a la resta de variables
  else {
    const otherValues = [
      getMinMaxValues(data, 3), // Temperatura
      getMinMaxValues(data, 5), // Throttle
      getMinMaxValues(data, 6), // Pump
      getMinMaxValues(data, 2)  // Voltatge de bateria
    ];
    const globalMin = Math.min(...otherValues.map(v => v.min));
    const globalMax = Math.max(...otherValues.map(v => v.max));

    stroke(col);
    noFill();
    beginShape();
    for (let i = 0; i < data.length; i++) {
      let x = MARGIN_LEFT + i * 10 - offsetX; // 10 píxels per segon
      let y = map(data[i][index], globalMin, globalMax, height - MARGIN_BOTTOM, MARGIN_TOP); // Escala comuna

      // Limita les coordenades x i y dins dels marges
      x = constrain(x, MARGIN_LEFT, width - MARGIN_RIGHT);
      y = constrain(y, MARGIN_TOP, height - MARGIN_BOTTOM);

      vertex(x, y);
    }
    endShape();
  }
}

function drawLegend() {
  const legend = document.getElementById('legend');
  if (data.length === 0) {
    legend.innerHTML = '<h3>Legend</h3>';
    return;
  }

  // Defineix les variables i els seus colors
  const variables = [
    { label: 'RPM', col: 'red', visible: showRPM },
    { label: 'Temperature', col: 'green', visible: showTemp },
    { label: 'Throttle', col: 'blue', visible: showThrottle },
    { label: 'Pump', col: 'magenta', visible: showPump },
    { label: 'Voltge', col: 'orange', visible: showAux }
  ];

  // Construeix el contingut de la llegenda
  let legendContent = '<h3>Legend</h3>';
  variables.forEach(v => {
    if (v.visible) {
      legendContent += `
        <div>
          <span style="background-color: ${v.col};"></span>
          ${v.label}
        </div>
      `;
    }
  });

  legend.innerHTML = legendContent;
}

function drawAxes() {
  // Dibuixa l'eix X
  stroke(0);
  strokeWeight(1);
  line(MARGIN_LEFT, height - MARGIN_BOTTOM, width - MARGIN_RIGHT, height - MARGIN_BOTTOM); // Eix X

  // Etiqueta de l'eix X
  fill(0);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  text("Time (seconds)", width / 2, height - MARGIN_BOTTOM + 50);

  // Marcadors de l'eix X (es mouen amb el desplaçament)
  const startTime = Math.floor(offsetX / 10); // Temps inicial en segons
  const endTime = startTime + Math.floor(GRAPH_WIDTH / 10); // Temps final en segons

  for (let i = startTime; i <= endTime; i++) {
    if (i % 5 === 0) { // Mostra les etiquetes cada 5 segons
      const x = MARGIN_LEFT + (i - startTime) * 10; // Posició X en funció del temps
      if (x >= MARGIN_LEFT && x <= width - MARGIN_RIGHT) { // Limita les marques dins dels marges
        line(x, height - MARGIN_BOTTOM - 5, x, height - MARGIN_BOTTOM + 5); // Marques

        // Dibuixa l'etiqueta en vertical
        push(); // Guarda l'estat actual del canvas
        translate(x, height - MARGIN_BOTTOM + 20); // Mou l'origen de coordenades
        rotate(-HALF_PI); // Gira el text 90 graus (en sentit horari)
        textAlign(CENTER, CENTER);
        text(i, 0, 0); // Dibuixa l'etiqueta
        pop(); // Restaura l'estat del canvas
      }
    }
  }

  // Dibuixa l'eix Y amb dues escales
  if (data.length === 0) return;

  // Escala per a RPM
  const rpmValues = getMinMaxValues(data, 4);
  const yTicks = 5; // Nombre de marques a l'eix Y
  for (let i = 0; i <= yTicks; i++) {
    const y = map(i, 0, yTicks, height - MARGIN_BOTTOM, MARGIN_TOP);
    const value = map(i, 0, yTicks, rpmValues.min, rpmValues.max).toFixed(0); // Sense decimals
    if (y >= MARGIN_TOP && y <= height - MARGIN_BOTTOM) { // Limita les marques dins dels marges
      line(MARGIN_LEFT - 5, y, MARGIN_LEFT + 5, y); // Marques
      text(value, MARGIN_LEFT - 30, y); // Etiquetes
    }
  }

  // Escala per a la resta de variables (Temperatura, Throttle, Pump, Voltatge de bateria)
  const otherValues = [
    getMinMaxValues(data, 3), // Temperatura
    getMinMaxValues(data, 5), // Throttle
    getMinMaxValues(data, 6), // Pump
    getMinMaxValues(data, 2)  // Voltatge de bateria
  ];
  const globalMin = Math.min(...otherValues.map(v => v.min));
  const globalMax = Math.max(...otherValues.map(v => v.max));

  for (let i = 0; i <= yTicks; i++) {
    const y = map(i, 0, yTicks, height - MARGIN_BOTTOM, MARGIN_TOP);
    const value = map(i, 0, yTicks, globalMin, globalMax).toFixed(0); // Sense decimals
    if (y >= MARGIN_TOP && y <= height - MARGIN_BOTTOM) { // Limita les marques dins dels marges
      line(width - MARGIN_RIGHT - 5, y, width - MARGIN_RIGHT + 5, y); // Marques
      text(value, width - MARGIN_RIGHT + 20, y); // Etiquetes
    }
  }
}

function drawGrid() {
  // Configuració de la quadrícula
  stroke(200); // Color de les línies de la quadrícula
  strokeWeight(1);
  noFill();

  // Línies verticals (eix X)
  const startTime = Math.floor(offsetX / 10); // Temps inicial en segons
  const endTime = startTime + Math.floor(GRAPH_WIDTH / 10); // Temps final en segons

  for (let i = startTime; i <= endTime; i++) {
    const x = MARGIN_LEFT + (i - startTime) * 10; // Posició X en funció del temps
    if (x >= MARGIN_LEFT && x <= width - MARGIN_RIGHT) { // Limita les línies dins dels marges
      line(x, MARGIN_TOP, x, height - MARGIN_BOTTOM); // Línies verticals
    }
  }

  // Línies horitzontals (eix Y)
  const yTicks = 5; // Nombre de marques a l'eix Y
  for (let i = 0; i <= yTicks; i++) {
    const y = map(i, 0, yTicks, height - MARGIN_BOTTOM, MARGIN_TOP);
    if (y >= MARGIN_TOP && y <= height - MARGIN_BOTTOM) { // Limita les línies dins dels marges
      line(MARGIN_LEFT, y, width - MARGIN_RIGHT, y); // Línies horitzontals
    }
  }
}
