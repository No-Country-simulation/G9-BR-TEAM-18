import { describe, it, expect } from 'vitest'
import {
  CATEGORIA_DISPLAY,
  CATEGORIA_CORES,
  ApiError,
} from '../types'

describe('CATEGORIA_DISPLAY', () => {
  it('retorna label para EFICIENTE', () => {
    expect(CATEGORIA_DISPLAY.EFICIENTE).toBe('Eficiente')
  })

  it('retorna label para MODERADO', () => {
    expect(CATEGORIA_DISPLAY.MODERADO).toBe('Moderado')
  })

  it('retorna label para ALTO', () => {
    expect(CATEGORIA_DISPLAY.ALTO).toBe('Ineficiente')
  })
})

describe('CATEGORIA_CORES', () => {
  it('retorna cor verde para EFICIENTE', () => {
    expect(CATEGORIA_CORES.EFICIENTE).toBe('#10b981')
  })

  it('retorna cor amarela para MODERADO', () => {
    expect(CATEGORIA_CORES.MODERADO).toBe('#f59e0b')
  })

  it('retorna cor vermelha para ALTO', () => {
    expect(CATEGORIA_CORES.ALTO).toBe('#ef4444')
  })
})

describe('ApiError', () => {
  it('cria erro com mensagem e campos', () => {
    const err = new ApiError('Erro de validação', { consumo_kwh: 'deve ser positivo' })
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Erro de validação')
    expect(err.campos).toEqual({ consumo_kwh: 'deve ser positivo' })
    expect(err.name).toBe('ApiError')
  })

  it('aceita campos vazios', () => {
    const err = new ApiError('Algo deu errado', {})
    expect(err.message).toBe('Algo deu errado')
    expect(err.campos).toEqual({})
  })
})
