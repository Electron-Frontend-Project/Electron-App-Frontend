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

let serverProcess = null;

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

    const chokidar = require('chokidar');
    let watcher; // Declare watcher variable

    ipcMain.on('read-file2', (event, dirPath) => {
        try {
            watchDirectory(event, dirPath);
        } catch (err) {
            event.sender.send('file-read-error2', err.message);
        }
    });

    // Function to start watching the directory
    function watchDirectory(event, dirPath) {
        // If a watcher already exists, don't create a new one
        if (watcher) {
            console.log('Watcher already exists.');
            return;
        }

        watcher = chokidar.watch(dirPath, {
            ignored: /(^|[\/\\])\../, // Dot files ignore
            persistent: true,
        });

        console.log(`Listening was started: ${dirPath}`);

        const handleFileAdded = (filePath) => {
            setTimeout(async () => {
                try {
                    console.log("Reading file:", filePath);
                    const data = await readFileAsync(filePath);
                    event.sender.send('file-data2', { name: path.basename(filePath), content: data });
                } catch (err) {
                    event.sender.send('file-read-error2', err.message);
                }
            }, 1000);
        };

        watcher.on('add', handleFileAdded);
        watcher.on('ready', () => {
            console.log('Listening started. Waiting...');
        });
    }

    // Listen for the stop-watching message
    ipcMain.on('stop-watching', () => {
        console.log('Received stop-watching message from rendererO.js');
        if (watcher) {
            watcher.close(); // Stop watching
            watcher = null; // Clear the watcher variable
            console.log('Stopped watching the directory.');
        } else {
            console.log('No watcher to stop.');
        }
    });

    async function readFileAsync(filePath) {
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return data;
        } catch (err) {
            throw err;
        }
    }


    let server; // Declare a variable to store the server instance
    let responseData = {}; // Initialize responseData with an empty object
    let bcresponseData = {};
 
    // to send dx for radius
    ipcMain.on('send-dxD', (event, data) => {
        const { dx, length, width } = data;
        const responseData = { dx, length, width };
        event.sender.send('get-dxD', responseData);
        console.log("sending dx, length, width...", length, width);
    });

    ipcMain.on('send-dxO', (event, data) => {
        const { dx, length, width } = data;
        const responseData = { dx, length, width };
        event.sender.send('get-dxO', responseData);
        console.log("sending dx, length, width...", length, width);
    });
    // to send selected meshes (orange)
    ipcMain.on('selected-sphere', (event, selectedMeshID) => {  
        event.sender.send('selected-spheres', selectedMeshID); 
    });
    ipcMain.on('removed-sphere', (event, removedID) => {  
        event.sender.send('removed-spheres', removedID); 
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
        // API endpoint
        const apiUrl = 'http://localhost:8080/api/totalnodeit';
    
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
const ps = require("child_process");
let serverProcess = null; // Global variable

ipcMain.on('start-backend', async (event, jardir) => {
    let server = jardir + '/demo1-0.0.1-SNAPSHOT.jar';
    console.log(`Launching server with jar ${server}...`);
    
    serverProcess = ps.spawn('java', ['-jar', server]);
    event.reply('jar-path', server); // to get jar path

    // backend process
    serverProcess.stdout.on('data', (data) => {
        console.log(`${data}`);
        event.reply('backend-output', `${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
        event.reply('backend-error', `${data}`);
    });
    
    serverProcess.on('close', (code) => {
        console.log(`Server Process exited with code ${code}`);
        event.reply('backend-close', `Process exited with code ${code}`);
        serverProcess = null; 
    });
});

// PAUSE Button
const io = require('socket.io')(8080); // port 8080 server start
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

ipcMain.on('pause-backend', () => {
    io.emit('pause-message', 'Pause message sent from Electron main process');
});

// STOP Button
ipcMain.on('stop-backend', () => {
    console.log('Stopping Java jar file...');
    if (serverProcess) {
        serverProcess.kill(); // Kill process
        serverProcess = null; // Null
    } else {
        console.log('No server process to stop.');
    }
});


    // send BC parameters to backend
    ipcMain.on('send-BCparams', async (event, data) =>{
        console.log(data);
        bcresponseData = data;    
        app.get('/api/bcparam', (req, res) => {
            res.json(bcresponseData); // Send the updated data in the response
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
    return mainWindow;
}

app.whenReady().then(() => {  //when the app is ready, creates the main function
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

app.on('window-all-closed', () => {     // makes it cross platform so that it works on all OS.
    if (!isMac) {
        app.quit()
    }
});
