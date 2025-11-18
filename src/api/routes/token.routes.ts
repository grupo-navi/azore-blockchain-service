/**
 * Token Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { tokenService } from '../../services/token/token.service';
import { validateAddress, validatePrivateKey, validateNetwork, validateAmount } from '../validators';

const router = Router();

// Get token info
router.get(
  '/info/:tokenAddress',
  validateAddress('tokenAddress'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress } = req.params;
      const network = (req as any).network;
      const info = await tokenService.getTokenInfo(tokenAddress, network);
      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get token balance
router.get(
  '/balance/:tokenAddress/:walletAddress',
  validateAddress('tokenAddress'),
  validateAddress('walletAddress'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, walletAddress } = req.params;
      const network = (req as any).network;
      const balance = await tokenService.getBalance(tokenAddress, walletAddress, network);
      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Transfer tokens
router.post(
  '/transfer',
  validatePrivateKey,
  validateAmount,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, privateKey, toAddress, amount, options } = req.body;
      const network = (req as any).network;
      const receipt = await tokenService.transfer(
        tokenAddress,
        privateKey,
        toAddress,
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

// Approve tokens
router.post(
  '/approve',
  validatePrivateKey,
  validateAmount,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, privateKey, spenderAddress, amount, options } = req.body;
      const network = (req as any).network;
      const receipt = await tokenService.approve(
        tokenAddress,
        privateKey,
        spenderAddress,
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

// Get allowance
router.get(
  '/allowance/:tokenAddress/:ownerAddress/:spenderAddress',
  validateAddress('tokenAddress'),
  validateAddress('ownerAddress'),
  validateAddress('spenderAddress'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, ownerAddress, spenderAddress } = req.params;
      const network = (req as any).network;
      const allowance = await tokenService.getAllowance(
        tokenAddress,
        ownerAddress,
        spenderAddress,
        network
      );
      res.json({
        success: true,
        data: allowance,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mint tokens
router.post(
  '/mint',
  validatePrivateKey,
  validateAmount,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, privateKey, toAddress, amount, options } = req.body;
      const network = (req as any).network;
      const receipt = await tokenService.mint(
        tokenAddress,
        privateKey,
        toAddress,
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

// Burn tokens
router.post(
  '/burn',
  validatePrivateKey,
  validateAmount,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tokenAddress, privateKey, amount, options } = req.body;
      const network = (req as any).network;
      const receipt = await tokenService.burn(
        tokenAddress,
        privateKey,
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

export { router as tokenRouter };
