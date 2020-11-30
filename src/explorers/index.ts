import {
  BitcoinTransactionAPIArray as BitcoinExplorers,
  EthereumTransactionAPIArray as EthereumExplorers,
  explorerFactory,
  TExplorerFunctionsArray
} from './explorer';
import { TRANSACTION_APIS } from '../constants/api';
import { ExplorerAPI } from '../models/Explorers';
import { ethereumRPCParsingFunction } from './rpc/ethereum';

export interface TDefaultExplorersPerBlockchain {
  bitcoin: TExplorerFunctionsArray;
  ethereum: TExplorerFunctionsArray;
}

export type TExplorerAPIs = TDefaultExplorersPerBlockchain & {
  custom?: TExplorerFunctionsArray;
};

function cleanupExplorerAPIs (explorerAPIs: ExplorerAPI[], indexes: number[]): void {
  indexes.forEach(index => explorerAPIs.splice(index, 1)); // remove modified explorer to avoid setting them in the custom option later
}

function validateOverwritingExplorer (explorerAPI: ExplorerAPI): boolean {
  if (explorerAPI.key && !explorerAPI.keyPropertyName) {
    throw new Error(`Property keyPropertyName is not set for ${explorerAPI.serviceName}. Cannot pass the key property to the service.`);
  }
  return true;
}

const overwrittenIndexes: number[] = [];

export function overwriteDefaultExplorers (explorerAPIs: ExplorerAPI[] = [], defaultExplorers: ExplorerAPI[] = [], lastSetOfExplorers = false): ExplorerAPI[] {
  const userSetExplorerAPIsName = explorerAPIs
    .map(explorerAPI => explorerAPI.serviceName)
    .filter(name => !!name)
    .filter(name => !!TRANSACTION_APIS[name]);

  if (userSetExplorerAPIsName.length) {
    return defaultExplorers.reduce((overwrittenExplorers, defaultExplorerAPI) => {
      if (userSetExplorerAPIsName.includes(defaultExplorerAPI.serviceName)) {
        const immutableExplorerAPI = Object.assign({}, defaultExplorerAPI);
        const customSetExplorerAPI = explorerAPIs.find(customExplorerAPI => customExplorerAPI.serviceName === defaultExplorerAPI.serviceName);
        if (validateOverwritingExplorer(customSetExplorerAPI)) {
          const overwrittenExplorerAPI = Object.assign(immutableExplorerAPI, customSetExplorerAPI);
          overwrittenExplorers.push(overwrittenExplorerAPI);
          const explorerAPIsIndex = explorerAPIs.findIndex(explorerAPI => explorerAPI.serviceName === overwrittenExplorerAPI.serviceName);
          if (!overwrittenIndexes.includes(explorerAPIsIndex)) {
            overwrittenIndexes.push(explorerAPIsIndex);
          }
        }
      } else {
        overwrittenExplorers.push(defaultExplorerAPI);
      }
      if (lastSetOfExplorers) {
        cleanupExplorerAPIs(explorerAPIs, overwrittenIndexes);
      }
      return overwrittenExplorers;
    }, []);
  }

  return defaultExplorers;
}

export function getDefaultExplorers (explorerAPIs?: ExplorerAPI[]): TDefaultExplorersPerBlockchain {
  return {
    bitcoin: explorerFactory(overwriteDefaultExplorers(explorerAPIs, BitcoinExplorers)),
    ethereum: explorerFactory(overwriteDefaultExplorers(explorerAPIs, EthereumExplorers))
  };
}

function rpcFactory (explorerAPIs: ExplorerAPI[]) {
  return explorerAPIs.map(explorerAPI => {
    if (!explorerAPI.parsingFunction) {
      explorerAPI.parsingFunction = ethereumRPCParsingFunction
    }
    return explorerAPI;
  }).map(explorerAPI => (
    {
      getTxData: async (transactionId) => await explorerAPI.parsingFunction(explorerAPI.serviceURL, transactionId),
      priority: explorerAPI.priority
    }
  ));
}

export function getRPCExplorers (customExplorerAPIs?: ExplorerAPI[]) {
  return {
    custom: rpcFactory(customExplorerAPIs)
  }
}
