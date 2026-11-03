import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import RecipeBook from './pages/RecipeBook'
import CookbookGuidePage from './cookbook-guide/CookbookGuidePage'
import BigBackLookback from './pages/BigBackLookback'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/recipe-book" element={<RecipeBook />} />
        <Route path="/cookbook-guide" element={<CookbookGuidePage />} />
        <Route path="/big-back-lookback" element={<BigBackLookback />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
