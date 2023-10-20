const { ipcRenderer } = require('electron');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileO');
    const dxInput = document.getElementById('dxInput');
    readFile.addEventListener('click', async () => {
        const filePath = 'C:/Users/suuser/Desktop/PDTO4/topology/builtmesh/solidR2.msh'; // Replace with the actual file path
        //const dirPath = "C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/topology/builtmeshallit";
        ipcRenderer.send('read-file2', filePath);
    });
});

// to get dx 
let dx;
ipcRenderer.on('get-dxO', (event, data) => {    
    dx = data;
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
    if (dx) {
        console.log('dx:',dx);
    }
   // console.log(lines);
    // Create a scene, camera, and renderer
    const scene = new THREE.Scene();  
    const scene2 = new THREE.Scene();
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0); // z axis 
    scene.background = new THREE.Color( "#ffffff" );    
    scene2.background = new THREE.Color( "#ffffff" );    
    // Get the container element by its class name
    const container = document.querySelector('.topology-part');   
    const container2 = document.querySelector('.corner-boxO');
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
    // Create OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    const controls2 = new OrbitControls(camera2, renderer2.domElement);

    const axesHelper = new THREE.AxesHelper( 5 );
    scene2.add( axesHelper );

    let currentAxis = 'none';

    document.onclick = hideMenu;
    document.oncontextmenu = rightClick;
      
    function hideMenu() {
        document.getElementById("contextMenuO")
                .style.display = "none"
    }
    
    function rightClick(e) {
        e.preventDefault();
        if (document.getElementById("contextMenuO")
                .style.display == "block")
            hideMenu();
        else{
            var menu = document.getElementById("contextMenuO")
                
            menu.style.display = 'block';
            menu.style.left = e.pageX + "px";
            menu.style.top = e.pageY + "px";

            // click x-axis
            document.getElementById("x-axis").addEventListener('click', function(e) {
                e.preventDefault();
                currentAxis = 'x';
                alert('clicked x axis');
                hideMenu();
            });
    
            // click y-axis
            document.getElementById("y-axis").addEventListener('click', function(e) {
                e.preventDefault();
                currentAxis = 'y';
                alert('clicked y axis');
                hideMenu();
            });

            // click x-axis
            document.getElementById("z-axis").addEventListener('click', function(e) {
                e.preventDefault();
                currentAxis = 'z';
                alert('clicked z axis');
                hideMenu();
            }); 
        }
    }  
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

    
    const radius = dx/2; // Radius of spheres  
    const widthSegments = 32; // Surface parts of the sphere
    const heightSegments = 32; // Height divisions of the sphere
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

    // SPHERE
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated

        if (values.length === 3) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            const z = parseFloat(values[2]);
            
            const sphere = new THREE.Mesh(geometry, material);
           
            switch (currentAxis) {
                case 'x':
                    sphere.position.set(x, 0, 0);
                    break;
                case 'y':
                    sphere.position.set(0, y, 0);
                    break;
                case 'z':
                    sphere.position.set(0, 0, z);
                    break;
                default:
                    sphere.position.set(x, y, z);
                    break;
            }   
            scene.add(sphere);
        }
    });
    geometry.dispose();
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
  
  

















