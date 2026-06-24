import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { JsxOpeningElement, JsxSelfClosingElement } from 'ts-morph'

import type { UiElementKind, UiElementNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

/**
 * Discover user-facing JSX elements — buttons, forms, tables, dialogs/modals —
 * by tag/component name (and visible text for buttons). This feeds later
 * user-flow / product-knowledge generation; it does not render anything.
 */
export function extractUiElements(ctx: ExtractContext): UiElementNode[] {
  const elements: UiElementNode[] = []

  for (const sf of ctx.sourceFiles) {
    const ext = path.extname(sf.getFilePath())
    if (ext !== '.tsx' && ext !== '.jsx') continue
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    let idx = 0

    const handle = (tag: string, node: JsxOpeningElement | JsxSelfClosingElement) => {
      const kind = classify(tag)
      if (!kind) return
      const label = kind === 'button' ? buttonLabel(node) || tag : prettyLabel(tag, kind)
      elements.push({
        id: makeId('ui', relPath, kind, String(idx++)),
        kind,
        label,
        filePath: relPath,
        componentId: null,
      })
    }

    for (const open of sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
      handle(open.getTagNameNode().getText(), open)
    }
    for (const self of sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) {
      handle(self.getTagNameNode().getText(), self)
    }
  }

  return elements
}

function classify(tag: string): UiElementKind | null {
  const t = tag.toLowerCase()
  if (t === 'button' || /button$/.test(t)) return 'button'
  if (t === 'form' || /form$/.test(t)) return 'form'
  if (t === 'table' || /table$/.test(t) || /datagrid$/.test(t)) return 'table'
  if (t === 'dialog' || /dialog$/.test(t) || /modal$/.test(t)) return 'dialog'
  return null
}

function buttonLabel(node: JsxOpeningElement | JsxSelfClosingElement): string | null {
  // Self-closing buttons have no children; try common label props.
  const propLabel = jsxStringProp(node, ['aria-label', 'label', 'title'])
  if (propLabel) return propLabel
  if (Node.isJsxSelfClosingElement(node)) return null

  const parent = node.getParentIfKind(SyntaxKind.JsxElement)
  if (!parent) return null
  const text = parent
    .getJsxChildren()
    .filter((c) => Node.isJsxText(c))
    .map((c) => c.getText().trim())
    .join(' ')
    .trim()
  return text || null
}

function jsxStringProp(
  node: JsxOpeningElement | JsxSelfClosingElement,
  names: string[]
): string | null {
  for (const attr of node.getAttributes()) {
    if (!Node.isJsxAttribute(attr)) continue
    const name = attr.getNameNode().getText()
    if (!names.includes(name)) continue
    const init = attr.getInitializer()
    if (init && Node.isStringLiteral(init)) return init.getLiteralText()
  }
  return null
}

function prettyLabel(tag: string, kind: UiElementKind): string {
  if (/^[a-z]/.test(tag)) return kind.charAt(0).toUpperCase() + kind.slice(1)
  return tag.replace(/([a-z])([A-Z])/g, '$1 $2')
}
