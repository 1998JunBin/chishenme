import { useEffect } from 'react'
import './App.css'
import { PhoneShell } from './components/PhoneShell'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SwipeScreen } from './screens/SwipeScreen'
import { ProfileScreen, RecipesScreen } from './screens/PlaceholderScreens'
import { useApp } from './store/app'

export default function App() {
  const init = useApp((s) => s.init)
  const tab = useApp((s) => s.tab)
  const screen = useApp((s) => s.screen)

  useEffect(() => {
    void init()
    const applyHash = () => {
      const h = location.hash.replace('#', '')
      if (h === 'setup') useApp.getState().setScreen('setup')
      else if (h === 'swipe') useApp.getState().setScreen('swipe')
      else if (h === 'recipes') useApp.getState().setTab('recipes')
      else if (h === 'profile') useApp.getState().setTab('profile')
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [init])

  let content
  if (screen === 'setup') content = <SetupScreen />
  else if (screen === 'swipe') content = <SwipeScreen />
  else if (tab === 'recipes') content = <RecipesScreen />
  else if (tab === 'profile') content = <ProfileScreen />
  else content = <HomeScreen />

  return <PhoneShell>{content}</PhoneShell>
}
