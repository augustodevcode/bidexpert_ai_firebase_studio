/**
 * Comandos customizados do Playwright para testes visuais
 * 
 * BDD: Permitir navegação e interação com páginas reais da aplicação
 * TDD: Implementar comandos que estendem as capacidades do Vitest browser
 */

import type { BrowserCommand } from 'vitest/node'

/**
 * Navega para uma URL específica usando o Playwright
 */
export const navigate: BrowserCommand<[url: string]> = async (ctx, url) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    await frame.goto(url, { waitUntil: 'networkidle' })
    return { success: true, url }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado para navegação`)
}

/**
 * Aguarda um seletor aparecer na página
 */
export const waitForSelector: BrowserCommand<[selector: string, timeout?: number]> = async (
  ctx,
  selector,
  timeout = 10000
) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    await frame.waitForSelector(selector, { timeout })
    return { success: true, selector }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Preenche um input pelo seletor
 */
export const fillInput: BrowserCommand<[selector: string, value: string]> = async (
  ctx,
  selector,
  value
) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    await frame.fill(selector, value)
    return { success: true, selector, value }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Clica em um elemento pelo seletor
 */
export const clickElement: BrowserCommand<[selector: string]> = async (ctx, selector) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    await frame.click(selector)
    return { success: true, selector }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Captura screenshot da página atual
 */
export const screenshotPage: BrowserCommand<[name: string]> = async (ctx, name) => {
  if (ctx.provider.name === 'playwright') {
    const page = ctx.page
    const buffer = await page.screenshot({ fullPage: true })
    return { success: true, name, size: buffer.length }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Obtém o texto de um elemento
 */
export const getElementText: BrowserCommand<[selector: string]> = async (ctx, selector) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    const text = await frame.locator(selector).textContent()
    return { success: true, text }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Verifica se um elemento está visível
 */
export const isElementVisible: BrowserCommand<[selector: string]> = async (ctx, selector) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    const visible = await frame.locator(selector).isVisible()
    return { success: true, visible }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}

/**
 * Aguarda a página carregar completamente
 */
export const waitForPageLoad: BrowserCommand<[]> = async (ctx) => {
  if (ctx.provider.name === 'playwright') {
    const frame = await ctx.frame()
    await frame.waitForLoadState('networkidle')
    return { success: true }
  }
  throw new Error(`Provider ${ctx.provider.name} não suportado`)
}
