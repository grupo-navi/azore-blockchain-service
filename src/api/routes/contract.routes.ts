/**
 * Contract Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { contractService } from '../../services/contract/contract.service';
import { validateAddress, validatePrivateKey, validateNetwork, validateABI } from '../validators';

const router = Router();

// Deploy contract
router.post(
  '/deploy',
  validatePrivateKey,
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { privateKey, abi, bytecode, constructorArgs, options } = req.body;
      const network = (req as any).network;
      const result = await contractService.deploy(
        privateKey,
        { abi, bytecode, constructorArgs, options },
        network
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Call contract function (read-only)
router.post(
  '/call',
  validateAddress('contractAddress'),
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress, abi, functionName, params = [] } = req.body;
      const network = (req as any).network;
      const result = await contractService.call(
        contractAddress,
        abi,
        functionName,
        params,
        network
      );
      res.json({
        success: true,
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Execute contract function (write)
router.post(
  '/execute',
  validateAddress('contractAddress'),
  validatePrivateKey,
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress, abi, functionName, params = [], privateKey, options } = req.body;
      const network = (req as any).network;
      const receipt = await contractService.execute(
        contractAddress,
        abi,
        functionName,
        params,
        privateKey,
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

// Check if address is contract
router.get(
  '/is-contract/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const isContract = await contractService.isContract(address, network);
      res.json({
        success: true,
        data: { address, isContract },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get contract code
router.get(
  '/code/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const code = await contractService.getCode(address, network);
      res.json({
        success: true,
        data: { code },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Check role
router.post(
  '/has-role',
  validateAddress('contractAddress'),
  validateAddress('account'),
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress, abi, role, account } = req.body;
      const network = (req as any).network;
      const hasRole = await contractService.hasRole(
        contractAddress,
        abi,
        role,
        account,
        network
      );
      res.json({
        success: true,
        data: { hasRole },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Grant role
router.post(
  '/grant-role',
  validateAddress('contractAddress'),
  validateAddress('account'),
  validatePrivateKey,
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress, abi, role, account, privateKey, options } = req.body;
      const network = (req as any).network;
      const receipt = await contractService.grantRole(
        contractAddress,
        abi,
        role,
        account,
        privateKey,
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

// Revoke role
router.post(
  '/revoke-role',
  validateAddress('contractAddress'),
  validateAddress('account'),
  validatePrivateKey,
  validateABI,
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress, abi, role, account, privateKey, options } = req.body;
      const network = (req as any).network;
      const receipt = await contractService.revokeRole(
        contractAddress,
        abi,
        role,
        account,
        privateKey,
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

export { router as contractRouter };
