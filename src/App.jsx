import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import RecipeBook from './pages/RecipeBook'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/recipe-book" element={<RecipeBook />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
