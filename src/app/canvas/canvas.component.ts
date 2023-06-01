import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { Canvas } from 'fabric/fabric-impl';

export interface ObjectUserData {
  isDragging?: boolean;
  offset?: THREE.Vector3;
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('myCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private canvas! : HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private objLoader!: OBJLoader;
  private object!: THREE.Object3D;
  private mtlLoader!: MTLLoader;

  private mouseDown: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;

  private selectedObject: THREE.Object3D  & ObjectUserData | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();


  ngAfterViewInit(): void {
    this.initializeListeners()
    this.initializeMaterialLoader();
    this.initializeRenderer();
    this.initializeCamera();
    this.initializeScene();
    this.loadObject();
  }

  private initializeMaterialLoader() {
    this.mtlLoader = new MTLLoader();
  }

  private initializeListeners() {
    this.canvas = this.canvasRef.nativeElement;
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement });
    this.renderer.setSize(1200, 1000);
    this.renderer.setClearColor(0xffffff); // Set background color here
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    // const ambientLight = new THREE.AmbientLight(); // Add an ambient light with a brightness of 0.5

     // Set up a basic lighting
     const light = new THREE.DirectionalLight(0xffffff, 1);
     light.position.set(0, 1, 1).normalize();
     this.scene.add(light);

   
    // this.scene.add(ambientLight);
  }

  private initializeCamera(): void {
    this.camera = new THREE.PerspectiveCamera();
    this.camera.position.z = 5;
  }

  private loadObject(): void {
    this.objLoader = new OBJLoader();

    // Load the OBJ and MTL files here
    this.mtlLoader.load('./assets/IronMan/IronMan.mtl', (materials) => {
      materials.preload();

      this.objLoader.setMaterials(materials);
      this.objLoader.load('./assets/IronMan/IronMan.obj', (object) => {
        this.object = object;
        this.object.scale.set(0.01,0.01,0.01);
        this.scene.add(this.object);
        this.renderScene();
      });
    });

    this.mtlLoader.load('./assets/IronMan/IronMan.mtl', (materials) => {
      materials.preload();

      this.objLoader.setMaterials(materials);
      this.objLoader.load('./assets/IronMan/IronMan.obj', (object) => {
        this.object = object;
        this.object.scale.set(0.01,0.01,0.01);
        this.scene.add(this.object);
        this.renderScene();
      });
    });
    

    this.objLoader.load('./assets/sofa.OBJ', (object) => {
      const newMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Use any valid color value
      this.object = object;
      this.object.scale.set(0.01,0.01,0.01);
      this.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = newMaterial;
        }
      });
      this.scene.add(this.object);
      this.renderScene();
    });
  }

  private renderScene(): void {
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the wavefront object
      if (this.scene.children.length > 0) {
        const object = this.scene.children[0];
        object.rotation.y += 0.01;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  // OBJECT ROTATE
  private onMouseDown(event: MouseEvent): void {
    this.mouseDown = true;
    this.prevMouseX = event.clientX;
    this.prevMouseY = event.clientY;

    event.preventDefault();

    // Calculate normalized device coordinates (-1 to +1) for mouse position
    this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

    // Raycast from the camera to the clicked position
    // this.raycaster.setFromCamera(this.mouse, this.camera);
    // const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    // if (intersects.length > 0) {
    //   // Select the first intersected object
    //   this.selectedObject = intersects[0].object;
    //   (this.selectedObject.userData as any)['isDragging'] = true;
    // }

  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseDown = false;
    event.preventDefault();

    // Deselect the object and stop dragging
    // if (this.selectedObject !== null) {
    //   (this.selectedObject.userData as any)['isDragging'] = false;
    //   this.selectedObject = null;
    // }
  }

  private onMouseMove(event: MouseEvent): void {
    if (this.mouseDown) {
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      const deltaX = mouseX - this.prevMouseX;
      const deltaY = mouseY - this.prevMouseY;

      // this.rotateObject(deltaX, deltaY);
      this.rotateScene(deltaX, deltaY);

      this.prevMouseX = mouseX;
      this.prevMouseY = mouseY;
    }

    event.preventDefault();

    // Only proceed if an object is currently selected
    if (this.selectedObject !== null && (this.selectedObject.userData as any).isDragging === true) {
      // Calculate normalized device coordinates (-1 to +1) for mouse position
      this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

      // Raycast from the camera to the mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Get the intersection point with the plane
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(planeZ, intersection);

      if (intersection) {
        // Update the position of the selected object
        this.selectedObject.position.copy(intersection.sub((this.selectedObject.userData as any)['offset']));

      }
    }
  }


  // OBJECT MOVE
  // private onMouseDown(event: MouseEvent): void {
  //   event.preventDefault();

  // // Calculate normalized device coordinates (-1 to +1) for mouse position
  // this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
  // this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

  // // Raycast from the camera to the clicked position
  // this.raycaster.setFromCamera(this.mouse, this.camera);
  // const intersects = this.raycaster.intersectObjects(this.scene.children, true);

  // if (intersects.length > 0) {
  //   // Store the selected object
  //   this.selectedObject = intersects[0].object;
  //   this.selectedObject.userData["isDragging"] = true;

  //   // Calculate the offset between mouse position and object position
  //   const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  //   const intersection = new THREE.Vector3();
  //   this.raycaster.ray.intersectPlane(planeZ, intersection);
  //   this.selectedObject.userData["offset"] = intersection.sub(this.selectedObject.position);
  // }

  // }

  // private onMouseUp(event: MouseEvent): void {
  //   event.preventDefault();
  //   // Deselect the object and stop dragging
  //   if (this.selectedObject !== null) {
  //     (this.selectedObject.userData as any)['isDragging'] = false;
  //     this.selectedObject = null;
  //   }
  // }

  // private onMouseMove(event: MouseEvent): void {
  //   event.preventDefault();
  //   // Only proceed if an object is currently selected
  //   if (this.selectedObject !== null && (this.selectedObject.userData as any).isDragging === true) {
  //     // Calculate normalized device coordinates (-1 to +1) for mouse position
  //     this.mouse.x = (event.clientX / this.canvas.clientWidth) * 2 - 1;
  //     this.mouse.y = -(event.clientY / this.canvas.clientHeight) * 2 + 1;

  //     // Raycast from the camera to the mouse position
  //     this.raycaster.setFromCamera(this.mouse, this.camera);

  //     // Get the intersection point with the plane
  //     const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  //     const intersection = new THREE.Vector3();
  //     this.raycaster.ray.intersectPlane(planeZ, intersection);

  //     if (intersection) {
  //       // Update the position of the selected object
  //       this.selectedObject.position.copy(intersection.sub((this.selectedObject.userData as any)['offset']));

  //     }
  //   }
  // }

  private rotateObject(deltaX: number, deltaY: number): void {
    if (this.object) {
      this.object.rotation.y += deltaX * 0.01; // Adjust rotation speed as needed
      this.object.rotation.x += deltaY * 0.01; // Adjust rotation speed as needed
    }
  }

  private rotateScene(deltaX: number, deltaY: number): void {
    const rotationSpeed = 0.01; // Adjust rotation speed as needed

    this.camera.position.x += deltaX * rotationSpeed;
    this.camera.position.y += deltaY * rotationSpeed;

    this.camera.lookAt(this.scene.position);
  }

  public ngOnDestroy(): void {
    this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }

}
