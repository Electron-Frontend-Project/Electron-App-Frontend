const path = require('path');
const { app, BrowserWindow, Menu, dialog} = require('electron');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

function createMainWindow() {
    const mainWindow = new BrowserWindow({      //creating main window
        title: 'Inversense',
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
    });

    // Open Dev Tools if in dev env.
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));      //creating frontend and uploading it to backend file (main.js)
}

app.whenReady().then(() =>{     //when the app is ready, creates the main func
    createMainWindow();

    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Upload File',
                    click: function () {
                        // Open a file dialog
                        const files = dialog.showOpenDialogSync(mainWindow, {
                            properties: ['openFile'],
                            filters: [
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        // Handle selected file(s)
                        if (files && files.length > 0) {
                            const filePath = files[0]; // Use the first selected file
                            // Here, you can process the selected file path
                            console.log('Selected file:', filePath);
                        }
                    }
                }, 
                {
                    label: 'Remove File'
                }
            ],
        },

        {
            label: 'Edit'
        },

        {
            label: 'View'
        },

        {
            label: 'Window'
        },

        {
            label: 'Help'
        }
    ]

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();

        }
    });
});

app.on('window-all-closed', () => {     //makes it cross platform so that it works on all OS.
    if (!isMac) {
        app.quit()
    }
});