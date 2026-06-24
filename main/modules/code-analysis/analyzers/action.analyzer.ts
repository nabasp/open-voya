import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'

import type {
  ActionCandidate,
  ApiNode,
  CrudOp,
  EventHandlerNode,
  FormNode,
  HttpMethod,
} from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from '../extractors/context'

const VERB_OP: Array<[RegExp, CrudOp]> = [
  [/^(create|add|new|save|insert|register|submit|post)/i, 'create'],
  [/^(get|fetch|load|list|find|read|query|search|show)/i, 'read'],
  [/^(update|edit|patch|put|change|set|toggle)/i, 'update'],
  [/^(delete|remove|destroy|del|clear)/i, 'delete'],
]

const METHOD_OP: Record<HttpMethod, CrudOp> = {
  GET: 'read',
  HEAD: 'read',
  OPTIONS: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
}

/**
 * Produce a DRAFT, pre-dedup list of candidate business actions inferred from
 * API calls, form submissions, event handlers, and CRUD-style naming. Later
 * stages dedupe/refine this; intentionally noisy and inclusive.
 */
export function analyzeActions(
  ctx: ExtractContext,
  inputs: { apis: ApiNode[]; forms: FormNode[]; eventHandlers: EventHandlerNode[] }
): ActionCandidate[] {
  const actions: ActionCandidate[] = []

  // From API calls/endpoints
  for (const api of inputs.apis) {
    actions.push({
      id: makeId('action', 'api', api.id),
      name: api.name,
      type: 'action',
      op: METHOD_OP[api.method] ?? 'unknown',
      source: 'api',
      filePath: api.filePath,
      lineNumber: api.lineNumber,
      detail: `${api.type} ${api.method} ${api.endpoint}`,
    })
  }

  // From form submissions
  for (const form of inputs.forms) {
    actions.push({
      id: makeId('action', 'form', form.id),
      name: `Submit ${form.name}`,
      type: 'action',
      op: 'create',
      source: 'form',
      filePath: form.filePath,
      lineNumber: form.lineNumber,
      detail: `${form.type} with ${form.fields.length} field(s)`,
    })
  }

  // From event handlers whose target name implies a CRUD verb
  for (const ev of inputs.eventHandlers) {
    const op = verbOp(ev.handler)
    if (!op) continue
    actions.push({
      id: makeId('action', 'handler', ev.id),
      name: ev.handler,
      type: 'action',
      op,
      source: 'handler',
      filePath: ev.filePath,
      lineNumber: ev.lineNumber,
      detail: `${ev.event} handler`,
    })
  }

  // From CRUD-style function/method naming across the source tree
  for (const sf of ctx.sourceFiles) {
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    for (const fn of sf.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)) {
      const name = fn.getName()
      const op = name ? verbOp(name) : null
      if (name && op) {
        actions.push(namingAction(relPath, name, op, fn.getStartLineNumber()))
      }
    }
    for (const m of sf.getDescendantsOfKind(SyntaxKind.MethodDeclaration)) {
      const name = m.getName()
      const op = verbOp(name)
      if (op) actions.push(namingAction(relPath, name, op, m.getStartLineNumber()))
    }
    // const handleX = () => {} / const createY = async () => {}
    for (const v of sf.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const init = v.getInitializer()
      if (!init || !(Node.isArrowFunction(init) || Node.isFunctionExpression(init))) continue
      const name = v.getName()
      const op = verbOp(name)
      if (op) actions.push(namingAction(relPath, name, op, v.getStartLineNumber()))
    }
  }

  return actions
}

function namingAction(
  filePath: string,
  name: string,
  op: CrudOp,
  lineNumber: number
): ActionCandidate {
  return {
    id: makeId('action', 'naming', filePath, name, String(lineNumber)),
    name,
    type: 'action',
    op,
    source: 'naming',
    filePath,
    lineNumber,
    detail: `${op} (from name "${name}")`,
  }
}

function verbOp(name: string): CrudOp | null {
  // Strip a leading "handle" so handleCreateUser → create.
  const stripped = name.replace(/^handle/, '')
  for (const [re, op] of VERB_OP) {
    if (re.test(stripped) || re.test(name)) return op
  }
  return null
}
