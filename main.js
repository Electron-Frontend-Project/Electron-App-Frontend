const path = require('path');
const { app, BrowserWindow, Menu, dialog} = require('electron');
const axios = require('axios');
const express = require('express');
const { ipcMain } = require("electron");
var http = require('http');


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
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          }, 
    });

    // Open Dev Tools if in dev env.
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));      //creating frontend and uploading it to backend file (main.js)
 
//  to get values and send to API
    const appPort = 3000; //  the port number 
    const app = express(); 


    let server; // Declare a variable to store the server instance
    let responseData = {}; // Initialize responseData with an empty object
 
    ipcMain.on('fetch-data', async (event, data) => {
        const { rmin } = data;
   
        // Update responseData with the new input values
        responseData = data;
    
        app.get('/api/try', (req, res) => {
            res.json(responseData); // Send the updated data in the response
        });
   
        // Close the previous server instance if it exists
        if (server) {
            server.close(() => {
                console.log('Previous server instance closed.');
                startServer(); // Start a new server instance
            });
        } else {
            startServer(); // Start the initial server instance
        }
    });
   
    function startServer() {
        server = app.listen(appPort, () => {
            console.log(`API server is running on http://localhost:${appPort}/api/try`);
        });
    }
}

app.whenReady().then(() => {     //when the app is ready, creates the main func
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
