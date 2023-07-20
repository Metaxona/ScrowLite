import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { WagmiConfig, sepolia } from 'wagmi'
import { wagmiConfig, chains } from './wagmi.js';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css';
import {BrowserRouter} from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} initialChain={sepolia} theme={{ lightMode: lightTheme(), darkMode: darkTheme(),}}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </BrowserRouter>
  </React.StrictMode>,
)
