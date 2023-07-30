import { ArrowDownIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Card,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { readContract, watchContractEvent, writeContract } from "@wagmi/core";
import { useEffect, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { Link } from "react-router-dom";
import { erc20ABI, erc721ABI, useAccount } from "wagmi";
import { erc1155Info } from "../ABI/erc1155";
import { ercbalance } from "../ABI/ercbalance";
import { escrowInfo } from "../ABI/escrow";
import { alchemy } from "../alchemy/alchemy";
import ERC1155Image from "../assets/ERC1155.svg";
import ERC20Image from "../assets/ERC20.svg";
import ERC721Image from "../assets/ERC721.svg";
import copyToClipboard from "../utils/copy";
import { IPFStoHTTP } from "../utils/ipfstohttps";
import shortenAddress from "../utils/shortenAddress";
import { parseEther } from "viem";
import { errorToast, successToast } from "../utils/toasts";

const outlineColor = "#5CB9FE";
const ONE_DAY_IN_MILISECONDS = 86400000;
const SEPOLIA_ADDRESS_LINK = "https://sepolia.etherscan.io/address/";

const STATUS_BADGE_COLOR_SCHEME = {
  PENDING: "orange",
  COMPLETED: "green",
  CANCELLED: "red",
  REJECTED: "red",
};

const REMOVE_INTERACTIONS_ON = ["COMPLETED", "CANCELLED", "REJECTED"];

const ASSET_IMAGE = {
  ERC20: ERC20Image,
  ERC721: ERC721Image,
  ERC1155: ERC1155Image,
};

export default function TradeCard({
  partyA = "",
  partyB = "",
  title = "Trade Request",
  tradeId = "0x12345678912345678912345678912345678912345678912345678912345678",
  status = "PENDING",
  fromType = "ERC20",
  fromAddress = "0x1111111111111111111111111111111111111111",
  fromTokenId = 0,
  fromAmount = 0,
  toType = "ERC20",
  toAddress = "0x1111111111111111111111111111111111111111",
  toTokenId = 0,
  toAmount = 0,
  dateCreated,
}) {
  const toast = useToast();
  const [isInteracting, setIsInteracting] = useState(false);
  const { isOpen: drawerIsOpen, onOpen: drawerOnOpen, onClose: drawerOnClose } = useDisclosure();
  const {
    isOpen: modalIsOpen,
    onOpen: modalOnOpen,
    onClose: modalOnClose,
  } = useDisclosure({
    onOpen: () => setIsInteracting(true),
    onClose: () => setIsInteracting(false),
  });
  const { address, isConnected } = useAccount();
  const [fromImage, setFromImage] = useState(ASSET_IMAGE[fromType]);
  const [toImage, setToImage] = useState(ASSET_IMAGE[toType]);
  const [interactionType, setInteractionType] = useState();
  const [hasEnoughAllowance, setHasEnoughAllowance] = useState(false);
  const [hasBeenApproved, setHasBeenApproved] = useState(false);
  const [assetOwner, setAssetOwner] = useState(false);
  const [fromAssetInfo, setFromAssetInfo] = useState();
  const [toAssetInfo, setToAssetInfo] = useState();
  async function handleInteraction(_interactionType) {
    try {
      if (_interactionType === "Accept") {
        const { hash } = await writeContract({
          address: escrowInfo.contractAddress,
          abi: escrowInfo.abi,
          functionName: "acceptTrade",
          args: [tradeId],
        });

        const unwatch = watchContractEvent(
          {
            address: escrowInfo.contractAddress,
            abi: escrowInfo.abi,
            eventName: "Completed",
          },
          (data) => {
            if (data[0].args.partyB === address) {
              setIsInteracting(false);
              successToast(`${tradeId} Successfuly Accepted`, hash);
              unwatch();
            }
          },
        );
      }

      if (_interactionType === "Reject") {
        const { hash } = await writeContract({
          address: escrowInfo.contractAddress,
          abi: escrowInfo.abi,
          functionName: "rejectTrade",
          args: [tradeId],
        });

        const unwatch = watchContractEvent(
          {
            address: escrowInfo.contractAddress,
            abi: escrowInfo.abi,
            eventName: "Rejected",
          },
          (data) => {
            if (data[0].args.partyB === address) {
              setIsInteracting(false);
              successToast(`${tradeId} Successfuly Rejected`, hash);
              unwatch();
            }
          },
        );
      }

      if (_interactionType === "Cancel") {
        const { hash } = await writeContract({
          address: escrowInfo.contractAddress,
          abi: escrowInfo.abi,
          functionName: "cancelTrade",
          args: [tradeId],
        });

        const unwatch = watchContractEvent(
          {
            address: escrowInfo.contractAddress,
            abi: escrowInfo.abi,
            eventName: "Cancelled",
          },
          (data) => {
            if (data[0].args.partyA === address) {
              setIsInteracting(false);
              successToast(`${tradeId} Successfuly Cancelled`, hash);
              unwatch();
            }
          },
        );
      }
    } catch (error) {
      errorToast(error);
      setIsInteracting(false);
    }

    modalOnClose();
  }

  useEffect(() => {
    async function getOwnership(assetType, contractAddress, ownerAddress, assetAmount, assetId) {
      if (assetType === "ERC20") {
        const assetInfo = await readContract({
          address: ercbalance.libraryAddress,
          abi: ercbalance.abi,
          functionName: "ownsERC20Amount",
          args: [contractAddress, ownerAddress, assetAmount],
        });
        setAssetOwner(assetInfo);
      }
      if (assetType === "ERC721") {
        const assetInfo = await readContract({
          address: ercbalance.libraryAddress,
          abi: ercbalance.abi,
          functionName: "ownsERC721token",
          args: [contractAddress, ownerAddress, assetId],
        });
        setAssetOwner(assetInfo);
      }
      if (assetType === "ERC1155") {
        const assetInfo = await readContract({
          address: ercbalance.libraryAddress,
          abi: ercbalance.abi,
          functionName: "ownsERC1155Amount",
          args: [contractAddress, ownerAddress, assetId, assetAmount],
        });
        setAssetOwner(assetInfo);
      }
    }

    isConnected && address === partyB && getOwnership(toType, toAddress, address, toAmount, toTokenId);
    isConnected && address === partyA && getOwnership(fromType, fromAddress, address, fromAmount, fromTokenId);
  }, [address, tradeId, drawerIsOpen]);

  useEffect(() => {
    async function getMetadata() {
      if (fromType === "ERC20") {
        const fromMetadata = await alchemy.core.getTokenMetadata(fromAddress);
        setFromImage(fromMetadata.logo || ASSET_IMAGE[fromType]);
        console.log(fromMetadata);
        setFromAssetInfo({
          name: fromMetadata.name,
          collectionName: null,
          symbol: fromMetadata.symbol,
        });
      }
      if (fromType === "ERC721") {
        const fromMetadata = await alchemy.nft.getNftMetadata(fromAddress, fromTokenId, { tokenType: fromType });
        setFromImage(IPFStoHTTP(fromMetadata.rawMetadata?.image_url || fromMetadata.rawMetadata?.image || ASSET_IMAGE[fromType]));
        console.log(fromMetadata);
        setFromAssetInfo({
          name: fromMetadata?.title,
          collectionName: fromMetadata.contract?.name,
          symbol: fromMetadata.contract?.symbol,
        });
      }
      if (fromType === "ERC1155") {
        const fromMetadata = await alchemy.nft.getNftMetadata(fromAddress, fromTokenId, { tokenType: fromType });
        setFromImage(IPFStoHTTP(fromMetadata.rawMetadata?.image_url || fromMetadata.rawMetadata?.image || ASSET_IMAGE[fromType]));
        console.log(fromMetadata);
        setFromAssetInfo({
          name: fromMetadata?.title,
          collectionName: fromMetadata.contract?.name,
          symbol: null,
        });
      }
      if (toType === "ERC20") {
        const toMetadata = await alchemy.core.getTokenMetadata(toAddress);
        setToImage(toMetadata.logo || ASSET_IMAGE[toType]);
        console.log(toMetadata);
        setToAssetInfo({
          name: toMetadata?.name,
          collectionName: null,
          symbol: toMetadata?.symbol,
        });
      }
      if (toType === "ERC721") {
        const toMetadata = await alchemy.nft.getNftMetadata(toAddress, toTokenId, { tokenType: toType });
        setToImage(IPFStoHTTP(toMetadata.rawMetadata?.image_url || toMetadata.rawMetadata?.image || ASSET_IMAGE[toType]));
        console.log(toMetadata);
        setToAssetInfo({
          name: toMetadata?.title,
          collectionName: toMetadata.contract?.name,
          symbol: toMetadata.contract?.symbol,
        });
      }
      if (toType === "ERC1155") {
        const toMetadata = await alchemy.nft.getNftMetadata(toAddress, toTokenId, { tokenType: toType });
        setToImage(IPFStoHTTP(toMetadata.rawMetadata?.image_url || toMetadata.rawMetadata?.image || ASSET_IMAGE[toType]));
        console.log(toMetadata);
        setToAssetInfo({
          name: toMetadata?.title,
          collectionName: toMetadata.contract?.name,
          symbol: null,
        });
      }
    }

    isConnected && getMetadata();
  }, [tradeId, status]);

  useEffect(() => {
    async function approvalChecks() {
      if (!isConnected) return;

      if (toType === "ERC20") {
        setHasEnoughAllowance(
          await readContract({
            address: ercbalance.libraryAddress,
            abi: ercbalance.abi,
            functionName: "hasEnoughERC20Allowance",
            args: [toAddress, address, escrowInfo.contractAddress, parseEther(toAmount)],
          }),
        );
      }
      if (toType === "ERC721") {
        if (!assetOwner) return setHasEnoughAllowance(false);
        setHasEnoughAllowance(
          await readContract({
            address: ercbalance.libraryAddress,
            abi: ercbalance.abi,
            functionName: "hasEnoughERC721Allowance",
            args: [toAddress, escrowInfo.contractAddress, address, toTokenId],
          }),
        );
      }
      if (toType === "ERC1155") {
        setHasEnoughAllowance(
          await readContract({
            address: ercbalance.libraryAddress,
            abi: ercbalance.abi,
            functionName: "hasEnoughERC1155Allowance",
            args: [toAddress, escrowInfo.contractAddress, address],
          }),
        );
      }
    }

    isConnected && address === partyB && !REMOVE_INTERACTIONS_ON.includes(status) && approvalChecks();
  }, [address, tradeId, hasBeenApproved]);

  async function approveAsset() {
    setIsInteracting(true);
    setHasBeenApproved(false);

    try {
      if (toType === "ERC20") {
        const { hash } = await writeContract({
          address: toAddress,
          abi: erc20ABI,
          functionName: "approve",
          args: [escrowInfo.contractAddress, parseEther(toAmount)],
        });

        const unwatch = watchContractEvent(
          {
            address: toAddress,
            abi: erc20ABI,
            eventName: "Approval",
          },
          (data) => {
            if (data[0].args.owner === address) {
              setIsInteracting(false);
              successToast(`${toAddress} Successfuly Approved`, hash);
              setHasBeenApproved(true);
              unwatch();
            }
          },
        );
      }
      if (toType === "ERC721") {
        const { hash } = await writeContract({
          address: toAddress,
          abi: erc721ABI,
          functionName: "setApprovalForAll",
          args: [escrowInfo.contractAddress, true],
        });

        const unwatch = watchContractEvent(
          {
            address: toAddress,
            abi: erc721ABI,
            eventName: "ApprovalForAll",
          },
          (data) => {
            if (data[0].args.owner === address) {
              setIsInteracting(false);
              successToast(`${toAddress} Successfuly Approved`, hash);
              setHasBeenApproved(true);
              unwatch();
            }
          },
        );
      }
      if (toType === "ERC1155") {
        const { hash } = await writeContract({
          address: toAddress,
          abi: erc1155Info.abi,
          functionName: "setApprovalForAll",
          args: [escrowInfo.contractAddress, true],
        });

        const unwatch = watchContractEvent(
          {
            address: toAddress,
            abi: erc1155Info.abi,
            eventName: "ApprovalForAll",
          },
          (data) => {
            if (data[0].args.owner === address) {
              setIsInteracting(false);
              successToast(`${toAddress} Successfuly Approved`, hash);
              setHasBeenApproved(true);
              unwatch();
            }
          },
        );
      }
    } catch (error) {
      errorToast(error);
      setIsInteracting(false);
    }
  }

  return (
    <>
      <Card as={"button"} padding={"0.7rem"} width={{ base: "11rem", md: "11rem", lg: "12rem" }} cursor={"pointer"} onClick={drawerOnOpen} _hover={{ outline: `3px solid ${outlineColor}` }}>
        <Heading size={"sm"} mb={"0.5rem"} noOfLines={2} h={"-webkit-fill-available"}>
          {title}
        </Heading>

        <Flex maxW={"-webkit-fill-available"} flexDirection={"column"} gap={"0.3rem"}>
          <Image aspectRatio={1} src={toImage} alt={toAddress} borderRadius={"0.5rem"} />
          <Flex flexDirection={"row"} gap={"0.5rem"} flexWrap={"wrap"}>
            <Badge w={"fit-content"} colorScheme="blue">
              {toType}
            </Badge>
            {toTokenId && (
              <Badge w={"fit-content"} colorScheme="green">
                Id: {toTokenId}
              </Badge>
            )}
            {toAmount && (
              <Badge w={"fit-content"} colorScheme="gray">
                <small>Amount</small> {toAmount}
              </Badge>
            )}
            {toAssetInfo?.symbol ? <Badge w={"fit-content"}>{toAssetInfo.symbol}</Badge> : ""}
            <Badge w={"fit-content"} colorScheme={STATUS_BADGE_COLOR_SCHEME[status]}>
              {status}
            </Badge>
            {address === partyB && status === "PENDING" && (
              <Badge w={"fit-content"} colorScheme={assetOwner ? "green" : "red"}>
                {assetOwner ? "Owned" : "Not Owned"}
              </Badge>
            )}
            {Date.now() - parseInt(BigInt(dateCreated).toString()) * 1000 <= ONE_DAY_IN_MILISECONDS && (
              <Badge w={"fit-content"} colorScheme="red">
                NEW!
              </Badge>
            )}
          </Flex>
          <Flex overflowX={"clip"} flexDirection={"column"} justifyContent={"start"} gap={"0.2rem"} textAlign={"start"}>
            <Heading noOfLines={2} size={"medium"}>
              {toAssetInfo?.name ? toAssetInfo?.name : toAssetInfo?.collectionName}
            </Heading>
            <Text fontSize={"small"}>{toAssetInfo?.collectionName}</Text>
          </Flex>
        </Flex>
        <Flex fontSize={"xx-small"} mt={"0.3rem"} gap={"0.3rem"} alignItems={"center"}>
          Trade Id: {shortenAddress(tradeId)}
        </Flex>
      </Card>

      <Drawer isOpen={drawerIsOpen} onClose={drawerOnClose} size={{ base: "sm", md: "md", lg: "lg" }}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>{title}</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <Flex flexDirection={"column"} gap={"1rem"}>
              <Flex gap={"0.5rem"} alignItems={"center"}>
                Trade Id: {shortenAddress(tradeId)} <FaCopy onClick={() => copyToClipboard(tradeId)} cursor={"pointer"} />
              </Flex>
              <Text>Date Created: {new Date(parseInt(BigInt(dateCreated).toString()) * 1000).toLocaleDateString()}</Text>
              <Flex flexDirection={"column"} alignItems={"start"} justifyContent={"space-evenly"} h={"100%"}>
                <Flex gap={"0.5rem"} alignItems={"center"}>
                  <Heading size={"sm"}>
                    {partyA === address && (
                      <>
                        <Badge variant={"solid"} p={"0.5rem"} borderRadius={"1rem"} colorScheme="blue">
                          You
                        </Badge>{" "}
                      </>
                    )}
                    From:{" "}
                    <Link to={`${SEPOLIA_ADDRESS_LINK}${partyA}`} target="_blank">
                      {shortenAddress(partyA)}
                    </Link>
                  </Heading>{" "}
                  <FaCopy onClick={() => copyToClipboard(partyA)} cursor={"pointer"} />
                </Flex>
                <Flex
                  flexDirection={{
                    base: "column",
                    md: "column",
                    lg: "row",
                    xl: "row",
                  }}
                  gap={"1rem"}
                  mt={"1rem"}
                  maxW={"-webkit-fill-available"}
                  overflowX={"clip"}
                >
                  <Image width={"10rem"} aspectRatio={1} src={fromImage} alt={fromAddress} borderRadius={"0.5rem"} />
                  <Box>
                    <Flex gap={"0.5rem"}>
                      <Badge p={"0.2rem"} colorScheme="blue">
                        {fromType}
                      </Badge>
                      {fromTokenId && <Badge p={"0.2rem"}>Id: {fromTokenId}</Badge>}
                      {fromAmount && <Badge p={"0.2rem"}>Amount: {fromAmount}</Badge>}
                      {address === partyA && status === "PENDING" && (
                        <Badge p={"0.2rem"} colorScheme={assetOwner ? "green" : "red"}>
                          {assetOwner ? "Owned" : "Not Owned"}
                        </Badge>
                      )}
                    </Flex>
                    <Flex overflowX={"clip"} flexDirection={"column"}>
                      <Heading noOfLines={2} size={"md"}>
                        {fromAssetInfo?.name}
                      </Heading>
                      <Text noOfLines={2}>{fromAssetInfo?.collectionName}</Text>
                      <Flex gap={"0.5rem"} alignItems={"center"}>
                        <Link to={`${SEPOLIA_ADDRESS_LINK}${fromAddress}`} target="_blank">
                          {shortenAddress(fromAddress)}
                        </Link>{" "}
                        <FaCopy onClick={() => copyToClipboard(fromAddress)} cursor={"pointer"} />
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
                <Flex w={100} my={"1rem"} justifyContent={"center"}>
                  <ArrowDownIcon />
                </Flex>
                <Flex gap={"0.5rem"} alignItems={"center"}>
                  <Heading size={"sm"}>
                    {partyB === address && (
                      <>
                        <Badge variant={"solid"} p={"0.5rem"} borderRadius={"1rem"} colorScheme="blue">
                          You
                        </Badge>{" "}
                      </>
                    )}
                    To:{" "}
                    <Link to={`${SEPOLIA_ADDRESS_LINK}${partyB}`} target="_blank">
                      {shortenAddress(partyB)}
                    </Link>
                  </Heading>{" "}
                  <FaCopy onClick={() => copyToClipboard(partyB)} cursor={"pointer"} />
                </Flex>
                <Flex
                  flexDirection={{
                    base: "column",
                    md: "column",
                    lg: "row",
                    xl: "row",
                  }}
                  gap={"1rem"}
                  mt={"1rem"}
                  overflowX={"clip"}
                  maxW={"-webkit-fill-available"}
                >
                  <Image width={"10rem"} aspectRatio={1} src={toImage} alt={toAddress} borderRadius={"0.5rem"} />
                  <Box>
                    <Flex gap={"0.5rem"}>
                      <Badge p={"0.2rem"} colorScheme="blue">
                        {toType}
                      </Badge>
                      {toTokenId && <Badge p={"0.2rem"}>Id: {toTokenId}</Badge>}
                      {toAmount && <Badge p={"0.2rem"}>Amount: {toAmount}</Badge>}
                      {address === partyB && status === "PENDING" && (
                        <Badge p={"0.2rem"} colorScheme={assetOwner ? "green" : "red"}>
                          {assetOwner ? "Owned" : "Not Owned"}
                        </Badge>
                      )}
                    </Flex>
                    <Flex overflowX={"clip"} flexDirection={"column"}>
                      <Heading noOfLines={2} size={"md"}>
                        {toAssetInfo?.name}
                      </Heading>
                      <Text noOfLines={2}>{toAssetInfo?.collectionName}</Text>
                      <Flex gap={"0.5rem"} alignItems={"center"}>
                        <Link to={`${SEPOLIA_ADDRESS_LINK}${toAddress}`} target="_blank">
                          {shortenAddress(toAddress)}
                        </Link>{" "}
                        <FaCopy onClick={() => copyToClipboard(toAddress)} cursor={"pointer"} />
                      </Flex>
                    </Flex>
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          </DrawerBody>

          <DrawerFooter gap={"1rem"}>
            {assetOwner && !hasEnoughAllowance && !REMOVE_INTERACTIONS_ON.includes(status) && address === partyB && (
              <Button isLoading={isInteracting} w={"fit-content"} colorScheme="blue" variant={"solid"} onClick={approveAsset}>
                Approve
              </Button>
            )}
            {assetOwner && hasEnoughAllowance && !REMOVE_INTERACTIONS_ON.includes(status) && address === partyB && (
              <Button
                isLoading={isInteracting}
                onClick={() => {
                  modalOnOpen();
                  setInteractionType("Accept");
                }}
                colorScheme="blue"
                variant="solid"
              >
                Accept
              </Button>
            )}
            {!REMOVE_INTERACTIONS_ON.includes(status) && address === partyB && (
              <Button
                isLoading={isInteracting}
                onClick={() => {
                  modalOnOpen();
                  setInteractionType("Reject");
                }}
                colorScheme="red"
                variant="solid"
              >
                Reject
              </Button>
            )}
            {!REMOVE_INTERACTIONS_ON.includes(status) && address === partyA && (
              <Button
                isLoading={isInteracting}
                onClick={() => {
                  modalOnOpen();
                  setInteractionType("Cancel");
                }}
                colorScheme="red"
                variant="solid"
              >
                Cancel
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={modalIsOpen} onClose={modalOnClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr={"1rem"}>Are You Sure You Want To Proceed?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Proceeding in the trade will automatically execute the trade and there is no turning back.</Text>
            <Spacer my={"1rem"} />
            <Text>In the case of one party not having the required asset/s for this trade, the trade request will revert automatically and will not proceed until both party has the required assets for the trade.</Text>
          </ModalBody>

          <ModalFooter>
            <Flex gap={"1rem"}>
              <Button colorScheme={"blue"} onClick={() => handleInteraction(interactionType)}>
                Yes
              </Button>
              <Button colorScheme={"red"} onClick={modalOnClose}>
                No
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
