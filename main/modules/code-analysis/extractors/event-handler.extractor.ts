import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { JsxAttribute } from 'ts-morph'

import type { EventHandlerNode } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

const EVENT_ATTR = /^on[A-Z]/

/**
 * Discover event handlers: JSX attributes like `onClick`, `onSubmit`,
 * `onChange`, etc., plus the function/expression they invoke. The handler text
 * is captured (identifier, arrow body, or call) for flow/action inference.
 */
export function extractEventHandlers(ctx: ExtractContext): EventHandlerNode[] {
  const handlers: EventHandlerNode[] = []

  for (const sf of ctx.sourceFiles) {
    const ext = path.extname(sf.getFilePath())
    if (ext !== '.tsx' && ext !== '.jsx') continue
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))

    for (const attr of sf.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
      const event = attr.getNameNode().getText()
      if (!EVENT_ATTR.test(event)) continue
      const handler = handlerText(attr)
      if (!handler) continue
      handlers.push({
        id: makeId('evt', relPath, event, handler, String(attr.getStartLineNumber())),
        name: `${event} → ${handler}`,
        type: 'event-handler',
        event,
        handler,
        filePath: relPath,
        lineNumber: attr.getStartLineNumber(),
      })
    }
  }

  return handlers
}

function handlerText(attr: JsxAttribute): string | null {
  const init = attr.getInitializer()
  if (!init || !Node.isJsxExpression(init)) return null
  const expr = init.getExpression()
  if (!expr) return null
  if (Node.isIdentifier(expr) || Node.isPropertyAccessExpression(expr)) return expr.getText()
  if (Node.isArrowFunction(expr) || Node.isFunctionExpression(expr)) {
    // Name the call inside the arrow body if there is one, else mark inline.
    const call = expr.getFirstDescendantByKind(SyntaxKind.CallExpression)
    return call ? call.getExpression().getText() : '(inline)'
  }
  if (Node.isCallExpression(expr)) return expr.getExpression().getText()
  return expr.getText().slice(0, 40)
}
