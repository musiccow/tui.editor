import { DOMSerializer, ProsemirrorNode, Schema, Slice } from "prosemirror-model";
import { EditorView } from "prosemirror-view";


export function changeCopied(schema: Schema) {
    const base = DOMSerializer.fromSchema(schema);
    const clipboardSerializer = new DOMSerializer(Object.assign({}, base.nodes, {
        tableBodyCell:tableBodyCellChangeCopied,
    }), base.marks)
    
    return clipboardSerializer;
}

function tableBodyCellChangeCopied(node: ProsemirrorNode) { 
    return ["td",0]
}