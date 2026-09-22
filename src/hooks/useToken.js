// ERC-20 Token interaction hook — Sepolia testnet USDT
// Contract: 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0 (Ethereum Sepolia)

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 decimal

// Sepolia testnet USDT
export const USDT_SEPOLIA = {
  address:  '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
  symbol:   'USDT',
  decimals: 6,
  network:  'Ethereum Sepolia',
  chainId:  SEPOLIA_CHAIN_ID,
  explorer: 'https://sepolia.etherscan.io',
};

// Minimal ERC-20 ABI (only what we need)
const ERC20_ABI = {
  balanceOf:   '0x70a08231', // balanceOf(address)
  decimals:    '0x313ce567', // decimals()
  symbol:      '0x95d89b41', // symbol()
  transfer:    '0xa9059cbb', // transfer(address,uint256)
  approve:     '0x095ea7b3', // approve(address,uint256)
  allowance:   '0xdd62ed3e', // allowance(address,address)
};

function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return null;
  if (window.ethereum.providers?.length) {
    return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
  }
  return window.ethereum;
}

// Encode function call with params
function encodeCall(selector, ...params) {
  let data = selector;
  params.forEach(p => {
    const hex = BigInt(p).toString(16).padStart(64, '0');
    data += hex;
  });
  return data;
}

// Parse hex balance to human readable
function parseUnits(hex, decimals = 6) {
  const raw = BigInt(hex);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac  = raw % divisor;
  return parseFloat(`${whole}.${frac.toString().padStart(decimals, '0')}`);
}

// Format human amount to wei (with decimals)
function toWei(amount, decimals = 6) {
  return BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
}

export async function getUSDTBalance(walletAddress) {
  const prov = getProvider();
  if (!prov || !walletAddress) return null;
  try {
    const data = encodeCall(ERC20_ABI.balanceOf, walletAddress);
    const result = await prov.request({
      method: 'eth_call',
      params: [{ to: USDT_SEPOLIA.address, data }, 'latest'],
    });
    return parseUnits(result, USDT_SEPOLIA.decimals);
  } catch (e) {
    console.warn('getUSDTBalance error:', e.message);
    return null;
  }
}

export async function approveUSDT(spender, amount) {
  const prov = getProvider();
  if (!prov) throw new Error('No wallet provider');
  const accounts = await prov.request({ method: 'eth_accounts' });
  if (!accounts.length) throw new Error('Wallet not connected');

  const amountWei = toWei(amount, USDT_SEPOLIA.decimals);
  const data = encodeCall(ERC20_ABI.approve, spender, amountWei);

  const txHash = await prov.request({
    method: 'eth_sendTransaction',
    params: [{
      from:  accounts[0],
      to:    USDT_SEPOLIA.address,
      data,
      gas:   '0x186A0', // 100k gas
    }],
  });
  return txHash;
}

export async function transferUSDT(to, amount) {
  const prov = getProvider();
  if (!prov) throw new Error('No wallet provider');
  const accounts = await prov.request({ method: 'eth_accounts' });
  if (!accounts.length) throw new Error('Wallet not connected');

  const amountWei = toWei(amount, USDT_SEPOLIA.decimals);
  const data = encodeCall(ERC20_ABI.transfer, to, amountWei);

  const txHash = await prov.request({
    method: 'eth_sendTransaction',
    params: [{
      from:  accounts[0],
      to:    USDT_SEPOLIA.address,
      data,
      gas:   '0x186A0',
    }],
  });
  return txHash;
}

export async function ensureSepoliaNetwork() {
  const prov = getProvider();
  if (!prov) return false;
  try {
    const current = await prov.request({ method: 'eth_chainId' });
    if (current === SEPOLIA_CHAIN_ID) return true;

    // Switch to Sepolia
    try {
      await prov.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (switchErr) {
      // Chain not added — add it
      if (switchErr.code === 4902) {
        await prov.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         SEPOLIA_CHAIN_ID,
            chainName:       'Ethereum Sepolia',
            nativeCurrency:  { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls:         ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        return true;
      }
      return false;
    }
  } catch {
    return false;
  }
}
