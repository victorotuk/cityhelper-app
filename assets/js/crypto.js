/* global ethers */
// ============================================
// CRYPTO PAYMENTS — MetaMask, WalletConnect, Trust Wallet
// ============================================

// Your receiving wallet address (CHANGE THIS TO YOUR ACTUAL ADDRESS)
const RECEIVING_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB08';

// Supported chains
const CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io/tx/' },
  137: { name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com/tx/' },
  8453: { name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org/tx/' },
  56: { name: 'BNB Chain', symbol: 'BNB', explorer: 'https://bscscan.com/tx/' },
  43114: { name: 'Avalanche', symbol: 'AVAX', explorer: 'https://snowtrace.io/tx/' }
};

let provider = null;
let signer = null;
let connectedAddress = null;
let currentChainId = null;

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  initCryptoPayments();
});

async function initCryptoPayments() {
  const cryptoBtns = document.querySelectorAll('.crypto-btn');
  // Check if wallet is already connected
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch {
      console.log('No existing connection');
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        connectedAddress = accounts[0];
        updateWalletStatus();
      } else {
        disconnectWallet();
      }
    });

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId) => {
      currentChainId = parseInt(chainId, 16);
      updateWalletStatus();
    });
  }

  // Add click handlers to crypto buttons
  cryptoBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const amount = btn.getAttribute('data-amount');
      const tier = btn.getAttribute('data-tier');
      
      if (!connectedAddress) {
        await connectWallet();
      }
      
      if (connectedAddress) {
        await sendPayment(amount, tier);
      }
    });
  });
}

async function connectWallet() {
  const walletStatus = document.getElementById('wallet-status');
  
  if (!window.ethereum) {
    // No wallet detected - show options
    const choice = confirm(
      'No wallet detected!\n\n' +
      'Click OK to install MetaMask, or Cancel to use WalletConnect.\n\n' +
      '(Trust Wallet users: open this page in Trust Wallet browser)'
    );
    
    if (choice) {
      window.open('https://metamask.io/download/', '_blank');
    } else {
      // For WalletConnect, we'd need more setup - show instructions
      alert(
        'To use WalletConnect:\n\n' +
        '1. Open your mobile wallet app\n' +
        '2. Look for "WalletConnect" or scan QR option\n' +
        '3. Scan the QR code when prompted\n\n' +
        'For now, please install MetaMask or use Trust Wallet browser.'
      );
    }
    return;
  }

  try {
    walletStatus.textContent = 'Connecting...';
    
    // Request connection
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    connectedAddress = accounts[0];
    currentChainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
    
    // Set up ethers provider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    
    updateWalletStatus();
    
  } catch (error) {
    console.error('Connection failed:', error);
    walletStatus.textContent = 'Connection failed. Try again.';
  }
}

function disconnectWallet() {
  connectedAddress = null;
  provider = null;
  signer = null;
  currentChainId = null;
  updateWalletStatus();
}

function updateWalletStatus() {
  const walletStatus = document.getElementById('wallet-status');
  
  if (connectedAddress) {
    const shortAddress = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
    const chain = CHAINS[currentChainId] || { name: 'Unknown', symbol: '?' };
    walletStatus.innerHTML = `
      <span style="color: var(--accent);">●</span> 
      Connected: ${shortAddress} on ${chain.name}
    `;
  } else {
    walletStatus.textContent = 'Wallet not connected';
  }
}

async function sendPayment(amount, tier) {
  const walletStatus = document.getElementById('wallet-status');
  
  if (!signer) {
    alert('Please connect your wallet first');
    return;
  }

  const chain = CHAINS[currentChainId] || { name: 'Unknown', symbol: 'ETH' };
  
  // Confirm payment
  const confirmed = confirm(
    `Send ${amount} ${chain.symbol} for ${tier} tier?\n\n` +
    `Network: ${chain.name}\n` +
    `To: ${RECEIVING_ADDRESS.slice(0, 10)}...${RECEIVING_ADDRESS.slice(-8)}`
  );
  
  if (!confirmed) return;

  try {
    walletStatus.textContent = 'Confirming in wallet...';
    
    // Send transaction
    const tx = await signer.sendTransaction({
      to: RECEIVING_ADDRESS,
      value: ethers.parseEther(amount)
    });
    
    walletStatus.textContent = 'Transaction sent! Waiting for confirmation...';
    
    // Wait for confirmation
    await tx.wait();
    
    const explorer = chain.explorer || '';
    walletStatus.innerHTML = `
      <span style="color: #4ade80;">✓</span> Payment confirmed! 
      <a href="${explorer}${tx.hash}" target="_blank" style="color: var(--accent);">View transaction</a>
    `;
    
    // Show success message
    alert(
      `Payment successful!\n\n` +
      `Tier: ${tier}\n` +
      `Amount: ${amount} ${chain.symbol}\n` +
      `Transaction: ${tx.hash.slice(0, 20)}...\n\n` +
      `We'll activate your account within 24 hours.`
    );
    
  } catch (error) {
    console.error('Transaction failed:', error);
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      walletStatus.textContent = 'Transaction cancelled';
    } else if (error.message.includes('insufficient funds')) {
      walletStatus.textContent = 'Insufficient funds in wallet';
    } else {
      walletStatus.textContent = 'Transaction failed. Please try again.';
    }
  }
}

