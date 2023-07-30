import { Flex, Text } from "@chakra-ui/react";

export default function NotFound() {
  return (
    <Flex justifyContent={"center"} alignItems={"center"} w={"100dvw"} h={"100dvh"}>
      <Text fontSize={"xx-large"}>404 | NOT FOUND</Text>
    </Flex>
  );
}
