
    let camera, scene, renderer, controls;
    let particleTypes;
    let particleBoundary = new THREE.Vector3(70, 35, 70);
    let maxVelocity = .1;
    let boundaryMesh;
    let originalCameraPosition;
    let originalCameraQuaternion;
    let isAttachedToParticle = false;
    let attachedParticleIndex = -1;
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
    document.addEventListener('DOMContentLoaded', () => {
        const viewToggle = document.getElementById('view-toggle');
        if (viewToggle) {
            viewToggle.addEventListener('click', toggleAttachmentToParticle);
        }
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

let debugCube = setupHelper();  
function updateCamera() {
    if (isAttachedToParticle) {
        const attachedParticleTypeData = particleTypes[attachedParticleType];
        const attachedParticlePosition = attachedParticleTypeData.positions[attachedParticleIndex];
        const attachedParticleVelocity = attachedParticleTypeData.velocity[attachedParticleIndex];
        const followDistance = 30; 
        const elevation = 20; 
        const cameraOffset = attachedParticleVelocity.clone().normalize().multiplyScalar(-followDistance);
        const targetPosition = attachedParticlePosition.clone().add(cameraOffset);
        targetPosition.y += elevation;     
        const smoothingFactor = 0.05;
        camera.position.lerp(targetPosition, smoothingFactor);       
        controls.target.lerp(attachedParticlePosition, smoothingFactor);
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
function updateParticles() {
    const repelThreshold = 0.53;
    const maxRepelForce = 0.15;
    const boundaryPushBack = 0.05;
    const normalScale = new THREE.Vector3(1, 1, 1);
    const trackedScale = new THREE.Vector3(2, 2, 2);
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
}
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    function render() {
        renderer.render(scene, camera);
    }
