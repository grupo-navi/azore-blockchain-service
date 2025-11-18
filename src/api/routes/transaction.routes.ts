/**
 * Transaction Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { transactionService } from '../../services/transaction/transaction.service';
import { validateAddress, validatePrivateKey, validateNetwork, validateAmount, validateTxHash } from '../validators';

const router = Router();

// Send transaction
router.post(
  '/send',
  validatePrivateKey,
  validateAddress('to'),
  validateAmount,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { privateKey, to, amount, options } = req.body;
      const network = (req as any).network;
      const receipt = await transactionService.sendTransaction(
        privateKey,
        to,
        amount,
        network,
        options
      );
      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction
router.get(
  '/:txHash',
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { txHash } = req.params;
      const network = (req as any).network;
      const tx = await transactionService.getTransaction(txHash, network);
      res.json({
        success: true,
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get transaction receipt
router.get(
  '/:txHash/receipt',
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { txHash } = req.params;
      const network = (req as any).network;
      const receipt = await transactionService.getTransactionReceipt(txHash, network);
      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Wait for transaction
router.post(
  '/wait',
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { txHash, confirmations, timeout } = req.body;
      const network = (req as any).network;
      const receipt = await transactionService.waitForTransaction(
        txHash,
        confirmations,
        network,
        timeout
      );
      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get gas price
router.get('/gas/price', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const network = (req as any).network;
    const gasPrice = await transactionService.getGasPrice(network);
    res.json({
      success: true,
      data: gasPrice,
    });
  } catch (error) {
    next(error);
  }
});

// Estimate gas
router.post('/gas/estimate', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, data, from, value } = req.body;
    const network = (req as any).network;
    const gasEstimate = await transactionService.estimateGas(to, data, from, value, network);
    res.json({
      success: true,
      data: gasEstimate,
    });
  } catch (error) {
    next(error);
  }
});

// Get nonce
router.get(
  '/nonce/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const nonce = await transactionService.getNonce(address, network);
      res.json({
        success: true,
        data: { nonce },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get confirmations
router.get(
  '/:txHash/confirmations',
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { txHash } = req.params;
      const network = (req as any).network;
      const confirmations = await transactionService.getConfirmations(txHash, network);
      res.json({
        success: true,
        data: { confirmations },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Cancel transaction
router.post(
  '/cancel',
  validatePrivateKey,
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { privateKey, txHash } = req.body;
      const network = (req as any).network;
      const receipt = await transactionService.cancelTransaction(privateKey, txHash, network);
      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Speed up transaction
router.post(
  '/speed-up',
  validatePrivateKey,
  validateTxHash,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { privateKey, txHash, gasPriceMultiplier = 1.2 } = req.body;
      const network = (req as any).network;
      const receipt = await transactionService.speedUpTransaction(
        privateKey,
        txHash,
        gasPriceMultiplier,
        network
      );
      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as transactionRouter };
