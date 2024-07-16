import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

export default class Sketch {
  constructor(options) {
    this.container = options.dom;
    this.scene = new Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x05233c, 1);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(70, this.width / this.height, 0.01, 1000);
    this.cameraParams = {
      intensity: 0.001,
      ease: 0.08
    }

    this.mouse = { x: 0, y: 0 };

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
      this.mouse.x = (e.clientX - window.innerWidth / 2) * this.cameraParams.intensity;
      this.mouse.y = (e.clientY - window.innerHeight / 2) * this.cameraParams.intensity;
    });
  }


  addObjects() {

  }

  render() {
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch({ dom: document.getElementById('container') });