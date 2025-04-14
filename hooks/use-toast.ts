"use client"

import type React from "react"

// Adapted from: https://ui.shadcn.com/docs/components/toast
import { useState, useEffect } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  open: boolean
  type?: "default" | "destructive" | "success"
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
      id: string
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      id: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      id: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.id ? { ...t, ...action.toast } : t)),
      }

    case "DISMISS_TOAST": {
      const { id } = action

      if (toastTimeouts.has(id)) {
        clearTimeout(toastTimeouts.get(id))
        toastTimeouts.delete(id)
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      }
    }

    case "REMOVE_TOAST":
      if (toastTimeouts.has(action.id)) {
        clearTimeout(toastTimeouts.get(action.id))
        toastTimeouts.delete(action.id)
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id" | "open">

function toast({ ...props }: Toast) {
  const id = generateId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      id,
      toast: props,
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (id: string) => dispatch({ type: "DISMISS_TOAST", id }),
  }
}

export { useToast, toast }
