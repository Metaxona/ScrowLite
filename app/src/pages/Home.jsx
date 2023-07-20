import { 
Box,
Flex,
Heading,
Text,
Button
} from '@chakra-ui/react'
import Status from '../components/Status'
import TradeCard from '../components/TradeCards'
import { useState } from 'react'

export default function Home(){
    return(
        <Box>
            <Flex flexDirection={'column'}>
                <Flex flexWrap={'wrap'} justifyContent={'center'} gap={'1rem'}>
                    <Status label={'Pending'} value={'500'} minWidth='10rem' />
                    <Status label={'Completed'} value={'1000'} minWidth='10rem' />
                </Flex>
                <Heading>Featured</Heading>
                <GeneratePublic />
            </Flex>
        </Box>
    )
} 

function GeneratePublic(){
    const [sampleData, setSampleData] = useState([1,2,3,4,5,6,7,8,9,10,11,12,13,14])
    const [showAll, setShowAll] = useState(false);
    
    const visibleItems = showAll ? sampleData : sampleData.slice(0, 5);

    return (
    <>
      {/* <Text>Add Filter [By Type | By Date] [ASC | DESC]</Text> */}
      <Flex flexDirection={'column'} gap={'1rem'}>
        <Flex justifyContent={'end'}><Button w={'10rem'} onClick={()=>setShowAll((prev)=>!prev)}>{showAll ? 'Hide' : 'Show All'}</Button></Flex>
        <Flex flexWrap={'wrap'} justifyContent={'center'} gap={'1rem'} >
            {visibleItems.map((item)=>{return <TradeCard key={`publictrade-${item}`} title={item} Amount={1} Id={item} status={item % 2 == 0 ? "PENDING" : item % 3 == 0 ? "COMPLETED" : "CANCELLED"} />})}
        </Flex>
      </Flex>
    </>
    )
  }