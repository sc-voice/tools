import { Assert } from './src/js/assert.mjs';
export const JS = {
  Assert,
}

import { Fraction } from './src/math/fraction.mjs';
import { Interval } from './src/math/interval.mjs';

export const ScvMath = {
  Fraction,
  Interval,
};

import { BilaraPath } from './src/text/bilara-path.mjs';
import { Corpus } from './src/text/corpus.mjs';
import { EbtDoc } from './src/text/ebt-doc.mjs';
import { LegacyDoc } from './src/text/legacy-doc.mjs';
import { MerkleJson } from './src/text/merkle-json.mjs';
import { SuttaCentralId } from './src/text/sutta-central-id.mjs';
import { Unicode } from './src/text/unicode.mjs';
import { WordSpace } from './src/text/word-space.mjs';
import { WordVector } from './src/text/word-vector.mjs';
import { TfidfSpace } from './src/text/tfidf-space.mjs';
import { LogEntry, Logger } from './src/text/logger.mjs';
import { ColorConsole} from './src/text/color-console.mjs';

export const Text = {
  BilaraPath,
  ColorConsole,
  Corpus,
  EbtDoc,
  LegacyDoc,
  LogEntry,
  Logger,
  MerkleJson,
  SuttaCentralId,
  Unicode,
  WordSpace,
  WordVector,
  TfidfSpace,
};

import { default as Sankey } from './src/graph/sankey.mjs';
export const Graph = {
  Sankey, 
}

