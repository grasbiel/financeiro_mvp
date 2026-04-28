import { useEffect, useRef } from 'react'

type ShortcutMap = Record<string, () => void>

/**
 * Registra atalhos de teclado globais.
 * Suporta sequências como "g+d" (pressionar G depois D em 1s).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      // Ignorar quando o foco está em inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toLowerCase()

      // Sequência pendente (ex: g → d)
      if (pendingRef.current) {
        const seq = `${pendingRef.current}+${key}`
        if (shortcuts[seq]) {
          e.preventDefault()
          shortcuts[seq]()
        }
        pendingRef.current = null
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }

      if (shortcuts[key]) {
        e.preventDefault()
        shortcuts[key]()
        return
      }

      // Iniciar sequência se a tecla pode ser início (ex: "g")
      const hasSequence = Object.keys(shortcuts).some(k => k.startsWith(`${key}+`))
      if (hasSequence) {
        pendingRef.current = key
        timerRef.current = setTimeout(() => { pendingRef.current = null }, 1000)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
