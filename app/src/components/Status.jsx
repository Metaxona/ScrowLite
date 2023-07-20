import {
Text,
Heading,
Box,
Card,
Stat,
StatLabel,
StatNumber,
StatHelpText,
StatArrow,
StatGroup,
} from '@chakra-ui/react'
import { Children } from 'react'


export default function Status({
    label, 
    value, 
    helperText = null, 
    arrowIncrease = null, 
    padding = '1rem',
    width = 'fit-content', 
    minWidth = '100%', 
    maxWidth = 'fit-content', 
    height = 'fit-content', 
    minHeight = 'fit-content', 
    maxHeight = '100%', 
    children}){
    
    return(
    <Box>
        <Card p={padding} w={width} minW={minWidth} maxW={maxWidth} h={height} minH={minHeight} maxH={maxHeight}>
            <StatGroup>
            <Stat>
                {label && <StatLabel>{label}</StatLabel>}
                {value && <StatNumber>{value}</StatNumber>}
                {helperText && <StatHelpText>{arrowIncrease && <StatArrow type={arrowIncrease} />}{helperText}</StatHelpText>}
            </Stat>
            {children && children}
            </StatGroup>
        </Card>
    </Box>
    )
}