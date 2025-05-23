import { z } from "zod"

// Tipos para validação
type ValidationResult = {
  success: boolean
  errors?: Array<{
    field: string
    message: string
  }>
  message?: string
}

// Schema para validação de configurações
export const settingsSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome não pode exceder 50 caracteres")
    .trim(),
  timezone: z.string()
    .refine((val) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: val })
        return true
      } catch {
        return false
      }
    }, "Fuso horário inválido"),
  language: z.string()
    .refine((val) => {
      try {
        Intl.NumberFormat(val)
        return true
      } catch {
        return false
      }
    }, "Idioma inválido"),
  notifications: z.object({
    pushEnabled: z.boolean(),
    emailEnabled: z.boolean(),
    feedingReminders: z.boolean(),
    missedFeedingAlerts: z.boolean(),
    householdUpdates: z.boolean()
  })
})

// Função para validar configurações
export function validateSettings(data: unknown): ValidationResult {
  try {
    settingsSchema.parse(data)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Erro de validação desconhecido' }]
    }
  }
}

// Função para validar nome
export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { success: false, message: "Nome não pode estar vazio" }
  }
  if (name.length < 2) {
    return { success: false, message: "Nome deve ter pelo menos 2 caracteres" }
  }
  if (name.length > 50) {
    return { success: false, message: "Nome não pode exceder 50 caracteres" }
  }
  return { success: true }
}

// Função para validar timezone
export function validateTimezone(timezone: string): ValidationResult {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return { success: true }
  } catch {
    return { success: false, message: "Fuso horário inválido" }
  }
}

// Função para validar idioma
export function validateLanguage(language: string): ValidationResult {
  try {
    Intl.NumberFormat(language)
    return { success: true }
  } catch {
    return { success: false, message: "Idioma inválido" }
  }
} 