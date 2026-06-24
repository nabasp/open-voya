import path from 'path'

import { Node, SyntaxKind } from 'ts-morph'
import type { JsxOpeningElement, JsxSelfClosingElement } from 'ts-morph'

import type { FormNode, FormType } from '../types'
import { makeId, toPosix } from '../utils/ids'
import type { ExtractContext } from './context'

/**
 * Discover forms across the common React conventions:
 *  - native `<form>` and `<Form>` elements,
 *  - `<FormField>` registrations,
 *  - react-hook-form `useForm()`,
 *  - formik `useFormik()` / `<Formik>`.
 * `fields` collects nearby field names (input `name=`, FormField `name=`,
 * register('x'), control fields) for downstream flow generation.
 */
export function extractForms(ctx: ExtractContext): FormNode[] {
  const forms: FormNode[] = []

  for (const sf of ctx.sourceFiles) {
    const ext = path.extname(sf.getFilePath())
    const relPath = toPosix(path.relative(ctx.repoRoot, sf.getFilePath()))
    const isJsx = ext === '.tsx' || ext === '.jsx'
    let idx = 0

    // useForm() / useFormik() calls (hook-based forms)
    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const fn = call.getExpression().getText()
      const type: FormType | null =
        fn === 'useForm' ? 'react-hook-form' : fn === 'useFormik' ? 'formik' : null
      if (!type) continue
      forms.push({
        id: makeId('form', relPath, type, String(idx++)),
        name: type === 'react-hook-form' ? 'react-hook-form' : 'formik form',
        type,
        filePath: relPath,
        lineNumber: call.getStartLineNumber(),
        fields: registerFields(sf),
      })
    }

    if (!isJsx) continue

    // <form>, <Form>, <Formik>, <FormField name="...">
    const handle = (tag: string, el: JsxOpeningElement | JsxSelfClosingElement) => {
      const lower = tag.toLowerCase()
      let type: FormType | null = null
      if (lower === 'form') type = 'form'
      else if (tag === 'Formik') type = 'formik'
      else if (/formfield$/.test(lower)) type = 'form-field'
      if (!type) return
      forms.push({
        id: makeId('form', relPath, type, String(idx++)),
        name: type === 'form-field' ? jsxNameAttr(el) ?? tag : tag,
        type,
        filePath: relPath,
        lineNumber: el.getStartLineNumber(),
        fields: type === 'form-field' ? compact([jsxNameAttr(el)]) : jsxFieldNames(el),
      })
    }
    for (const el of sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)) {
      handle(el.getTagNameNode().getText(), el)
    }
    for (const el of sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) {
      handle(el.getTagNameNode().getText(), el)
    }
  }

  return forms
}

/** react-hook-form register('field') calls in the file. */
function registerFields(sf: import('ts-morph').SourceFile): string[] {
  const fields = new Set<string>()
  for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    const expr = call.getExpression()
    if (expr.getText() !== 'register') continue
    const arg = call.getArguments()[0]
    if (arg && Node.isStringLiteral(arg)) fields.add(arg.getLiteralText())
  }
  return Array.from(fields)
}

/** Collect `name="..."` from <input>/<select>/<textarea> descendants of a form. */
function jsxFieldNames(el: JsxOpeningElement | JsxSelfClosingElement): string[] {
  const parent = Node.isJsxSelfClosingElement(el)
    ? el
    : el.getParentIfKind(SyntaxKind.JsxElement) ?? el
  const fields = new Set<string>()
  for (const input of [
    ...parent.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...parent.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ]) {
    const tag = input.getTagNameNode().getText().toLowerCase()
    if (tag !== 'input' && tag !== 'select' && tag !== 'textarea' && !/field$/.test(tag)) continue
    const name = jsxNameAttr(input)
    if (name) fields.add(name)
  }
  return Array.from(fields)
}

function jsxNameAttr(el: JsxOpeningElement | JsxSelfClosingElement): string | null {
  for (const attr of el.getAttributes()) {
    if (!Node.isJsxAttribute(attr)) continue
    if (attr.getNameNode().getText() !== 'name') continue
    const init = attr.getInitializer()
    if (init && Node.isStringLiteral(init)) return init.getLiteralText()
  }
  return null
}

function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((x): x is T => x != null)
}
