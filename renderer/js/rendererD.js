const { ipcRenderer } = require('electron');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileDD');
    readFile.addEventListener('click', async () => {
        const filePath = 'C:/Users/suuser/Desktop/PDTO4/topology/builtmesh/solidR2.msh'; // Replace with the actual file path
        ipcRenderer.send('read-file2', filePath);
    });
});

ipcRenderer.on('file-read-error2', (event, errorMessage) => {
    // Handle the file read error here in the renderer process
    console.error('File read error:', errorMessage);
});

ipcRenderer.on('file-not-found2', (event, errorMessage) => {
    // Handle the file not found error here in the renderer process
    console.error('File not found:', errorMessage);
});

ipcRenderer.on('file-data2', (event, data) => {
  // Handle the received data here in the renderer process
    const lines = data.split('\n');
    console.log(lines);
    // Create a scene, camera, and renderer
    const scene = new THREE.Scene();  
    const scene2 = new THREE.Scene();
    scene.background = new THREE.Color( "#ffffff" );    
    scene2.background = new THREE.Color( "#ffffff" );    
    // Get the container element by its class name
    const container = document.querySelector('.design-part');   
    const container2 = document.querySelector('.corner-box');
    // Create a camera with appropriate aspect ratio and size
    const width = container.clientWidth;
    const height = container.clientHeight;
    const width2 = container2.clientWidth;
    const height2 = container2.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000); 
    const camera2 = new THREE.PerspectiveCamera(75, width2 / height2, 0.1, 1000); 
    const CAM_DISTANCE = 10;
    const renderer = new THREE.WebGLRenderer(); 
    const renderer2 = new THREE.WebGLRenderer(); 
    // Set the renderer's size to match the container
    renderer.setSize(width, height);   
    renderer2.setSize(width2, height2); 
    // Append the renderer's canvas to the container
    container.appendChild(renderer.domElement); 
    container2.appendChild(renderer2.domElement);
 //   // Create OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    const controls2 = new OrbitControls(camera2, renderer2.domElement);
 
    const axesHelper = new THREE.AxesHelper( 5 );
    scene2.add( axesHelper );

    



//    var menu = document.querySelector(".context-menu");
//    var menuState = 0;
//    var contextMenuActive = "block";
//
//    document.addEventListener("contextmenu", function (event) {
//        console.log("Right click!");
//        event.preventDefault();
//        toggleMenuOn();
//        positionMenu(event);
//      });
//
//      function toggleMenuOn() {
//        if (menuState !== 1) {
//          menuState = 1;
//          menu.classList.add(contextMenuActive);
//          console.log("Right click!2");
//        }
//      }
//
//      function toggleMenuOff() {
//        if (menuState !== 0) {
//          menuState = 0;
//          menu.classList.remove(contextMenuActive);
//        }
//      }
//
//      function getPosition(e) {
//        var posx = 0;
//        var posy = 0;
//      
//        if (!e) var e = window.event;
//      
//        if (e.pageX || e.pageY) {
//          posx = e.pageX;
//          posy = e.pageY;
//        } else if (e.clientX || e.clientY) {
//          posx =
//            e.clientX +
//            document.body.scrollLeft +
//            document.documentElement.scrollLeft;
//          posy =
//            e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
//        }
//      
//        return {
//          x: posx,
//          y: posy
//        };
//      }
//
//      // Position the Context Menu in right position.
//function positionMenu(e) {
//    console.log("Right click!3");
//    let clickCoords = getPosition(e);
//    let clickCoordsX = clickCoords.x;
//    let clickCoordsY = clickCoords.y;
//  
//    let menuWidth = menu.offsetWidth + 4;
//    let menuHeight = menu.offsetHeight + 4;
//  
//    let windowWidth = window.innerWidth;
//    let windowHeight = window.innerHeight;
//  
//    if (windowWidth - clickCoordsX < menuWidth) {
//      menu.style.left = windowWidth - menuWidth + "px";
//    } else {
//      menu.style.left = clickCoordsX + "px";
//    }
//  
//    if (windowHeight - clickCoordsY < menuHeight) {
//      menu.style.top = windowHeight - menuHeight + "px";
//    } else {
//      menu.style.top = clickCoordsY + "px";
//    }
//  }
//
//  // Event Listener for Close Context Menu when outside of menu clicked
//document.addEventListener("click", (e) => {
//    var button = e.which || e.button;
//    if (button === 1) {
//      toggleMenuOff();
//    }
//  });
//  
//  // Close Context Menu on Esc key press
//  window.onkeyup = function (e) {
//    if (e.keyCode === 27) {
//      toggleMenuOff();
//    }
//  };
//
//
//
//
//




    // fixed object group
    const fixedObjectGroup = new THREE.Group();
    scene.add(fixedObjectGroup);
    // Add ambient light to the scene
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    // Add a directional light to the scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // White light, 50% intensity
    directionalLight.position.set(1, 1, 1); // Set the direction of the light
    scene.add(directionalLight);

    // sphere
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated

        if (values.length === 3) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            const z = parseFloat(values[2]);

            const radius = 0.03; // Kürelerin yarıçapı
            const widthSegments = 32; // Kürenin yüzey bölümleri
            const heightSegments = 32; // Kürenin yükseklik bölümleri

            const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
            const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            scene.add(sphere);

            

        }
    });
    
    camera.position.z = 5;

    const animate = () => {
        requestAnimationFrame(animate);

    // Update controls for both cameras
    controls.update();
    controls2.update();

    // Update the position and target of camera2 based on camera1
    camera2.position.copy(camera.position);
    camera2.position.sub(controls.target);
    camera2.position.setLength(CAM_DISTANCE);
    camera2.lookAt(scene2.position);

    // Render both scenes with their respective cameras and renderers
    renderer.render(scene, camera);
    renderer2.render(scene2, camera2);
    };

    animate();

});



















