import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import load from 'load-asset'

import vertex from './shader/vertexParticles.glsl';
import fragment from './shader/fragment.glsl';
import fragmentShaderPosition from './shader/fragmentPosition.glsl';
import fragmentShaderVelocity from './shader/fragmentVelocity.glsl';

import t1 from '../img/rz.png';
import t2 from '../img/2.png';
import PoissonDiskSampling from 'poisson-disk-sampling';

// 32 sqared will be the number of particles
const COUNT = 64;
const TEXTURE_WIDTH = COUNT**2;


export default class Sketch {
  constructor(options) {
    this.container = options.dom;
    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xEEEEEE, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      0.1,
      10
    );
    this.camera.position.set(0, 0, 4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;


    this.mouse = { x: 0, y: 0 };
    this.time = 0;

    this.initAll()
  }

  async initAll() {
    this.points1 = await this.getPoints(t1)
    this.points2 = await this.getPoints(t2)

    this.setupResize();
    this.resize();
    this.mouseEvents();
    this.addObjects();
    this.initGPU();
    this.render()
  }

  async getPoints(url) {
    const image = await load(url)

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = COUNT;
    canvas.height = COUNT;
    ctx.drawImage(image, 0, 0, COUNT, COUNT);

    let data = ctx.getImageData(0, 0, COUNT, COUNT).data;
    let array = new Array(COUNT).fill().map(() => new Array(COUNT).fill(0));

    for (let i = 0; i < COUNT; i++) {
      for (let j = 0; j < COUNT; j++) {
        let position = (i + j * COUNT) * 4;
        let color = data[position] / 255;

        array[i][j] = color;
      }
    }

    let pds = new PoissonDiskSampling({
      shape: [1, 1],
      minDistance: 2/400,
      maxDistance: 10/400,
      tries: 20,
      distanceFunction: function (point) {
        let indX = Math.floor(point[0] * COUNT)
        let indY = Math.floor(point[1] * COUNT)

        return array[indX][indY];
      },
      bias: 0,
    })

    let points = pds.fill();
    points.sort((a, b) => Math.random() - 0.5);
    points = points.slice(0, TEXTURE_WIDTH);

    points = points.map((point) => {
      let indX = Math.floor(point[0] * COUNT)
      let indY = Math.floor(point[1] * COUNT)

      return [point[0], point[1], array[indX][indY]];
    })

    return points;
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  mouseEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX - window.innerWidth / 2);
      this.mouse.y = (e.clientY - window.innerHeight / 2);
    });
  }


  addObjects() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        uPositions: { value: null },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
    })

    this.geometry = new THREE.BufferGeometry();
    let count = TEXTURE_WIDTH;
    let positions = new Float32Array(count * 3);
    let reference = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 5 * (Math.random() - 0.5);
      positions[i * 3 + 1] = 5 * (Math.random() - 0.5);
      positions[i * 3 + 2] = 0;

      reference[i * 2] = (i % COUNT) / COUNT;
      reference[i * 2 + 1] = ~ ~ (i / COUNT) / COUNT;
    }

    let positionAttribute = new THREE.BufferAttribute(positions, 3);
    this.geometry.setAttribute('position', positionAttribute);

    let referenceAttribute = new THREE.BufferAttribute(reference, 2);
    this.geometry.setAttribute('reference', referenceAttribute);

    this.plane = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  fillPositionTexture(texture) {
    let theArray = texture.image.data;

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      theArray[k + 0] = 2 * (Math.random() - 0.5);
      theArray[k + 1] = 2 * (Math.random() - 0.5);
      theArray[k + 2] = 0;
      theArray[k + 3] = 1;
    }
  }

  fillVelocityTexture(texture) {
    let theArray = texture.image.data;

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      theArray[k + 0] = 0.01 * (Math.random() - 0.5);
      theArray[k + 1] = 0.01 * (Math.random() - 0.5);
      theArray[k + 2] = 0;
      theArray[k + 3] = 1;
    }
  }

  fillPositionTextureFromPoints(texture, points) {
    let theArray = texture.image.data;

    for (let k = 0, kl = theArray.length; k < kl; k += 4) {
      let i = k / 4;

      theArray[k + 0] = 2 * (points[i][0] - 0.5);
      theArray[k + 1] = - 2 * (points[i][1] - 0.5);
      theArray[k + 2] = 0;
      theArray[k + 3] = points[i][2];
    }
  }

  initGPU() {
    this.gpuCompute = new GPUComputationRenderer(COUNT, COUNT, this.renderer);

    const dtPosition = this.gpuCompute.createTexture();
    const dtPosition1 = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();
    this.fillPositionTextureFromPoints(dtPosition, this.points1);
    this.fillPositionTextureFromPoints(dtPosition1, this.points2);
    this.fillVelocityTexture(dtVelocity);

    const target1 = this.gpuCompute.createTexture();
    const target2 = this.gpuCompute.createTexture();
    this.fillPositionTextureFromPoints(target1, this.points1);
    this.fillPositionTextureFromPoints(target2, this.points2);

    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', fragmentShaderVelocity, dtVelocity);
    this.positionVariable = this.gpuCompute.addVariable('texturePosition', fragmentShaderPosition, dtPosition);

    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms.time = { value: 0.0 };
    this.velocityUniforms.time = { value: 1.0 };
    this.velocityUniforms.uTarget = { value: target1 };

    this.velocityVariable.wrapS = THREE.RepeatWrapping;
    this.velocityVariable.wrapT = THREE.RepeatWrapping;
    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    let modul = 0;
    document.addEventListener("click", () => {
      console.log('click')
      if (modul == 0) {
        this.velocityUniforms.uTarget = { value: target2 };
        modul = 1;
      } else {
        this.velocityUniforms.uTarget = { value: target1 };
        modul = 0
      }
    })

    this.gpuCompute.init();
  }

  render() {
    this.time += 0.015;
    this.positionUniforms['time'].value = this.time;
    this.velocityUniforms['time'].value = this.time;

    this.gpuCompute.compute();

    this.material.uniforms.uPositions.value = this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    
    this.controls.update();
    window.requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({ dom: document.getElementById('container') });