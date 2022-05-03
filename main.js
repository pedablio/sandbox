const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const cameraOffset = { x: 0, y: 0 }
let cameraZoom = 1
const MAX_ZOOM = 5
const MIN_ZOOM = 0.1
const SCROLL_SENSITIVITY = 0.001
const columns = 1_00
const rows = 1_00
const sizeOfCrop = 8
let selectedSizes = []

function draw() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
  // ctx.translate(window.innerWidth / 2, window.innerHeight / 2)
  ctx.scale(cameraZoom, cameraZoom)
  // ctx.translate(-window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y)
  ctx.translate(cameraOffset.x, cameraOffset.y)
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  range(0, columns).forEach((positionX) => {
    range(0, rows).forEach((positionY) => {
      const hasSelectedSize = selectedSizes.some((data) => data.x === positionX && data.y === positionY)

      ctx.fillStyle = hasSelectedSize ? '#000' : '#ccc'
      ctx.fillRect(positionX * sizeOfCrop, positionY * sizeOfCrop, sizeOfCrop, sizeOfCrop)
    })
  })

  requestAnimationFrame(draw)
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e) {
  if (e.touches && e.touches.length === 1) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  } else if (e.clientX && e.clientY) {
    return { x: e.clientX, y: e.clientY }
  }
}

let isDragging = false
let hasMoved = false
const dragStart = { x: 0, y: 0 }

function onPointerDown(e) {
  isDragging = true
  dragStart.x = getEventLocation(e).x / cameraZoom - cameraOffset.x
  dragStart.y = getEventLocation(e).y / cameraZoom - cameraOffset.y
}

function onPointerUp(e) {
  isDragging = false
  initialPinchDistance = null
  lastZoom = cameraZoom

  if (!hasMoved) {
    const mousePos = getEventLocation(e)
    const mouseX = mousePos.x / cameraZoom - cameraOffset.x
    const mouseY = mousePos.y / cameraZoom - cameraOffset.y

    console.log({
      x: Math.floor(mouseX / sizeOfCrop),
      y: Math.floor(mouseY / sizeOfCrop),
    })

    selectedSizes.push({
      x: Math.floor(mouseX / sizeOfCrop),
      y: Math.floor(mouseY / sizeOfCrop),
    })
  } else {
    hasMoved = false
  }
}

function onPointerMove(e) {
  if (isDragging) {
    hasMoved = true
    cameraOffset.x = getEventLocation(e).x / cameraZoom - dragStart.x
    cameraOffset.y = getEventLocation(e).y / cameraZoom - dragStart.y
  }
}

function handleTouch(e, singleTouchHandler) {
  if (e.touches.length === 1) {
    singleTouchHandler(e)
  } else if (e.type === 'touchmove' && e.touches.length === 2) {
    isDragging = false
    handlePinch(e)
  }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e) {
  e.preventDefault()

  const touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  const touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

  // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
  const currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2

  if (initialPinchDistance == null) {
    initialPinchDistance = currentDistance
  } else {
    adjustZoom(null, currentDistance / initialPinchDistance)
  }
}

function adjustZoom(zoomAmount, zoomFactor) {
  if (!isDragging) {
    if (zoomAmount) {
      cameraZoom += zoomAmount
    } else if (zoomFactor) {
      cameraZoom = zoomFactor * lastZoom
    }

    cameraZoom = Math.min(cameraZoom, MAX_ZOOM)
    cameraZoom = Math.max(cameraZoom, MIN_ZOOM)
  }
}

function range(start, end, step = 1) {
  return Array(Math.ceil((end - start + 1) / step))
    .fill(start)
    .map((x, y) => x + y * step)
}

canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('touchend', (e) => handleTouch(e, onPointerUp))
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * SCROLL_SENSITIVITY))

// Ready, set, go
draw()
