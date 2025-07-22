import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import WriteAritcle from './pages/WriteAritcle'
import BlogTitles from './pages/BlogTitles'
import GenerateImages from './pages/GenerateImages'
import RemoveBackgound from './pages/RemoveBackgound'
import RemoveObject from './pages/RemoveObject'
import ReviewResume from './pages/ReviewResume'
import Community from './pages/Community'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'

const App = () => {
  const {getToken} = useAuth()
  useEffect(()=>{
     getToken().then((token)=>console.log(token));
  },[])
  return (
    <div>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/ai' element={<Layout/>}>
        <Route index element={<Dashboard/>}/>
        <Route path='write-article' element ={<WriteAritcle/>}/>
        <Route path='blog-titles' element ={<BlogTitles/>}/>
        <Route path='generate-images' element ={<GenerateImages/>}/>
        <Route path='remove-background' element ={<RemoveBackgound/>}/>
        <Route path='remove-object' element ={<RemoveObject/>}/>
        <Route path='review-resume' element ={<ReviewResume/>}/>
        <Route path='community' element ={<Community/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default App

