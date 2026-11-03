import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/bagel-fat-one/400.css'
import '@fontsource/kalam/400.css'
import '@fontsource/kalam/700.css'
import AuctionPage from './AuctionPage'
import './auction.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuctionPage />
  </React.StrictMode>,
)
