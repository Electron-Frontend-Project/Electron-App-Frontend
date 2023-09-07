import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


fetch('http://localhost:8080/api/TJS')
  .then(response => response.text()) // Ensure you're receiving text data
  .then(tsvData => {
    // TSV verilerini satırlara böler
    const lines = tsvData.split('\n');

    // Three.js sahnesi oluştur
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const container = document.getElementById('scene-container');
	const controls = new OrbitControls(camera, renderer.domElement);
	container.appendChild(renderer.domElement);

    // sphere
    lines.forEach(line => {
        const values = line.split('\t'); // tab seperated

        if (values.length === 3) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            const z = parseFloat(values[2]);

            const radius = 0.1/5; // Kürelerin yarıçapı
            const widthSegments = 32; // Kürenin yüzey bölümleri
            const heightSegments = 32; // Kürenin yükseklik bölümleri

            const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            scene.add(sphere);
        }
    });

    camera.position.z = 5;
	controls.update();
    const animate = () => {
        requestAnimationFrame(animate);
		controls.update();
        renderer.render(scene, camera);
    };

    animate();
  })
  .catch(error => {
    console.error('Verileri alırken hata oluştu:', error);
  });