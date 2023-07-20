import { 
Flex,
Text, 
Box,
Card, 
CardHeader,
CardBody,
CardFooter, 
Badge,
Heading,
Image,
Drawer,
DrawerOverlay,
DrawerCloseButton,
DrawerContent,
DrawerHeader,
DrawerBody,
DrawerFooter,
Modal,
ModalOverlay,
ModalCloseButton,
ModalContent,
ModalHeader,
ModalBody,
ModalFooter,
Button,
useDisclosure,
Tooltip
} from '@chakra-ui/react';
import { ArrowDownIcon } from '@chakra-ui/icons';

const outlineColor = '#5CB9FE';

export default function TradeCard ({
    title="Escrow Trade", 
    image='https://picsum.photos/200', 
    alt="something", 
    TokenType="ERC1155", 
    Id="1", 
    Amount=12, 
    Name="Some", 
    CollectionName="Some Collection", 
    status="PENDING"
    }) {
    
        const { isOpen: drawerIsOpen , onOpen: drawerOnOpen , onClose: drawerOnClose  } = useDisclosure()
        const { isOpen: modalIsOpen , onOpen: modalOnOpen , onClose: modalOnClose  } = useDisclosure()

    function handleParticipate(){
        console.log("Participating...");
        modalOnClose()
    }
    
    return(<>
    <Card as={'button'} padding={'0.7rem'} width={{ base: '9rem', md: '10rem', lg: '12rem'}} cursor={'pointer'} onClick={drawerOnOpen} _hover={{outline: `3px solid ${outlineColor}`}} >
        <Heading size={'sm'} mb={'0.5rem'} noOfLines={2} h={'-webkit-fill-available'}>{title}</Heading>
        
        <Flex flexDirection={'column'} gap={'0.3rem'}>
            <Image src={image} alt={alt} borderRadius={'0.5rem'} />
            <Flex flexDirection={'row'} gap={'0.5rem'}>
            <Badge w={'fit-content'} colorScheme='blue' >{TokenType}</Badge>
            <Badge w={'fit-content'} colorScheme='green' >Id: {Id}</Badge>
            </Flex>
            {Amount && <Badge w={'fit-content'} colorScheme='gray'><small>Amount</small> {Amount}</Badge>}
            <Flex flexDirection={'column'} justifyContent={'start'} gap={'0.2rem'} textAlign={'start'}>
                <Heading size={'medium'}>{Name}</Heading>
                <Text fontSize={'small'}>{CollectionName}</Text>
                <Badge w={'fit-content'} colorScheme={status === "PENDING" ? 'orange' : status === "COMPLETED" ? 'green' : "red" }>{status}</Badge>
            </Flex>
        </Flex>
    </Card>
    
    <Drawer isOpen={drawerIsOpen} onClose={drawerOnClose} size={{base: 'sm', md: 'md', lg: 'lg'}} >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>{title}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <Flex flexDirection={'column'} alignItems={'center'} justifyContent={'space-evenly'} h={'100%'}>
                <Box>From</Box>
                <ArrowDownIcon />
                <Box>To</Box>
            </Flex>
          </DrawerBody>

          <DrawerFooter gap={'1rem'}>
            <Button onClick={modalOnOpen} colorScheme='green' variant='solid' >Accept</Button>
            <Button onClick={modalOnOpen} colorScheme='red' variant='solid' >Reject</Button>
            <Button onClick={modalOnOpen} colorScheme='blue' variant='solid' >Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
    </Drawer>
    
    <Modal isOpen={modalIsOpen} onClose={modalOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr={'1rem'}>Are You Sure You Want To Participate In The Trade?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Participating in the trade will automatically execute the trade and there is no turning back.</Text>
            <Text>In case of you not having the required assets for this trade, the trade request will revert automatically.</Text>
          </ModalBody>

          <ModalFooter>
            <Flex gap={'1rem'}>
                <Button colorScheme={'blue'} onClick={handleParticipate}>Yes</Button>
                <Button colorScheme={'red'} onClick={modalOnClose}>No</Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>)
}