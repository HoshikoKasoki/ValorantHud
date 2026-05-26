const fs = require('fs')
const path = require('path')

const configPath =
path.join(
  __dirname,
  'config.json'
)

function updateOverlay(){

  try{

    const config =
    JSON.parse(
      fs.readFileSync(
        configPath,
        'utf8'
      )
    )

    const overlay =
    document.getElementById(
      'overlay'
    )

    if(
      overlay.src !==
      config.overlayImage
    ){
      overlay.src =
      config.overlayImage
    }

  }catch(err){
    console.log(err)
  }
}

updateOverlay()

setInterval(
  updateOverlay,
  1000
)