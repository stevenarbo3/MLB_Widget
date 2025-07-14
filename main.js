const { app, Menu, BrowserWindow } = require('electron');
const path = require('path');

let win;
let isAlwaysOnTop = false;
let isLocked = false;

function createWindow () {
  win = new BrowserWindow({
    width: 350,
    height: 200,
    x: 20,
    y: 20,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    focusable: true,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  win.loadFile('index.html');

  win.webContents.on('context-menu', () => {
    const menu = Menu.buildFromTemplate([
      {
        label: isAlwaysOnTop ? 'Disable Always on Top' : 'Enable Always on Top',
        click: () => {
          isAlwaysOnTop = !isAlwaysOnTop;
          win.setAlwaysOnTop(isAlwaysOnTop);
          win.webContents.send('update-ui', isAlwaysOnTop);
        }
      },
      {
        label: isLocked ? 'Unlock Position' : 'Lock Position',
        click: () => {
          isLocked = !isLocked;
          win.setMovable(!isLocked);
        }
      }
    ]);
    menu.popup();
  });
  
  return win;
}



app.whenReady().then(createWindow);
