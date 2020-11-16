import sinon from 'sinon';
import alteredBlockcertsV3Fixture from '../fixtures/altered-blockcerts-v3';
import { MerkleProof2019 } from '../../src/MerkleProof2019';
import fixtureProof from '../fixtures/proof';
import * as lookForTxFunctions from '../../src/helpers/lookForTx';
import fixtureTransactionData from '../fixtures/transactionData';

describe('when the process fails', function () {
  let instance;

  beforeEach(function () {
    instance = new MerkleProof2019({ proof: fixtureProof, document: alteredBlockcertsV3Fixture });
    sinon.stub(lookForTxFunctions, 'default').resolves(fixtureTransactionData);
  });

  afterEach(function () {
    instance = null;
    sinon.restore();
  });

  describe('given the local hash does not match the remote hash', function () {
    it('should throw', async function () {
      await expect(async () => {
        await instance.verifyProof();
      }).rejects.toThrow('Remote hash does not match verified document.');
    });
  });
});
