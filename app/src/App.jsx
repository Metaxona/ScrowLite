import { 
  ChakraProvider,
  Box,
  Text,
  SimpleGrid,
  Hide,
  Flex,
} from '@chakra-ui/react'
import Header from "./components/Header";
import { MobileNavigation } from './components/Navigation'
import Home from './pages/Home'
import Create from './pages/Create';
import ScrollToTop from './components/ScrollToTop';
import {Routes, Route} from 'react-router-dom'
import NotFound from './pages/NotFound'
import TradesPage from './pages/Trades';
import './App.css'

function App() {

  return (
          <ChakraProvider>
            <Box minH={'100dvh'} minW={'320px'}>
              <ScrollToTop />
                <Header />
                <Box minH={'100dvh'} minW={'320px'} maxW={'100dvw'} mt={'1rem'} mb={'6rem'} p={'1rem'}>
                  <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/create" element={<Create />} />
                      <Route path="/trades" element={<TradesPage />} />
                      <Route path="*" element={<NotFound />} />
                  </Routes>
                </Box>
                <MobileNavigation />
            </Box>
          </ChakraProvider>
          )
}







export default App