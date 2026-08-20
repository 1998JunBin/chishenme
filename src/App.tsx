import { useEffect } from 'react'
import './App.css'
import { PhoneShell } from './components/PhoneShell'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { SwipeScreen } from './screens/SwipeScreen'
import { DoneScreen } from './screens/DoneScreen'
import { RecipesScreen } from './screens/RecipesScreen'
import { AddRecipeScreen } from './screens/AddRecipeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { useApp } from './store/app'
import { useLibrary } from './store/library'

export default function App() {
  const init = useApp((s) => s.init)
  const refreshLibrary = useLibrary((s) => s.refresh)
  const tab = useApp((s) => s.tab)
  const screen = useApp((s) => s.screen)

  useEffect(() => {
    void init()
    void refreshLibrary()
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
  }, [init, refreshLibrary])

  let content
  if (screen === 'setup') content = <SetupScreen />
  else if (screen === 'swipe') content = <SwipeScreen />
  else if (screen === 'done') content = <DoneScreen />
  else if (screen === 'addrecipe') content = <AddRecipeScreen />
  else if (tab === 'recipes') content = <RecipesScreen />
  else if (tab === 'profile') content = <ProfileScreen />
  else content = <HomeScreen />

  return <PhoneShell>{content}</PhoneShell>
}
