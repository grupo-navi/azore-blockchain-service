/**
 * Explorer Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { azoreScanService } from '../../services/explorer/azorescan.service';
import { validateAddress, validateNetwork, validatePagination } from '../validators';

const router = Router();

// Get balance
router.get(
  '/balance/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getBalance(address, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get complete balances
router.get(
  '/balances/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getCompleteBalances(address, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get multi balance
router.post('/balance/multi', validateNetwork, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { addresses } = req.body;
    const network = (req as any).network;
    const result = await azoreScanService.getMultiBalance(addresses, network);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get token list
router.get(
  '/tokens/:address',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getTokenList(address, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get address transactions
router.get(
  '/transactions/:address',
  validateAddress('address'),
  validateNetwork,
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const { page, offset } = (req as any).pagination;
      const result = await azoreScanService.getAddressTransactions(address, network, page, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get internal transactions
router.get(
  '/transactions/:address/internal',
  validateAddress('address'),
  validateNetwork,
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const { page, offset } = (req as any).pagination;
      const result = await azoreScanService.getInternalTransactions(address, network, page, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get token transfers
router.get(
  '/transfers/:address',
  validateAddress('address'),
  validateNetwork,
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const { page, offset } = (req as any).pagination;
      const contractAddress = req.query.contractAddress as string;
      const result = await azoreScanService.getTokenTransfers(
        address,
        network,
        contractAddress,
        page,
        offset
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get token holders
router.get(
  '/holders/:contractAddress',
  validateAddress('contractAddress'),
  validateNetwork,
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress } = req.params;
      const network = (req as any).network;
      const { page, offset } = (req as any).pagination;
      const result = await azoreScanService.getTokenHolders(contractAddress, network, page, offset);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get contract ABI
router.get(
  '/contract/:address/abi',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getContractABI(address, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get contract source code
router.get(
  '/contract/:address/source',
  validateAddress('address'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getContractSourceCode(address, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get token info
router.get(
  '/token/:contractAddress',
  validateAddress('contractAddress'),
  validateNetwork,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contractAddress } = req.params;
      const network = (req as any).network;
      const result = await azoreScanService.getTokenInfo(contractAddress, network);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get cache stats
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = azoreScanService.getCacheStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Clear cache
router.post('/cache/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    azoreScanService.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared',
    });
  } catch (error) {
    next(error);
  }
});

export { router as explorerRouter };
