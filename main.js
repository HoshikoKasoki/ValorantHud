console.log(" app iniciada")
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const AutoLaunch = require('auto-launch');
const { ipcMain, dialog } = require('electron')

process.on('uncaughtException', (err) => {
  console.error("ERROR:", err)
})

let win
let settingsWin
let inGame = false
let valorantOpen = false

const os = require('os')

const logPath = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'VALORANT',
  'Saved',
  'Logs'
)

const {
    globalShortcut
} = require('electron')

const appLauncher = new AutoLaunch({
  name: 'ValorantHUD',
});

function openSettings(){

    if(
        settingsWin &&
        !settingsWin.isDestroyed()
    ){
        settingsWin.focus()
        return
    }

    settingsWin =
    new BrowserWindow({

        width:500,
        height:400,

        webPreferences:{
            nodeIntegration:true,
            contextIsolation:false
        }
    })

    settingsWin.loadFile(
        'settings.html'
    )
}

const configPath =
path.join(__dirname,'config.json')

function getConfig(){

    try{
        return JSON.parse(
            fs.readFileSync(configPath,'utf8')
        )
    }
    catch{

        return {
            overlayImage:"overlay.png"
        }
    }
}

function saveConfig(config){

    fs.writeFileSync(
        configPath,
        JSON.stringify(config,null,2)
    )
}

app.whenReady().then(() => {

  console.log("Electron listo")

  // Auto inicio
  appLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      appLauncher.enable()
      console.log("🚀 Auto inicio activado")
    }
  })

  // F10 abre configuración
  globalShortcut.register('F10', () => {

  if (!valorantOpen) {
    console.log(
      "⚠️ Valorant no está abierto"
    )
    return
  }

  openSettings()
})

  // IPC: obtener imagen actual
  ipcMain.handle('get-overlay', () => {
    return getConfig().overlayImage
  })

  // IPC: seleccionar imagen
  ipcMain.handle('select-image', async () => {

    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Imagenes',
          extensions: ['png', 'jpg', 'jpeg', 'webp']
        }
      ]
    })

    if (result.canceled) {
      return null
    }

    const file = result.filePaths[0]

    const config = getConfig()
    config.overlayImage = file

    saveConfig(config)

    console.log("🖼 Nueva imagen:", file)

    return file
  })

  // Ventana overlay
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: true,

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')

  win.setIgnoreMouseEvents(true)

  win.hide()

  win.setFullScreen(true)

  win.setAlwaysOnTop(
    true,
    "screen-saver"
  )

  console.log("🔥 llamando watchValorant")

  watchValorant()

  checkIfGameOpen()
})

function watchValorant() {  
  console.log("🔥 watchValorant iniciado")
  console.log(" Buscando logs en:", logPath)

  setInterval(() => {
    fs.readdir(logPath, (err, files) => {
      if (err) {
        console.log("❌ Error leyendo carpeta:", err)
        return
      }

      // buscar el log principal
      const logFile = files.find(f => f.includes("ShooterGame.log"))

      if (!logFile) {
        console.log("⚠️ No hay .log aún")
        return
      }

      const fullPath = path.join(logPath, logFile)

      console.log("📄 Leyendo:", fullPath)

      checkLog(fullPath)

    })
  }, 2000) // cada 2 segundos
}


function checkLog(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    console.log("🔥 checkLog ejecutado")
    if (err) return

    // 👇 solo últimas 30 líneas
    const lines = data.split('\n')
    const lastLines = lines.slice(-30).join('\n')

    // DEBUG (míralo en consola)
    console.log("---- LOG ----")
    console.log(lastLines)

    // 🔥 detección mejorada
    if (
  lastLines.includes("Broadcasting state changed to InGame")||
  lastLines.includes("LogGameFlowStateManager: Broadcasting state changed to InGame")||
  lastLines.includes("LogGameFlowStateManager: Transitioning from TransitionToInGame to InGame")||
  lastLines.includes("LogGameFlowStateManager: Current state InGame entering from TransitionToInGame")||
  lastLines.includes("InGame")
) {
  if (!inGame && canChangeState()) {
    console.log("🟢 Entraste a partida")
    inGame = true
    win.show()
  }
}

if (
  lastLines.includes("EndGame") ||
  lastLines.includes("Broadcasting state changed to Menu") ||
  lastLines.includes("Broadcasting state changed to MainMenu") ||
  lastLines.includes("Transitioning from TransitionToMainMenu to MainMenu") ||
  lastLines.includes("Transitioning from Transition To MainMenu to MainMenu") ||
  lastLines.includes("Reconcile called with state: TransitionToMainMenu and new state: MainMenu. Changing state.") ||
  lastLines.includes("MainMenu") ||
  lastLines.includes("new state: MainMenu") ||
  lastLines.includes("party CLOSED")
) {
  if (inGame && canChangeState()) {
    console.log("🔴 Saliste de partida")
    inGame = false
    win.hide()
  }
    }
  })
}

function checkIfGameOpen() {

  setInterval(() => {

    exec('tasklist', (err, stdout) => {

      valorantOpen =
      stdout.includes('VALORANT')

      if (!valorantOpen) {

        win.hide()

        inGame = false

        if (
          settingsWin &&
          !settingsWin.isDestroyed()
        ) {
          settingsWin.close()
        }
      }
    })

  }, 5000)
}

let lastStateChange = 0

function canChangeState() {
  const now = Date.now()
  if (now - lastStateChange > 500) { // 0.5s cooldown
    lastStateChange = now
    return true
  }
  return false
}