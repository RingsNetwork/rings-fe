import { useState, useEffect } from 'react'

const ThemeToogle = () => {
  const [activeTheme, setActiveTheme] = useState(
    document.body.dataset.theme || 'light'
  )
  const inactiveTheme = activeTheme === 'light' ? 'dark' : 'light'

  useEffect(
    () => {
      document.body.dataset.theme = activeTheme
      window.localStorage.setItem('theme', activeTheme)
    },
    [activeTheme]
  )

  return (
    <div onClick={() => setActiveTheme(inactiveTheme)}>
      {inactiveTheme.toUpperCase()} MODE
    </div>
  )
}

export default ThemeToogle
