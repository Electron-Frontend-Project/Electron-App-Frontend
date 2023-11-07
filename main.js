const path = require('path');
const { app, BrowserWindow, Menu, dialog} = require('electron');
const axios = require('axios');
const express = require('express');
const { ipcMain } = require("electron");
var http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;

function createMainWindow() {
    const mainWindow = new BrowserWindow({      //creating main window
        title: 'PDTO',
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
    
    //  to read .msh file
    ipcMain.on('read-file1', (event, filePath) => {     
        if (fs.existsSync(filePath)) {
            console.log("Hello World!");
            // Read the contents of the MSH file
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    event.sender.send('file-read-error1', err.message);
                } else {
                    // Send the data to the renderer process
                    event.sender.send('file-data1', data);
                }
            });
        } 
        else {
            event.sender.send('file-not-found1', `File not found: ${filePath}`);
        }
    }); 
    //  to read .msh file
    ipcMain.on('read-file2', async (event, dirPath) => {
        try {
            const files = await readAndSortFiles(dirPath);
            for (const name of files) {
                const filePath = path.join(dirPath, name);
                console.log("Reading file:", name);
                const data = await readFileAsync(filePath);
                event.sender.send('file-data2', { name, content: data });
            }
        } catch (err) {
            event.sender.send('file-read-error2', err.message);
        }
   
    });   



    async function readAndSortFiles(dirPath) {
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    files.sort((a, b) => {
                        const aNumber = parseInt(a.match(/\d+/)[0]);
                        const bNumber = parseInt(b.match(/\d+/)[0]);
                        return aNumber - bNumber;
                    });
                    resolve(files);
                }
            });
        });
    }
    
    async function readFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }


    let server; // Declare a variable to store the server instance
    let responseData = {}; // Initialize responseData with an empty object
 
    // to send dx for radius
    ipcMain.on('send-dxD', (event, data) => {
        const {dx} = data;
        event.sender.send('get-dxD', dx);
        console.log("sending dx...");
    });
    ipcMain.on('send-dxO', (event, data) => {
        const {dx} = data;
        event.sender.send('get-dxO', dx);
        console.log("sending dx...");
    });

    ipcMain.on('fetch-data', async (event, data) => { 
        const { rmin, dx, volfrac, length, width, thick, ndivx, ndivy, ndivz } = data;   
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

    ipcMain.on('fetch-data-from-api', (event) => {
        // Replace the following URL with your API endpoint
        const apiUrl = 'http://localhost:8080/api/totalnodeit';
    
        // Make a request to the API
        // You can use libraries like axios, fetch, or request
        // Here, we'll use the 'axios' library as an example
        axios.put(apiUrl)
          .then(response => {
            const data = response.data;
            // Send the data back to the renderer process
            event.reply('api-data-fetched', data);
          })
          .catch(error => {
            console.error('Error fetching data from the API: ', error);
          });
      });
   
    function startServer() {
        server = app.listen(appPort, () => {
            console.log(`API server is running on http://localhost:${appPort}/api/try`);
        });
    }
    // play button java -jar file.jar   
    var ps = require("child_process");
    ipcMain.on('start-backend', async (event, jardir) =>{
        let server = jardir + 'demo1-0.0.1-SNAPSHOT.jar';
        console.log(`Launching server with jar ${server}...`);
        serverProcess = ps.spawn('java', ['-jar', server]);
        // backend process
        serverProcess.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });
        
        serverProcess.on('close', (code) => {
            console.log(`Server Process exited with code ${code}`);
        });
    });
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
