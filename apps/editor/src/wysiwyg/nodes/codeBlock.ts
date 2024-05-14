import { ProsemirrorNode, DOMOutputSpec } from 'prosemirror-model';
import { setBlockType, Command } from 'prosemirror-commands';

import { addParagraph, createTextNode, createTextSelection } from '@/helper/manipulation';
import { between, last } from '@/utils/common';
import NodeSchema from '@/spec/node';
import { getCustomAttrs, getDefaultCustomAttrs } from '@/wysiwyg/helper/node';

import { EditorCommand } from '@t/spec';
import { getRangeInfo } from '@/markdown/helper/pos';

export class CodeBlock extends NodeSchema {
  get name() {
    return 'codeBlock';
  }

  get schema() {
    return {
      content: 'text*',
      group: 'block',
      attrs: {
        language: { default: null },
        rawHTML: { default: null },
        ...getDefaultCustomAttrs(),
      },
      code: true,
      defining: true,
      marks: '',
      parseDOM: [
        {
          tag: 'pre',
          preserveWhitespace: 'full' as const,
          getAttrs(dom: Node | string) {
            const rawHTML = (dom as HTMLElement).getAttribute('data-raw-html');
            const child = (dom as HTMLElement).firstElementChild;

            return {
              language: child?.getAttribute('data-language') || null,
              ...(rawHTML && { rawHTML }),
            };
          },
        },

      ],
      toDOM({ attrs }: ProsemirrorNode): DOMOutputSpec {
        return [
          attrs.rawHTML || 'pre',
          ['code', { 'data-language': attrs.language, ...getCustomAttrs(attrs) }, 0],
        ];
      },
    };
  }

  commands(): EditorCommand {
    return () => (state, dispatch) => {
      const { selection, schema, tr } = state;
      const { from, to, startFromOffset, endToOffset } = getRangeInfo(selection);
      const rangeInfo = getRangeInfo(selection);

      let nodeType;

      if (selection.$from.parent.type.name === 'codeBlock' && selection.$to.parent.type.name === 'codeBlock' && selection.content().content.content.length <= 1) { // selection is inside code block
        const codeBlock = selection.$from.parent;
        // search  backward from 'from' for the first occurence of \n in  codeBlockText
        let start = from;
        let end = to;

        while (start > startFromOffset && codeBlock.textBetween(start - startFromOffset - 1, start - startFromOffset) !== '\n') {
          start -= 1;
        }
        // search forward from 'to' for the first occurence of \n in  codeBlockText
        while (end < endToOffset && codeBlock.textBetween(end - startFromOffset, end - startFromOffset + 1) !== '\n') {
          end += 1;
        }

        tr.delete(start - 1, end + 1); // delete the selected text

        if (start !== startFromOffset && end !== endToOffset) {
          tr.split(start - 1);
        }

        let lines = 0;

        codeBlock.textBetween(start - startFromOffset, end - startFromOffset).split('\n').reverse().forEach((line) => {
          if (line !== '') {
            lines += 1;
            tr.insert(start - 1, schema.nodes.paragraph.create({}, schema.text(line)));
          }
        });
        tr.setSelection(createTextSelection(tr, start, end + lines)); // set the cursor to the start of the deleted text

      }

      else {
        nodeType = schema.nodes.codeBlock;
        if (from !== to) {
          const fragments = selection.content().content;
          const insertedText = fragments.content.map((node: ProsemirrorNode) => {
            let text='';
            
            if (node.type.name === 'orderedList' || node.type.name === 'bulletList' || node.name === 'listItem') {
              const childNodes: Node[] = node.content.content;
              
              text = childNodes.map((childNode: Node) => childNode.textContent).join('\n');
            }
            else {
              text = node.textContent;
            }
            return text;
          }).join('\n');
          const fencedNode = createTextNode(schema, insertedText);

          tr.replaceSelectionWith(fencedNode);
          tr.setSelection(createTextSelection(tr, from, from + insertedText.length + 1));
        }
      }

      dispatch!(tr);
      state = state.apply(tr);
      return setBlockType(nodeType)(state, dispatch);
    };
  }

  moveCursor(direction: 'up' | 'down'): Command {
    return (state, dispatch) => {
      const { tr, doc, schema } = state;
      const { $from } = state.selection;
      const { view } = this.context;

      if (view!.endOfTextblock(direction) && $from.node().type.name === 'codeBlock') {
        const lines: string[] = $from.parent.textContent.split('\n');

        const offset = direction === 'up' ? $from.start() : $from.end();
        const range =
          direction === 'up'
            ? [offset, lines[0].length + offset]
            : [offset - last(lines).length, offset];
        const pos = doc.resolve(direction === 'up' ? $from.before() : $from.after());
        const node = direction === 'up' ? pos.nodeBefore : pos.nodeAfter;

        if (between($from.pos, range[0], range[1]) && !node) {
          const newTr = addParagraph(tr, pos, schema);

          if (newTr) {
            dispatch!(newTr);
            return true;
          }
        }
      }

      return false;
    };
  }

  keymaps() {
    const codeCommand = this.commands()();

    return {
      'Shift-Mod-p': codeCommand,
      'Shift-Mod-P': codeCommand,
      ArrowUp: this.moveCursor('up'),
      ArrowDown: this.moveCursor('down'),
    };
  }
}
