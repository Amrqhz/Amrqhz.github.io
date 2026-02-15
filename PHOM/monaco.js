// Initialize CodeMirror editor
const editor = CodeMirror.fromTextArea(document.getElementById("codee"), {
    mode: {
        name: "python",
        version: 3,
        singleLineStringErrors: false
    },
    theme: "dracula", // Optional theme
    lineNumbers: false,
    indentUnit: 4,
    matchBrackets: true
});

// Set initial code
editor.setValue("print('Hello from Python in the browser!')\nimport math\nprint(math.sqrt(16))");

const output = document.getElementById("output");
output.value = "Initializing Pyodide...\n";

// Load Pyodide
async function main() {
    let pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/"
    });
    output.value += "Pyodide ready!\n";
    return pyodide;
}

let pyodideReadyPromise = main();

// Add output helper
function addToOutput(stdout) {
    output.value += ">>> " + stdout + "\n";
}

// Clear output
function clearHistory() {
    output.value = "";
}

// Evaluate Python code
async function evaluatePython() {
    let pyodide = await pyodideReadyPromise;
    try {
        // Redirect stdout
        pyodide.runPython(`
            import io
            import sys
            sys.stdout = io.StringIO()
        `);
        // Run the code
        pyodide.runPython(editor.getValue());
        // Get stdout
        let stdout = pyodide.runPython("sys.stdout.getvalue()");
        addToOutput(stdout);
    } catch (err) {
        addToOutput(err);
    }
}