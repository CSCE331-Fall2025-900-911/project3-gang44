import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MenuPage from './MenuPage'

global.fetch = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' }
  })
}))

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    cart: [],
    t: (key) => key,
    isTranslating: false
  })
}))

vi.mock('../components/weather', () => ({
  WeatherWidget: () => <div>weather widget</div>
}))

vi.mock('../config/drinkImages', () => ({
  getDrinkImage: () => null
}))

describe('menu page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    import.meta.env.VITE_API_URL = 'http://localhost:5000'
  })

  it('shows loading state initially', () => {
    global.fetch.mockReturnValue(new Promise(() => {}))

    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Loading menu...')).toBeInTheDocument()
  })

  it('renders menu items after loading', async () => {
    const mockDrinks = [
      { product_id: 1, name: 'milk tea', category: 'tea', price: '5.99' },
      { product_id: 2, name: 'latte', category: 'coffee', price: '6.50' }
    ]

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockDrinks
    })

    render(
      <BrowserRouter>
        <MenuPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('milk tea')).toBeInTheDocument()
      expect(screen.getByText('latte')).toBeInTheDocument()
    })
  })
})
