import { 
Box,
Text,
SimpleGrid,
Flex,
Center
} from '@chakra-ui/react'
import TradeCard from "../components/TradeCards"
import { useState } from 'react'

export default function TradesPage(){
    return(
    <>
        <Text>Pending</Text>
        <Text>Completed</Text>
        <Text>Cancelled</Text>
        <Text>Rejected</Text>
        <GeneratePrivate />
    </>
    )

}

// function GeneratePrivate(){
//   const [sampleData, setSampleData] = useState([1,2,3,4,5,6,7,8,9,10,11,12,13,14])

//   return (
//     <>
//       {/* <Text>Add Filter [By Type | By Date] [ASC | DESC]</Text> */}
//       <Flex flexWrap={'wrap'} justifyContent={'center'} gap={'1rem'}>
//         {sampleData.map((item)=>{return <PrivateTradeCard key={`privatetrade-${item}`} title={item} Amount={1} Id={item} status={item % 2 == 0 ? "PENDING" : item % 3 == 0 ? "COMPLETED" : "CANCELLED"} />})}
//       </Flex>
//     </>
//   )
// }

function GeneratePrivate(){
    const [sampleData, setSampleData] = useState([1,2,3,4,5,6,7,8,9,10,11,12,13,14])
  
    return (
    // <Flex justifyContent={{base: 'center', md: 'center', lg: 'start'}} >
        <SimpleGrid minChildWidth={{base: '9rem', md: '10rem', lg: '12rem'}} gap={'1rem'}>
            {sampleData.map((item)=><TradeCard key={`privatetrade-${item}`} title={ item % 2 == 0 ? 'Looking For Item in the end of times' : 'Looking For'} Amount={1} Id={item} status={item % 2 == 0 ? "PENDING" : item % 3 == 0 ? "COMPLETED" : "CANCELLED"} />)}
        </SimpleGrid>
    // </Flex>
    )
  }