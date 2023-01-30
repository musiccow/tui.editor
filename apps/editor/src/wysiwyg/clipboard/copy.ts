import { DOMSerializer, ProsemirrorNode, Schema } from 'prosemirror-model';

export function changeCopied(schema: Schema) {
  const base = DOMSerializer.fromSchema(schema);
  const clipboardSerializer = new DOMSerializer(
    Object.assign({}, base.nodes, {
      // table,
      paragraph,
      tableHeadCell,
      tableBodyCell,
      codeBlock,
      blockQuote,
      // listItem,
      // heading,
    }),
    Object.assign({}, base.marks, {
      code,
      strike,
    })
  );

  return clipboardSerializer;
}
function table(node: ProsemirrorNode) {
  const style =
    'margin: 12px 0 14px;color: #222;width: auto;border-collapse: collapse;box-sizing: border-box;';

  return ['table', { style }, 0];
}

function tableHeadCell(node: ProsemirrorNode) {
  const style =
    'background-color: #555;   font-weight: 300; color: #fff; padding: 5px 14px 5px 12px; height: 32px; border: 1px solid #666;';

  return ['th', { style }, 0];
}

function tableBodyCell(node: ProsemirrorNode) {
  const style = 'padding: 5px 14px 5px 12px; height: 32px; border: 1px solid #BBB;';

  return ['td', { style }, 0];
}

function code(node: ProsemirrorNode) {
  const style =
    'color: #c1798b;background-color: #f9f2f4;padding: 2px 3px;letter-spacing: -0.3px;border-radius: 2px;';

  return ['code', { style }, 0];
}

function codeBlock({ attrs }: ProsemirrorNode) {
  const style = 'margin: 2px 0 8px; padding: 18px;background-color: #f4f7f8;';

  return [attrs.rawHTML || 'pre', { style }, ['code', { 'data-language': attrs.language }, 0]];
}
function blockQuote({ attrs }: ProsemirrorNode) {
  const style = 'margin: 14px 0;border-left: 4px solid #e5e5e5;padding: 0 16px;color: #999;';

  return ['blockquote', { style }, 0];
}

function strike(node: ProsemirrorNode) {
  const style = 'color: #999';

  return ['s', { style }];
}
function paragraph(node: ProsemirrorNode) {
  const style = 'margin: 2px 0;';

  return ['p', {}, 0];
}

function heading({ attrs }: ProsemirrorNode) {
  const style = 'margin: 2px 0;';

  return [`h${attrs.level}`, getHeadingAttrs(attrs.level), 0];
}

function getHeadingAttrs(level: number) {
  const style = `font-size:${24 - level * 2}px;font-weight:bold; color: #222;`;

  return {};
}

function listItem({ attrs }: ProsemirrorNode) {
  const { task, checked } = attrs;

  if (!task) {
    return [attrs.rawHTML || 'li', 0];
  }

  const classNames = ['task-list-item'];

  if (checked) {
    classNames.push('checked');
  }

  return [
    attrs.rawHTML || 'li',
    {
      class: classNames.join(' '),
      'data-task': task,
      style: 'display: flex;',
      ...(checked && { 'data-task-checked': checked }),
    },
    [
      'input',
      {
        type: 'checkbox',
        style: 'display: flex',
        ...(checked && { checked }),
      },
    ],
    ['label', {}, 0],
  ];
}
