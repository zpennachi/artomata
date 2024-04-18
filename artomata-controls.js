
        const keys = {}; // Initialize keys object

        let camera, scene, renderer, controls;
        let particleTypes;
        let particleBoundary = new THREE.Vector3(40, 25, 40);
        let maxVelocity = .1;
        let boundaryMesh;
        let originalCameraPosition;
        let originalCameraQuaternion;
        let isAttachedToParticle = false;
       
    let attachedParticleType = ""; // Initialize attachedParticleType variable
let attachedParticleIndex = -1; // Initialize attachedParticleIndex variable

        init();
        animate();

        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 0, particleBoundary.z * .50);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1, 1, 1);
            directionalLight.castShadow = true;
            scene.add(directionalLight);
            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight2.position.set(-1, -1, -1);
            directionalLight2.castShadow = true;
            scene.add(directionalLight2);
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 1.25;
            controls.screenSpacePanning = false;
            setupParticles();
            setupBoundary();
            window.addEventListener('resize', onWindowResize, false);
          
          // Add event listeners for keydown and keyup events
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Function to handle keydown events
function handleKeyDown(event) {
    keys[event.key] = true;
}

// Function to handle keyup events
function handleKeyUp(event) {
    keys[event.key] = false;
}
            document.getElementById('toggle-btn').addEventListener('click', toggleAttachmentToParticle);
          
          document.getElementById('green-particles').addEventListener('input', function(e) {
  adjustParticleCount('green', parseInt(e.target.value));
});
document.getElementById('red-particles').addEventListener('input', function(e) {
  adjustParticleCount('red', parseInt(e.target.value));
});
document.getElementById('blue-particles').addEventListener('input', function(e) {
  adjustParticleCount('blue', parseInt(e.target.value));
});
document.getElementById('yellow-particles').addEventListener('input', function(e) {
  adjustParticleCount('yellow', parseInt(e.target.value));
});

        }

        function setupBoundary() {
            const boundaryGeometry = new THREE.BoxGeometry(particleBoundary.x *2, particleBoundary.y * 2, particleBoundary.z * 2);
            const boundaryMaterial = new THREE.MeshBasicMaterial({ color: 0x304529, transparent: true, opacity: .0, side: THREE.BackSide });
            boundaryMesh = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            scene.add(boundaryMesh);
        }

        function toggleAttachmentToParticle() {
            if (isAttachedToParticle) {
                camera.position.copy(originalCameraPosition);
                camera.quaternion.copy(originalCameraQuaternion);
                controls.target.copy(new THREE.Vector3(0, 0, 0)); 
                isAttachedToParticle = false;
                controls.enabled = true;
            } else {
                const types = Object.keys(particleTypes);
                const randomTypeKey = types[Math.floor(Math.random() * types.length)];
                const randomType = particleTypes[randomTypeKey];
                const randomIndex = Math.floor(Math.random() * randomType.instances);
                attachedParticleType = randomTypeKey;
                attachedParticleIndex = randomIndex;
                originalCameraPosition = camera.position.clone();
                originalCameraQuaternion = camera.quaternion.clone();
                isAttachedToParticle = true;
                controls.enabled = true;
                controls.target.copy(particleTypes[randomTypeKey].positions[randomIndex]);
            }
            controls.update(); 
        }

        function animate() {
            renderer.setAnimationLoop(() => {
                updateBoundary(); 
                updateParticles();
                updateCamera();
                controls.update(); 
                render();
            });
        }  

    
    
 function handleCameraMovement() {
    const speed = 0.01; // Adjust as needed
    const moveDistance = speed; // Adjust as needed
    const moveVector = new THREE.Vector3();

    // Check for key presses
    if (keys["w"]) moveVector.z -= moveDistance;
    if (keys["s"]) moveVector.z += moveDistance;
    if (keys["a"]) moveVector.x -= moveDistance;
    if (keys["d"]) moveVector.x += moveDistance;

    // Rotate moveVector according to camera rotation
    moveVector.applyQuaternion(camera.quaternion);

    // Update camera position and target
    const smoothingFactor = 0.005;
    camera.position.add(moveVector);
    controls.target.add(moveVector.multiplyScalar(smoothingFactor));
}

