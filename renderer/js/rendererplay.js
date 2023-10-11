const { ipcRenderer } = require('electron');
const jardir = 'C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/pdtopolys/fea/target/';

document.addEventListener('DOMContentLoaded', () => {
    const playbutton = document.getElementById('play-button');

    playbutton.addEventListener('click', async () => {
        console.log("Clicked play button..");
        ipcRenderer.send('start-backend', jardir);
    });
});
