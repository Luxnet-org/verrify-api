import * as JSONbig from 'json-bigint';

const parser = JSONbig({
  storeAsString: true,
  protoAction: 'error',
  constructorAction: 'error',
});

export const parseStringPreservingJson = <T>(value: string): T =>
  parser.parse(value) as T;
