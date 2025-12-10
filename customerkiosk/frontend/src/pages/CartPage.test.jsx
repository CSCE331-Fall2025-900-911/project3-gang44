import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CartPage from './CartPage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}))

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    cart: [],
    removeFromCart: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    cartTotal: 0,
    clearCart: vi.fn(),
    user: null,
    t: (key) => key
  })
}))

vi.mock('../components/weather', () => ({
  useWeather: () => ({ weather: null, loading: false }),
  getDrinkRecommendation: () => null,
  findRecommendedDrinkId: () => null
}))

describe('cart page', () => {
  it('renders empty cart message when cart is empty', () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    )

    expect(screen.getByText('emptyCart')).toBeInTheDocument()
    expect(screen.getByText('backToMenu')).toBeInTheDocument()
  })
})
