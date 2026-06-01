const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { ipcRenderer } = require('electron')

const configPath =
path.join(
  __dirname,
  'config.json'
)

console.log("CONFIG:", configPath)

function setOverlay(imagePath) {

  const overlay =
  document.getElementById(
    'overlay'
  )

  if (!overlay) {
    return
  }

  if (!imagePath) {

    imagePath =
    path.join(
      __dirname,
      'overlay.png'
    )
  }

  const imageUrl =
  pathToFileURL(
    imagePath
  ).href

  console.log(
    "🖼 Overlay:",
    imageUrl
  )

  overlay.src = imageUrl
}

function loadOverlay() {

  try {

    if (
      !fs.existsSync(configPath)
    ) {
      setOverlay()
      return
    }

    const config =
    JSON.parse(
      fs.readFileSync(
        configPath,
        'utf8'
      )
    )

    if (
      config.overlayImage &&
      fs.existsSync(
        config.overlayImage
      )
    ) {
      setOverlay(
        config.overlayImage
      )
    }
    else {
      setOverlay()
    }

  }
  catch(err) {

    console.error(err)

    setOverlay()
  }
}

// cargar al iniciar
loadOverlay()

// actualizar instantáneamente
ipcRenderer.on(
  'overlay-changed',
  (event, imagePath) => {

    console.log(
      "🔄 Overlay actualizado"
    )

    setOverlay(
      imagePath
    )
  }
)