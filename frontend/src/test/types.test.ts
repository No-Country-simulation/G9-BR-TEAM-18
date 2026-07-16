import { describe, it, expect } from 'vitest'
import {
  CATEGORIA_DISPLAY,
  CATEGORIA_CORES,
  ApiError,
} from '../types'

describe('CATEGORIA_DISPLAY', () => {
  it('retorna label para EXCELENTE', () => {
    expect(CATEGORIA_DISPLAY.EXCELENTE).toBe('Excelente')
  })

  it('retorna label para BOM', () => {
    expect(CATEGORIA_DISPLAY.BOM).toBe('Bom')
  })

  it('retorna label para MEDIANO', () => {
    expect(CATEGORIA_DISPLAY.MEDIANO).toBe('Mediano')
  })

  it('retorna label para RUIM', () => {
    expect(CATEGORIA_DISPLAY.RUIM).toBe('Ruim')
  })

  it('retorna label para CRITICO', () => {
    expect(CATEGORIA_DISPLAY.CRITICO).toBe('Crítico')
  })
})

describe('CATEGORIA_CORES', () => {
  it('retorna cor verde escuro para EXCELENTE', () => {
    expect(CATEGORIA_CORES.EXCELENTE).toBe('#059669')
  })

  it('retorna cor verde para BOM', () => {
    expect(CATEGORIA_CORES.BOM).toBe('#10b981')
  })

  it('retorna cor amarela para MEDIANO', () => {
    expect(CATEGORIA_CORES.MEDIANO).toBe('#f59e0b')
  })

  it('retorna cor laranja para RUIM', () => {
    expect(CATEGORIA_CORES.RUIM).toBe('#f97316')
  })

  it('retorna cor vermelha para CRITICO', () => {
    expect(CATEGORIA_CORES.CRITICO).toBe('#ef4444')
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
