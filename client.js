document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('whiteboard');
  const context = canvas.getContext('2d');
  const colorInput = document.getElementById('color-input');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeDisplay = document.getElementById('brush-size-display');
  const clearButton = document.getElementById('clear-button');
  const connectionStatus = document.getElementById('connection-status');
  const userCount = document.getElementById('user-count');

  // Store the current board state to redraw when needed
  let currentBoardState = [];

  // Resize canvas to fit the container
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    redrawCanvas(currentBoardState);
  }

  // Initialize canvas size
  resizeCanvas();

  // Handle window resizing
  window.addEventListener('resize', resizeCanvas);

  // Drawing variables
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Connect to Socket.IO server
  const socket = io('http://localhost:3000');

  // Socket.IO event handlers
  socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.classList.add('connected');
  });
  socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.classList.remove('connected');
  });
  socket.on('currentUsers', (count) => {
    userCount.textContent = count;
  });
  socket.on('boardState', (boardState) => {
    currentBoardState = boardState;
    redrawCanvas(currentBoardState);
  });
  socket.on('draw', (drawData) => {
    currentBoardState.push(drawData);
    drawLine(
      drawData.x0,
      drawData.y0,
      drawData.x1,
      drawData.y1,
      drawData.color,
      drawData.size
    );
  });
  socket.on('clear', () => {
    currentBoardState = [];
    context.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Canvas Mouse events (mousedown, mousemove, mouseup, mouseout)
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Clear button event handler and Update brush size display
  clearButton.addEventListener('click', clearCanvas);
  brushSizeInput.addEventListener('input', () => {
    brushSizeDisplay.textContent = brushSizeInput.value;
  });

  function startDrawing(e) {
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
  }

  function draw(e) {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const drawData = {
      x0: lastX,
      y0: lastY,
      x1: x,
      y1: y,
      color: colorInput.value,
      size: brushSizeInput.value
  }

  socket.emit('draw', drawData);
    lastX = x;
    lastY = y;
  }

  function drawLine(x0, y0, x1, y1, color, size) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = 'round';
    context.stroke();
    context.closePath();
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function clearCanvas() {
    socket.emit('clear');
  }

  function redrawCanvas(boardState = []) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    boardState.forEach(drawData => {
      drawLine(
        drawData.x0,
        drawData.y0,
        drawData.x1,
        drawData.y1,
        drawData.color,
        drawData.size
      );
    });
  }

  // Helper function to get coordinates from mouse or touch event
  function getCoordinates(e) {
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY
      };
    }
  }

  // Handle touch events
  function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
  }

  function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
  }
});
