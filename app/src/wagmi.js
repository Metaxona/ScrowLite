import { configureChains, createConfig, sepolia, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultWallets, connectorsForWallets  } from '@rainbow-me/rainbowkit' 
import {
    injectedWallet,
    rainbowWallet,
    trustWallet,
    walletConnectWallet,
    metaMaskWallet,
    braveWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { polygon, bsc } from 'viem/chains';


export const { chains, publicClient } = configureChains(
  [sepolia],
  [
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'WhitelistApp',
  projectId: '10572be452812a0d483a4ec33344be81',
  chains
});

// const connectors = connectorsForWallets([
//     {
//       groupName: 'Recommended',
//       wallets: [
//         injectedWallet({ chains }),
//         metaMaskWallet({ projectId: "metamask" ,chains }),
//     ],
//     },
//     {
//         groupName: "Others",
//         wallets: [
//             braveWallet({chains}),
//             trustWallet({chains}),
//             walletConnectWallet({ projectId: '10572be452812a0d483a4ec33344be81' , chains }),
//             // rainbowWallet({projectId, chains}),
//         ]
//     }
//   ]);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})