function handleParticleMovement() {
    const speed = 0.7; // Adjust as needed
    const moveDistance = speed; // Adjust as needed
    const moveVector = new THREE.Vector3();

    // Check for key presses
    if (keys["w"] || keys["s"]) {
        if (keys["w"]) moveVector.z -= moveDistance;
        if (keys["s"]) moveVector.z += moveDistance;
    } else {
        moveVector.z = 0;
    }
    if (keys["a"] || keys["d"]) {
        if (keys["a"]) moveVector.x -= moveDistance;
        if (keys["d"]) moveVector.x += moveDistance;
    } else {
        moveVector.x = 0;
    }

    // Normalize the moveVector if moving diagonally
    if (moveVector.lengthSq() > 0) {
        moveVector.normalize().multiplyScalar(moveDistance);
    }

    // Update particle position based on movement
    if (attachedParticleType && attachedParticleIndex !== -1) {
        const attachedParticleTypeData = particleTypes[attachedParticleType];
        const attachedParticlePosition = attachedParticleTypeData.positions[attachedParticleIndex];
        attachedParticlePosition.add(moveVector);

        // Update particle velocity
        const attachedParticleVelocity = attachedParticleTypeData.velocity[attachedParticleIndex];
        attachedParticleVelocity.copy(moveVector);
    }
}


    
    
    
  function updateCamera() {
    if (isAttachedToParticle) {
        // Handling camera movement based on keys pressed
        handleCameraMovement();
        
        const attachedParticleTypeData = particleTypes[attachedParticleType];
        const attachedParticlePosition = attachedParticleTypeData.positions[attachedParticleIndex];
        const attachedParticleVelocity = attachedParticleTypeData.velocity[attachedParticleIndex];

        // Update camera position and target based on attached particle
        const followDistance = 25;
        const elevation = 25;
        const cameraOffset = attachedParticleVelocity.clone().normalize().multiplyScalar(-followDistance);
        const targetPosition = attachedParticlePosition.clone().add(cameraOffset);
        targetPosition.y += elevation;
        const smoothingFactor = 0.05;
        camera.position.lerp(targetPosition, smoothingFactor);
        controls.target.lerp(attachedParticlePosition, smoothingFactor);
        controls.update();
    } else {
        // Normal camera movement if not attached to a particle
        controls.update();
    }
}



        function setupParticles() {
            particleTypes = {
                green: { color: 0xaaf0d1, instances: 200, mesh: null, positions: [], velocity: [], rules: {} },
                red: { color: 0xffa07a, instances: 200, mesh: null, positions: [], velocity: [], rules: {} },
                blue: { color: 0x87ceeb, instances: 200, mesh: null, positions: [], velocity: [], rules: {} },
                yellow: { color: 0xeedc82, instances: 200, mesh: null, positions: [], velocity: [], rules: {} }
            };
            Object.keys(particleTypes).forEach(key => {
                const type = particleTypes[key];
                const geometry = new THREE.SphereGeometry(0.18, 16, 16);         
                const material = new THREE.MeshStandardMaterial({ color: type.color });
                type.mesh = new THREE.InstancedMesh(geometry, material, type.instances);
                type.mesh.castShadow = true; 
                type.mesh.receiveShadow = true; 
                const dummy = new THREE.Object3D();
                for (let i = 0; i < type.instances; i++) {
                    const position = new THREE.Vector3(
                        (Math.random() * 2 - 1) * particleBoundary.x,
                        (Math.random() * 2 - 1) * particleBoundary.y,
                        (Math.random() * 2 - 1) * particleBoundary.z
                    );
                    type.positions.push(position);
                    type.velocity.push(new THREE.Vector3(0, 0, 0));
                    dummy.position.copy(position);
                    dummy.updateMatrix();
                    type.mesh.setMatrixAt(i, dummy.matrix);
                }

                scene.add(type.mesh);
            });
            document.querySelectorAll('select').forEach(select => select.addEventListener('change', updateRules));
            updateRules();
        }

        function updateRules() {
            Object.keys(particleTypes).forEach(type => {
                document.querySelectorAll(`#${type}-green, #${type}-red, #${type}-blue, #${type}-yellow`).forEach(select => {
                    const affectedType = select.id.split('-')[1];
                    particleTypes[type].rules[affectedType] = parseFloat(select.value);
                });
            });
        }

        function updateBoundary() {
            boundaryMesh.position.copy(camera.position);
            boundaryMesh.quaternion.copy(camera.quaternion);
        }
    
    
function updateParticleMesh(particleData) {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < particleData.instances; i++) {
        dummy.position.copy(particleData.positions[i]);
        dummy.scale.set(1, 1, 1);  // Active particles are fully visible
        dummy.updateMatrix();
        particleData.mesh.setMatrixAt(i, dummy.matrix);
    }
    for (let i = particleData.instances; i < particleData.mesh.count; i++) {
        dummy.position.copy(particleData.positions[i]);
        dummy.scale.set(0, 0, 0);  // Inactive particles are scaled down to zero
        dummy.updateMatrix();
        particleData.mesh.setMatrixAt(i, dummy.matrix);
    }
    particleData.mesh.instanceMatrix.needsUpdate = true;
}

