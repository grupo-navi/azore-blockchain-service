/**
 * Wallet Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { walletService } from '../../services/wallet/wallet.service';
import { validateAddress, validatePrivateKey, validateNetwork } from '../validators';

const router = Router();

// Create new wallet
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = walletService.createWallet();
    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
});

// Create multiple wallets
router.post('/create-multiple', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count = 1 } = req.body;
    const wallets = walletService.createWallets(count);
    res.json({
      success: true,
      data: wallets,
    });
  } catch (error) {
    next(error);
  }
});

// Import from private key
router.post('/import/private-key', validatePrivateKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { privateKey } = req.body;
    const wallet = walletService.importFromPrivateKey(privateKey);
    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
});

// Import from mnemonic
router.post('/import/mnemonic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mnemonic, index = 0 } = req.body;
    const wallet = walletService.importFromMnemonic(mnemonic, index);
    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
});

// Get balance
router.get(
  '/balance/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const balance = await walletService.getBalance(address, network);
      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Validate address
router.get('/validate/:address', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    const isValid = walletService.isValidAddress(address);
    res.json({
      success: true,
      data: { address, isValid },
    });
  } catch (error) {
    next(error);
  }
});

// Sign message
router.post('/sign', validatePrivateKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { privateKey, message } = req.body;
    const signature = await walletService.signMessage(privateKey, message);
    res.json({
      success: true,
      data: { signature },
    });
  } catch (error) {
    next(error);
  }
});

// Verify message
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, signature } = req.body;
    const address = walletService.verifyMessage(message, signature);
    res.json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
});

// Generate mnemonic
router.get('/mnemonic/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mnemonic = walletService.generateMnemonic();
    res.json({
      success: true,
      data: { mnemonic },
    });
  } catch (error) {
    next(error);
  }
});

// Derive wallets from mnemonic
router.post('/mnemonic/derive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mnemonic, count = 1 } = req.body;
    const wallets = walletService.deriveWalletsFromMnemonic(mnemonic, count);
    res.json({
      success: true,
      data: wallets,
    });
  } catch (error) {
    next(error);
  }
});

export { router as walletRouter };
