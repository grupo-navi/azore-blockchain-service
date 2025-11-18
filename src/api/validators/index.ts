/**
 * Request Validators
 */

import { Request, Response, NextFunction } from 'express';
import { isValidAddress, isValidPrivateKey, isValidTransactionHash } from '../../utils';
import { ValidationError } from '../middlewares/error.middleware';
import { Network } from '../../types';

/**
 * Validate address parameter
 */
export function validateAddress(field: string = 'address') {
  return (req: Request, res: Response, next: NextFunction) => {
    const address = req.params[field] || req.body[field] || req.query[field];

    if (!address) {
      return next(new ValidationError(`${field} is required`));
    }

    if (!isValidAddress(address as string)) {
      return next(new ValidationError(`Invalid ${field}`));
    }

    next();
  };
}

/**
 * Validate private key in body
 */
export function validatePrivateKey(req: Request, res: Response, next: NextFunction) {
  const { privateKey } = req.body;

  if (!privateKey) {
    return next(new ValidationError('privateKey is required'));
  }

  if (!isValidPrivateKey(privateKey)) {
    return next(new ValidationError('Invalid privateKey'));
  }

  next();
}

/**
 * Validate transaction hash
 */
export function validateTxHash(req: Request, res: Response, next: NextFunction) {
  const txHash = req.params.txHash || req.body.txHash || req.query.txHash;

  if (!txHash) {
    return next(new ValidationError('txHash is required'));
  }

  if (!isValidTransactionHash(txHash as string)) {
    return next(new ValidationError('Invalid transaction hash'));
  }

  next();
}

/**
 * Validate network parameter
 */
export function validateNetwork(req: Request, res: Response, next: NextFunction) {
  const network = req.query.network || req.body.network || 'testnet';

  if (network !== 'testnet' && network !== 'mainnet') {
    return next(new ValidationError('Invalid network. Must be "testnet" or "mainnet"'));
  }

  // Add to request for easy access
  (req as any).network = network as Network;

  next();
}

/**
 * Validate amount (positive number)
 */
export function validateAmount(req: Request, res: Response, next: NextFunction) {
  const { amount } = req.body;

  if (!amount) {
    return next(new ValidationError('amount is required'));
  }

  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return next(new ValidationError('Invalid amount. Must be a positive number'));
  }

  next();
}

/**
 * Validate ABI
 */
export function validateABI(req: Request, res: Response, next: NextFunction) {
  const { abi } = req.body;

  if (!abi) {
    return next(new ValidationError('abi is required'));
  }

  if (!Array.isArray(abi)) {
    return next(new ValidationError('Invalid ABI. Must be an array'));
  }

  next();
}

/**
 * Validate pagination
 */
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string) || 1;
  const offset = parseInt(req.query.offset as string) || 10;

  if (page < 1) {
    return next(new ValidationError('Invalid page. Must be >= 1'));
  }

  if (offset < 1 || offset > 100) {
    return next(new ValidationError('Invalid offset. Must be between 1 and 100'));
  }

  (req as any).pagination = { page, offset };

  next();
}
