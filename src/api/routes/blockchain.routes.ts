/**
 * Blockchain Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { blockchainService } from '../../services/blockchain/blockchain.service';
import { validateAddress, validateNetwork } from '../validators';

const router = Router();

// Test connection
router.get('/connection', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const network = (req as any).network;
    const result = await blockchainService.testConnection(network);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Get network info
router.get('/network', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const network = (req as any).network;
    const info = blockchainService.getNetworkInfo(network);
    res.json({
      success: true,
      data: info,
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
      const balance = await blockchainService.getBalance(address, network);
      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get gas price
router.get('/gas-price', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const network = (req as any).network;
    const gasPrice = await blockchainService.getGasPrice(network);
    res.json({
      success: true,
      data: gasPrice,
    });
  } catch (error) {
    next(error);
  }
});

// Get block
router.get('/block/:blockNumber', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { blockNumber } = req.params;
    const network = (req as any).network;
    const block = blockNumber === 'latest'
      ? await blockchainService.getBlock('latest', network)
      : await blockchainService.getBlock(parseInt(blockNumber), network);
    res.json({
      success: true,
      data: block,
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction
router.get('/transaction/:txHash', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { txHash } = req.params;
    const network = (req as any).network;
    const tx = await blockchainService.getTransaction(txHash, network);
    res.json({
      success: true,
      data: tx,
    });
  } catch (error) {
    next(error);
  }
});

// Validate address
router.get('/validate/:address', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    const isValid = blockchainService.isValidAddress(address);
    res.json({
      success: true,
      data: { address, isValid },
    });
  } catch (error) {
    next(error);
  }
});

export { router as blockchainRouter };