function adjustParticleCount(type, newCount) {
    const particleData = particleTypes[type];
    if (newCount < particleData.instances) {
        // Particles are "removed" by scaling them to zero
    } else if (newCount > particleData.instances) {
        // Increase count, add particles
        for (let i = particleData.instances; i < newCount; i++) {
            if (i >= particleData.positions.length) {  // Check if new positions need to be added
                const position = new THREE.Vector3(
                    (Math.random() * 2 - 1) * particleBoundary.x,
                    (Math.random() * 2 - 1) * particleBoundary.y,
                    (Math.random() * 2 - 1) * particleBoundary.z
                );
                particleData.positions.push(position);
                particleData.velocity.push(new THREE.Vector3(0, 0, 0));
            }
        }
    }
    particleData.instances = newCount;
    updateParticleMesh(particleData);
}

    
    
function updateParticles() {
    const repelThreshold = 0.53;
    const maxRepelForce = 0.15;
    const boundaryPushBack = 0.05;
    const normalScale = new THREE.Vector3(1, 1, 1);
    const trackedScale = new THREE.Vector3(2, 2, 2);
    
    // Increase attraction force for active particles
    const activeAttractionMultiplier = 15.0; // Adjust as needed
    
    Object.keys(particleTypes).forEach(key => {
        const type = particleTypes[key];
        const dummy = new THREE.Object3D();
        for (let i = 0; i < type.instances; i++) {
            const position = type.positions[i];
            const velocity = type.velocity[i];
            for (let j = 0; j < type.instances; j++) {
                if (i !== j) {
                    const otherPosition = type.positions[j];
                    const direction = new THREE.Vector3().subVectors(position, otherPosition);
                    const distance = direction.length();
                    if (distance < repelThreshold && distance > 0) {
                        const strength = Math.min(maxRepelForce, maxRepelForce * (repelThreshold - distance) / distance);
                        direction.normalize().multiplyScalar(strength);
                        velocity.add(direction);
                    }
                }
            }
            Object.keys(particleTypes).forEach(otherKey => {
                if (key !== otherKey) {
                    const otherType = particleTypes[otherKey];
                    for (let j = 0; j < otherType.instances; j++) {
                        const tempVec3 = new THREE.Vector3().subVectors(position, otherType.positions[j]);
                        const distance = tempVec3.length();
                        if (distance < 10 && distance > 1) {
                            let influence = type.rules[otherKey] * (10 - distance) / distance;
                            if (i === attachedParticleIndex && key === attachedParticleType) {
                                // Increase attraction force for active particles
                                influence *= activeAttractionMultiplier;
                            }
                            tempVec3.normalize().multiplyScalar(influence);
                            velocity.add(tempVec3);
                        }
                    }
                }
            });
            ['x', 'y', 'z'].forEach(axis => {
                if (position[axis] > particleBoundary[axis]) {
                    position[axis] = particleBoundary[axis] - boundaryPushBack;
                    velocity[axis] = -Math.abs(velocity[axis]);
                } else if (position[axis] < -particleBoundary[axis]) {
                    position[axis] = -particleBoundary[axis] + boundaryPushBack;
                    velocity[axis] = Math.abs(velocity[axis]);
                }
            });
            velocity.clampLength(0, maxVelocity);
            position.add(velocity);
            dummy.position.copy(position);
            dummy.scale.copy(i === attachedParticleIndex && key === attachedParticleType ? trackedScale : normalScale);
            dummy.updateMatrix();
            type.mesh.setMatrixAt(i, dummy.matrix);
        }
        type.mesh.instanceMatrix.needsUpdate = true;
    });


    // Handle particle movement based on key presses
    const speed = 0.1; // Adjust as needed
    const moveDistance = speed; // Adjust as needed
    const moveVector = new THREE.Vector3();

    // Check for key presses
    if (keys["w"]) moveVector.z -= moveDistance;
    if (keys["s"]) moveVector.z += moveDistance;
    if (keys["a"]) moveVector.x -= moveDistance;
    if (keys["d"]) moveVector.x += moveDistance;

    // Update particle position based on movement
    if (attachedParticleType && attachedParticleIndex !== -1) {
        const attachedParticleTypeData = particleTypes[attachedParticleType];
        const attachedParticlePosition = attachedParticleTypeData.positions[attachedParticleIndex];
        attachedParticlePosition.add(moveVector);

        // Update particle velocity
        const attachedParticleVelocity = attachedParticleTypeData.velocity[attachedParticleIndex];
        attachedParticleVelocity.copy(moveVector);
    }
}


        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function render() {
            renderer.render(scene, camera);
        }
