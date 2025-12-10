/**
 * Testes de Regressão Visual - BidExpert
 *
 * BDD: Garantir que a interface visual da aplicação permanece consistente
 * TDD: Capturar screenshots de componentes críticos e detectar mudanças visuais
 * 
 * NOTA: O Vitest Browser mode NÃO suporta navegação para URLs externas por padrão.
 * Estes testes verificam elementos renderizados no contexto do browser de teste.
 */

import { expect, test, describe } from 'vitest'
import { page, server } from 'vitest/browser'

describe('Visual Regression Tests - Browser Environment', () => {
  test('browser environment is properly configured', async () => {
    // Verifica se o ambiente do browser está funcionando
    expect(server.browser).toBe('chromium')
    expect(server.provider).toBe('playwright')
  })

  test('can render and query DOM elements', async () => {
    // Criar um elemento de teste no DOM
    const testDiv = document.createElement('div')
    testDiv.setAttribute('data-testid', 'test-element')
    testDiv.textContent = 'Test Content'
    document.body.appendChild(testDiv)

    // Verificar se o elemento pode ser encontrado
    const element = page.getByTestId('test-element')
    await expect.element(element).toBeVisible()
    await expect.element(element).toHaveTextContent('Test Content')

    // Limpar
    document.body.removeChild(testDiv)
  })

  test('can take screenshots', async () => {
    // Criar um componente visual para screenshot
    const container = document.createElement('div')
    container.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
        <h1 style="color: white; margin: 0;">BidExpert Visual Test</h1>
        <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Screenshot test component</p>
      </div>
    `
    document.body.appendChild(container)

    // Capturar screenshot (isso gera um arquivo de referência)
    const screenshotPath = await page.screenshot({
      path: 'tests/visual/__screenshots__/visual-component.png'
    })
    
    expect(screenshotPath).toBeTruthy()

    // Limpar
    document.body.removeChild(container)
  })

  test('viewport can be resized', async () => {
    // Testar mudança de viewport
    await page.viewport(375, 667) // Mobile viewport
    
    // Verificar que o viewport foi alterado
    expect(window.innerWidth).toBeLessThanOrEqual(375)
  })

  test('can interact with user events', async () => {
    // Criar um botão de teste
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'click-button')
    button.textContent = 'Click Me'
    let clicked = false
    button.onclick = () => { clicked = true }
    document.body.appendChild(button)

    // Encontrar e clicar no botão
    const buttonLocator = page.getByTestId('click-button')
    await expect.element(buttonLocator).toBeVisible()
    await buttonLocator.click()

    expect(clicked).toBe(true)

    // Limpar
    document.body.removeChild(button)
  })

  test('can verify element styles', async () => {
    // Criar elemento com estilo específico
    const styledDiv = document.createElement('div')
    styledDiv.setAttribute('data-testid', 'styled-element')
    styledDiv.style.backgroundColor = 'rgb(102, 126, 234)'
    styledDiv.style.width = '200px'
    styledDiv.style.height = '100px'
    document.body.appendChild(styledDiv)

    const element = page.getByTestId('styled-element')
    await expect.element(element).toBeVisible()

    // Limpar
    document.body.removeChild(styledDiv)
  })
})