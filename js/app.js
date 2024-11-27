import { DoubleSide, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene, Texture, WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import getMaterial from './getMaterial';

export default class Sketch {
  constructor(options) {
    this.container = options.dom;
    this.scene = new Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new WebGPURenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      1000
    );
    this.camera.position.set(0, 0, 3.2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;


    this.mouse = { x: 0, y: 0 };
    this.time = 0;

    this.setupResize();
    this.resize();
    this.mouseEvents();
    this.addObjects();
    this.render()
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

  createASCIITexture() {
    let dict = "`.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@"
    this.length = dict.length;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // document.body.appendChild(canvas);

    canvas.width = this.length * 64;
    canvas.height = 64;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Menlo';
    ctx.textAlign = 'center';

    for(let i = 0; i < this.length; i++) {
      if(i > 50) {
        for(let j = 0; j < 6; j++) {
          ctx.filter = `blur(${j*0.5}px)`;
          ctx.fillText(dict[i], 32 + i * 64, 46);
        }
      }
      ctx.filter = 'none';
      ctx.fillText(dict[i], 32 + i * 64, 46);
    }

    let asciiTexture = new Texture(canvas);
    asciiTexture.needsUpdate = true;

    return asciiTexture;
  }

  addObjects() {
    this.material = new MeshBasicMaterial({
      color: 0x000000,
      side: DoubleSide,
      wireframe: true
    });

    this.material = getMaterial({
      asciiTexture: this.createASCIITexture(),
      length: this.length
    });

    let rows = 1024;
    let cols = 1024;
    let instances = rows * cols;
    let size = 0.005;

    this.geometry = new PlaneGeometry(size, size, 1, 1);

    this.positions = new Float32Array(instances * 3);
    this.colors = new Float32Array(instances * 3);
    let uv = new Float32Array(instances * 2);
    let random = new Float32Array(instances);
    this.instancedMesh = new InstancedMesh(this.geometry, this.material, instances);

    for(let i = 0; i < rows; i++) {
      for(let j = 0; j < cols; j++) {
        let index = (i * cols) + j;

        uv[index * 2] = i / (rows - 1);
        uv[index * 2 + 1] = j / (cols - 1);

        random[index] = Math.pow(Math.random(), 4)

        this.positions[index * 3] = i * size - size * (rows - 1) / 2;
        this.positions[index * 3 + 1] = j * size - size * (cols - 1) / 2;
        this.positions[index * 3 + 2] = 0;

        let m = new Matrix4();
        m.setPosition(this.positions[index * 3], this.positions[index * 3 + 1], this.positions[index * 3 + 2]);
        this.instancedMesh.setMatrixAt(index, m);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.geometry.setAttribute('aPixelUV', new InstancedBufferAttribute(uv, 2));
    this.geometry.setAttribute('aRandom', new InstancedBufferAttribute(random, 1));

    this.scene.add(this.instancedMesh);
  }

  render() {
    this.time += 0.015;

    this.controls.update();
    window.requestAnimationFrame(this.render.bind(this));
    this.renderer.renderAsync(this.scene, this.camera);
  }
}

new Sketch({ dom: document.getElementById('container') });