import { useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

const OPTIONS = {
    automaticLayout: true,
    fontSize: 15,
    lineHeight: 23,
    minimap: { enabled: false },
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    wordWrap: "on",
    tabSize: 4,
    insertSpaces: true,
    bracketPairColorization: { enabled: true },
    renderWhitespace: "selection",
    smoothScrolling: true,
    cursorBlinking: "smooth",
    renderLineHighlight: "all"
};

/**
 * Monaco wrapper. `onRun` is called with the editor's current text when the
 * player presses Ctrl/Cmd + Enter inside the editor. It's registered as a
 * Monaco command because Monaco handles that shortcut itself
 * ("insert line below") before the page ever sees the key event.
 */
const LINE_HEIGHT = OPTIONS.lineHeight;
const MIN_LINES = 8;
const MAX_LINES = 24;

/** Fit the editor to the code (plus room to type), within sensible bounds. */
function heightFor(value) {
    const lines = Math.min(MAX_LINES, Math.max(MIN_LINES, value.split("\n").length + 3));
    return `${lines * LINE_HEIGHT + OPTIONS.padding.top + OPTIONS.padding.bottom}px`;
}

export default function Editor({ value, onChange, onRun, language = "python", readOnly = false }) {
    const onRunRef = useRef(onRun);
    onRunRef.current = onRun;
    const height = heightFor(value);

    function handleMount(editor, monaco) {
        editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => onRunRef.current?.(editor.getValue())
        );
    }

    return (
        <div className="code-editor">
            <MonacoEditor
                height={height}
                language={language}
                theme="vs-dark"
                value={value}
                onChange={(next) => onChange?.(next ?? "")}
                onMount={handleMount}
                options={{ ...OPTIONS, readOnly, domReadOnly: readOnly }}
                loading={<div className="editor-loading">Loading editor…</div>}
            />
        </div>
    );
}
