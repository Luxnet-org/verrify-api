import { ValueTransformer } from 'typeorm';

const MINOR_UNIT_FACTOR = 100;

export const majorToMinorUnits = (amount: number): string => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Money amount must be a finite non-negative number');
  }

  const minorAmount = Math.round(amount * MINOR_UNIT_FACTOR);
  if (!Number.isSafeInteger(minorAmount)) {
    throw new Error('Money amount exceeds the supported range');
  }

  return minorAmount.toString();
};

export const minorToMajorUnits = (amount: string | number): number => {
  const minorAmount = Number(amount);
  if (!Number.isSafeInteger(minorAmount)) {
    throw new Error('Stored money amount exceeds the supported range');
  }

  return minorAmount / MINOR_UNIT_FACTOR;
};

export const minorUnitMoneyTransformer: ValueTransformer = {
  to: (amount: number): string => majorToMinorUnits(amount),
  from: (amount: string): number => minorToMajorUnits(amount),
};
