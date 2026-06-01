const { ipcRenderer } =
require('electron')

const preview =
document.getElementById(
  'preview'
)

loadCurrentImage()

document
.getElementById(
  'changeImage'
)
.addEventListener(
  'click',
  async () => {

    const image =
    await ipcRenderer.invoke(
      'select-image'
    )

    if (image) {

      preview.src =
      image.startsWith('file://')
      ? image
      : `file:///${image.replace(/\\/g, '/')}`

      console.log(
        "🖼 Vista previa actualizada"
      )
    }
  }
)

async function loadCurrentImage() {

  const image =
  await ipcRenderer.invoke(
    'get-overlay'
  )

  if (image) {

    preview.src =
    image.startsWith('file://')
    ? image
    : `file:///${image.replace(/\\/g, '/')}`
  }
}