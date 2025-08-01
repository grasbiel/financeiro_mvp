import {
  Routes, Route,
} from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'

import Login from './pages/Login'
import DashBoard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Categories from './pages/Categories'
import Reports from './pages/Reports'
import Navbar from './components/Navbar'
import EmotionReport from './pages/EmotionReport'
import Signup from './pages/Signup'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route element={<RequireAuth />}>
          <Route path='/' element={<DashBoard />} />
          <Route path='/transactions' element={<Transactions />} />
          <Route path='/categories' element={<Categories />} />
          <Route path ='/reports' element={<Reports />} />
          <Route path ='/emotion-report' element= {<EmotionReport/>} /> 
        </Route>
      </Routes>
    </>
  );
}

