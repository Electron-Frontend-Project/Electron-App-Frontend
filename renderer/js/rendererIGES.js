import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";


import { IGESLoader } from "./IGES/IGESLoader.js";
const { log } = require("console");

const fs = require('fs');
const sceneGeometry = new THREE.Scene();
const loader = new IGESLoader();

const iges_file_path = "C:Users/suuser/Desktop/Electron-Github/Electron-App-Frontend/ex1.iges";

loader.load(
  // resource URL
  iges_file_path,
  // called when load is complete
  function (object) {
    console.log("IGES file loaded successfully!");
    sceneGeometry.add(object);
  },
  // called when loading is in progress
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("Error: " + error);
  }
);



