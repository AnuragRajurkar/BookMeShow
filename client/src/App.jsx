import React from 'react'
import NavBar from './components/NavBar'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import {Movies} from './pages/Movies'
import { MovieDetails } from './pages/MovieDetails'
import { SeatLayout } from './pages/SeatLayout'
import { MyBookings } from './pages/MyBookings'
import { Favorite } from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import {Footer} from './components/Footer'
import { Layout } from './pages/admin/Layout'
import { Dashboard } from './pages/admin/Dashboard'
import { AddShows } from './pages/admin/AddShows'
import { ListShows } from './pages/admin/ListShows'
import { ListBookings } from './pages/admin/ListBookings'
import { useAppContext } from './context/appContext'
import { SignIn } from '@clerk/clerk-react'
import { Loading } from './components/Loading'

const App = () => {

 const isAdminRoute = useLocation().pathname.startsWith('/admin');
  
  const { user } = useAppContext();

  return (
    <>
    <Toaster />
      { !isAdminRoute && <NavBar />}
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/movies' element={<Movies />}></Route>
        <Route path='/movies/:id' element={<MovieDetails />}></Route>
        <Route path='/movies/:id/:date' element={<SeatLayout />}></Route>
        <Route path='/my-bookings' element={<MyBookings />}></Route>
        <Route path='/loading/:nextUrl' element={<Loading />}></Route>
        <Route path='/favorite' element={<Favorite />}></Route>

        <Route path='/admin/*' element={user ? <Layout /> : (
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={'/admin'} />
          </div>
        )}>
         <Route index element={<Dashboard />} />
         <Route path='add-shows' element={<AddShows />} />
         <Route path='list-shows' element={<ListShows />} />
         <Route path='list-bookings' element={<ListBookings />} />
        </Route>
      </Routes>
       { !isAdminRoute && <Footer />}
    </>
  )
}

export default App
