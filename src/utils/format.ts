import jsYaml from 'js-yaml'

export function formatJson(text: string, indent = 2): string {
  const obj = JSON.parse(text)
  return JSON.stringify(obj, null, indent)
}

export function minifyJson(text: string): string {
  const obj = JSON.parse(text)
  return JSON.stringify(obj)
}

export function validateJson(text: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(text)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export function formatYaml(text: string): string {
  const obj = jsYaml.load(text)
  return jsYaml.dump(obj, { indent: 2, lineWidth: -1 })
}

export function validateYaml(text: string): { valid: boolean; error?: string } {
  try {
    jsYaml.load(text)
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

export function jsonToYaml(jsonText: string): string {
  const obj = JSON.parse(jsonText)
  return jsYaml.dump(obj, { indent: 2, lineWidth: -1 })
}

export function yamlToJson(yamlText: string): string {
  const obj = jsYaml.load(yamlText)
  return JSON.stringify(obj, null, 2)
}
