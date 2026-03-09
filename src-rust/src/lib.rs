use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Node {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Connection {
    pub source_id: String,
    pub target_id: String,
}

#[wasm_bindgen]
pub struct OpenCodeAnalyzer {
    // Rust-specific analysis state
}

#[wasm_bindgen]
impl OpenCodeAnalyzer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {}
    }

    /// Analyzes Rust source code for dependencies (use statements, traits, etc.)
    pub fn analyze_rust_dependencies(&self, code: &str) -> Vec<String> {
        let mut deps = Vec::new();
        for line in code.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("use ") {
                let dep = trimmed
                    .trim_start_matches("use ")
                    .trim_end_matches(';')
                    .to_string();
                deps.push(dep);
            }
        }
        deps
    }

    /// Suggests a layout for a set of nodes based on their connections
    pub fn calculate_auto_layout(
        &self,
        nodes: JsValue,
        connections: JsValue,
    ) -> Result<JsValue, JsValue> {
        let mut nodes: Vec<Node> = serde_wasm_bindgen::from_value(nodes)?;
        let connections: Vec<Connection> = serde_wasm_bindgen::from_value(connections)?;

        // Simple grid-based layout algorithm (placeholder for more complex Rust logic)
        let mut current_x = 0.0;
        let mut current_y = 0.0;
        let spacing = 100.0;

        for node in nodes.iter_mut() {
            node.x = current_x;
            node.y = current_y;
            current_x += node.width + spacing;
            if current_x > 2000.0 {
                current_x = 0.0;
                current_y += node.height + spacing;
            }
        }

        Ok(serde_wasm_bindgen::to_value(&nodes)?)
    }
}

#[wasm_bindgen]
pub fn greet_rust() -> String {
    "Hello from OpenCode Rust Core!".to_string()
}
