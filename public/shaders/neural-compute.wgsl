// Neural Echo - Core neural node simulation compute shader
// This shader handles node lifecycle management, activation interpolation, and pulsing effects

struct Node {
    position: vec3<f32>,
    velocity: vec3<f32>,
    activation: f32,
    targetActivation: f32,
    size: f32,
    targetSize: f32,
    color: vec3<f32>,
    lifetime: f32,
    nodeType: u32,
    importance: f32,
    connections: u32,
    padding: f32
}

struct SimulationParams {
    deltaTime: f32,
    time: f32,
    activationSpeed: f32,
    pulseFactor: f32,
    dampingFactor: f32,
    nodeCount: u32,
    maxConnections: u32,
    padding: f32
}

@group(0) @binding(0) var<storage, read_write> nodes: array<Node>;
@group(0) @binding(1) var<uniform> params: SimulationParams;

// Smooth interpolation function
fn smoothStep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}

// Generate organic pulsing pattern
fn calculatePulse(nodeIndex: u32, time: f32, activation: f32) -> f32 {
    let baseFreq = 2.0;
    let nodeOffset = f32(nodeIndex) * 0.1;
    let activationInfluence = activation * 1.5 + 0.5;
    
    let pulse1 = sin(time * baseFreq + nodeOffset) * 0.5 + 0.5;
    let pulse2 = sin(time * baseFreq * 0.7 + nodeOffset * 1.3) * 0.3 + 0.3;
    
    return (pulse1 * 0.7 + pulse2 * 0.3) * activationInfluence;
}

// Update node activation with smooth interpolation
fn updateActivation(node: ptr<function, Node>, deltaTime: f32) {
    let activationDiff = (*node).targetActivation - (*node).activation;
    let interpolationSpeed = params.activationSpeed * deltaTime;
    
    // Exponential interpolation for more organic feel
    (*node).activation += activationDiff * interpolationSpeed;
    
    // Clamp to valid range
    (*node).activation = clamp((*node).activation, 0.0, 1.0);
}

// Update node size based on activation and pulsing
fn updateSize(node: ptr<function, Node>, nodeIndex: u32, time: f32) {
    let pulse = calculatePulse(nodeIndex, time, (*node).activation);
    let baseSizeMultiplier = 1.0 + (*node).activation * 0.5;
    let pulseMultiplier = 1.0 + pulse * params.pulseFactor * 0.3;
    
    (*node).size = (*node).targetSize * baseSizeMultiplier * pulseMultiplier;
}

// Apply physics simulation for organic movement
fn updatePhysics(node: ptr<function, Node>, nodeIndex: u32, deltaTime: f32) {
    // Add subtle floating movement based on activation
    let floatStrength = (*node).activation * 0.1;
    let floatOffset = vec3<f32>(
        sin(params.time * 0.5 + f32(nodeIndex) * 0.3) * floatStrength,
        cos(params.time * 0.3 + f32(nodeIndex) * 0.7) * floatStrength,
        sin(params.time * 0.7 + f32(nodeIndex) * 0.5) * floatStrength * 0.5
    );
    
    // Apply gentle damping to velocity
    (*node).velocity *= params.dampingFactor;
    
    // Add floating motion
    (*node).velocity += floatOffset * deltaTime;
    
    // Update position
    (*node).position += (*node).velocity * deltaTime;
}

// Update node color based on activation and type
fn updateColor(node: ptr<function, Node>, nodeIndex: u32) {
    let baseColor = (*node).color;
    let activationInfluence = (*node).activation * 0.5 + 0.5;
    let pulse = calculatePulse(nodeIndex, params.time, (*node).activation);
    
    // Enhance color saturation based on activation
    let enhancedColor = baseColor * activationInfluence;
    
    // Add pulsing brightness variation
    let brightness = 1.0 + pulse * 0.2;
    
    (*node).color = enhancedColor * brightness;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let nodeIndex = global_id.x;
    
    // Bounds checking
    if (nodeIndex >= params.nodeCount) {
        return;
    }
    
    var node = nodes[nodeIndex];
    
    // Update node lifecycle
    updateActivation(&node, params.deltaTime);
    updateSize(&node, nodeIndex, params.time);
    updatePhysics(&node, nodeIndex, params.deltaTime);
    updateColor(&node, nodeIndex);
    
    // Update lifetime
    node.lifetime += params.deltaTime;
    
    // Write back updated node
    nodes[nodeIndex] = node;
}