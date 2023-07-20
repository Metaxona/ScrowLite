import {
Flex,
Box,
Text,
Heading,
Hide,
Show,
Select,
Input,
Card,
CardBody,
CardHeader,
CardFooter,
Button,
FormLabel,
FormControl,
FormErrorMessage
} from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { FaPlus, FaArrowRight, FaArrowDown } from 'react-icons/fa'
import { useAccount } from 'wagmi'
import { readContract, readContracts, writeContract, watchContractEvent } from '@wagmi/core';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

/**
 * Asset Type 
 * 0 - ERC20 
 * 1 - ERC721
 * 2 - ERC1155
 */

export default function CreateTrade(){
    const { address, isConnected } = useAccount()

    const [fromAssetType, setFromAssetType] = useState()
    const [toAssetType, setToAssetType] = useState()

    const [fromTokenId, setFromTokenId] = useState(0)
    const [fromAmount, setFromAmount] = useState(0)

    const [toTokenId, setToTokenId] = useState(0)
    const [toAmount, setToAmount] = useState(0)

    const partyA = useRef([[ZERO_ADDRESS, 0],[ZERO_ADDRESS, 0],[ZERO_ADDRESS, 0,0]])
    const partyB = useRef([[ZERO_ADDRESS, 0],[ZERO_ADDRESS, 0],[ZERO_ADDRESS, 0,0]])

    const [fromContractAddress, setFromContractAddress] = useState(ZERO_ADDRESS)
    const [toContractAddress, setToContractAddress] = useState(ZERO_ADDRESS)
    const [partyBAddress, setPartyBAddress] = useState()
    const [partyAparams, setPartyAParams] = useState(partyA.current)
    const [partyBparams, setPartyBParams] = useState(partyB.current)
    const [instanceTitle, setInstanceTitle] = useState("Trade Request");

    function handleSubmit(event) {
        event.preventDefault();

        fillAssetDetails(fromAssetType, setPartyAParams, fromContractAddress, fromTokenId, fromAmount)
        fillAssetDetails(toAssetType, setPartyBParams, toContractAddress, toTokenId, toAmount)

        console.log(
            {
                fromAssetType,
                toAssetType,
                instanceTitle,
                partyBAddress,
            }
        )
        console.log(partyAparams)
        console.log(partyBparams)

        console.log(
            {
                fromAssetType,
                toAssetType,
                instanceTitle,
                partyBAddress,
                partyAparams,
                partyBparams
            }
        )
    }

    function fillAssetDetails(assetType, state, address, tokenId, amount) {
        if(assetType === '0') { 
            state([[address, amount], [ZERO_ADDRESS, 0], [ZERO_ADDRESS, 0, 0]])
         };
        if(assetType === '1') { 
            state([[ZERO_ADDRESS, 0], [address, tokenId], [ZERO_ADDRESS, 0, 0]])
         };
        if(assetType === '2') { 
            state([[ZERO_ADDRESS, 0], [ZERO_ADDRESS, 0], [address, tokenId, amount]])
         };
    }

    return(
        <Box mt={'2rem'}>
            <form onSubmit={handleSubmit}>
                <Flex alignItems={'center'} flexDirection={'column'} gap={'3rem'}>
                    <Box>
                        <FormControl>
                            <FormLabel>Title</FormLabel>
                            <Input w={'17rem'} placeholder='Title' maxLength={32} 
                            onChange={(e)=>setInstanceTitle(e.target.value)}
                            onBlur={(e)=>setInstanceTitle(e.target.value)} />
                        </FormControl>
                    </Box>
                    <Box>
                        <FormControl>
                            <FormLabel>Target Address</FormLabel>
                            <Input w={'17rem'} placeholder='Target Address' minLength={42} maxLength={42} 
                            onChange={(e)=>setPartyBAddress(e.target.value)}
                            onBlur={(e)=>setPartyBAddress(e.target.value)} />
                        </FormControl>
                    </Box>
                    <Flex flexDirection={{base: 'column', md: 'column', lg: 'row'}} gap={'1rem'}>
                        <Card>
                            <CardHeader>From</CardHeader>
                            <CardBody display={'flex'} gap={'1rem'} flexDirection={'column'}>
                                <FormControl>
                                    <FormLabel>Contract Address</FormLabel>
                                    <Input placeholder='Asset Contract Address' 
                                    onChange={(e)=>setFromContractAddress(e.target.value)} 
                                    onBlur={(e)=>setFromContractAddress(e.target.value)}
                                    />
                                </FormControl>
                                <Select placeholder='Asset Type' 
                                onChange={(e)=>setFromAssetType(e.target.value)} 
                                onBlur={(e)=>setFromAssetType(e.target.value)}
                                >
                                    <option value="0">ERC20</option>
                                    <option value="1">ERC721</option>
                                    <option value="2">ERC1155</option>
                                </Select>
                                {(fromAssetType === '1' || fromAssetType === '2') && <FormControl><FormLabel>Asset Id</FormLabel><Input placeholder='Asset Id' 
                                onChange={(e)=>setFromTokenId(e.target.value)}
                                onBlur={(e)=>setFromTokenId(e.target.value)} /></FormControl>}
                                {(fromAssetType === '0' || fromAssetType === '2') && <FormControl><FormLabel>Amount</FormLabel><Input type='number' placeholder='Asset Amount' 
                                onChange={(e)=>setFromAmount(e.target.value)}
                                onBlur={(e)=>setFromAmount(e.target.value)} /></FormControl>}
                            </CardBody>
                            <CardFooter></CardFooter>
                        </Card>
                        
                        <Hide below='lg'><FaArrowRight style={{margin: 'auto'}} /></Hide>
                        <Show below='lg'><FaArrowDown style={{margin: 'auto'}} /></Show>

                        <Card>
                            <CardHeader>To</CardHeader>
                            <CardBody display={'flex'} gap={'1rem'} flexDirection={'column'}>
                                <FormControl>
                                    <FormLabel>Contract Address</FormLabel>
                                    <Input placeholder='Asset Contract Address' 
                                    onChange={(e)=>setToContractAddress(e.target.value)} 
                                    onBlur={(e)=>setToContractAddress(e.target.value)}
                                    />
                                </FormControl>
                                <Select placeholder='Asset Type' 
                                onChange={(e)=>setToAssetType(e.target.value)} 
                                onBlur={(e)=>setToAssetType(e.target.value)}
                                >
                                    <option value="0">ERC20</option>
                                    <option value="1">ERC721</option>
                                    <option value="2">ERC1155</option>
                                </Select>
                                {(toAssetType === '1' || toAssetType === '2') && <FormControl><FormLabel>Asset Id</FormLabel><Input placeholder='Asset Id' 
                                onChange={(e)=>setToTokenId(e.target.value)}
                                onBlur={(e)=>setToTokenId(e.target.value)} /></FormControl>}
                                {(toAssetType === '0' || toAssetType === '2') && <FormControl><FormLabel>Amount</FormLabel><Input type='number' placeholder='Asset Amount' 
                                onChange={(e)=>setToAmount(e.target.value)}
                                onBlur={(e)=>setToAmount(e.target.value)} /></FormControl>}
                            </CardBody>
                            <CardFooter></CardFooter>
                        </Card>
                    </Flex>
                    <Button type='submit' w={'15rem'} colorScheme='blue' variant={'solid'}>Create Trade</Button>
                </Flex>
            </form>
        </Box>
    )
}