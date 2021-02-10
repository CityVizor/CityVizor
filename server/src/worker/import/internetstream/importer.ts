import csvparse from 'csv-parse';
import * as fs from 'fs-extra';
import config from '../../../config';
import path from 'path';
import {pipeline, Transform} from 'stream';
import {Import} from '../import';
import {promisify} from 'util';
import {PostprocessingTransformer} from '../postprocessing-transformer';
import {DatabaseWriter} from '../db-writer';
import {PaymentRecord, AccountingRecord} from '../../../schema';

export async function importInternetStream(options: Import.Options) {
  const csvPaths = [
    path.join(config.storage.tmpInternetStream, 'RU.csv'),
    path.join(config.storage.tmpInternetStream, 'SK.csv'),
  ];
  for (const p of csvPaths) {
    const fileReader = fs.createReadStream(p);
    const isParser = createParser();
    const isTransformer = createTransformer(options);
    // The pipeline construct ensures every stream obtains the close signals
    // TODO: Remove the promisify workaround after upgrade to Node 15.x that has awaitable pipelines by default
    await promisify(pipeline)(
      fileReader,
      isParser,
      isTransformer,
      new PostprocessingTransformer(),
      new DatabaseWriter(options)
    );
  }
}

const internetStreamHeaders = [
  'DOKLAD_ROK',
  'DOKLAD_DATUM',
  'DOKLAD_AGENDA',
  'DOKLAD_CISLO',
  'ORGANIZACE',
  'ORGANIZACE_NAZEV',
  'ORJ',
  'ORJ_NAZEV',
  'PARAGRAF',
  'PARAGRAF_NAZEV',
  'POLOZKA',
  'POLOZKA_NAZEV',
  'SUBJEKT_IC',
  'SUBJEKT_NAZEV',
  'CASTKA_MD',
  'CASTKA_DAL',
  'POZNAMKA',
];

function parseHeader(headerLine: string[], headerNames: string[]): string[] {
  const foundHeaders: string[] = [];
  headerLine.forEach(h => {
    if (headerNames.includes(h)) {
      foundHeaders.push(h);
    }
  });
  return foundHeaders;
}

function createParser() {
  return csvparse({
    delimiter: ';',
    columns: line => parseHeader(line, internetStreamHeaders),
    relax_column_count: true,
  });
}

function createTransformer(options: Import.Options) {
  return new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(line, enc, callback) {
      const recordType = line.DOKLAD_AGENDA;
      const amountMd = line.CASTKA_MD;
      const amountDal = line.CASTKA_DAL;
      const amountFinal =
        line.POLOZKA < 5000 ? amountMd - amountDal : amountDal - amountMd;

      if (recordType === 'KDF' || recordType === 'KOF') {
        const payment: PaymentRecord = {
          paragraph: line.PARAGRAF,
          item: line.POLOZKA,
          event: line.ORGANIZACE,
          amount: amountFinal,
          date: line.DOKLAD_DATUM,
          counterpartyId: line.SUBJEKT_IC,
          counterpartyName: line.SUBJEKT_NAZEV,
          description: line.POZNAMKA,

          profileId: options.profileId,
          year: options.year,
        };
        this.push({type: 'payment', record: payment});
        callback();
      } else {
        const accounting: AccountingRecord = {
          type: recordType,
          paragraph: line.PARAGRAF,
          item: line.POLOZKA,
          event: line.ORGANIZACE,
          unit: line.ORJ,
          amount: amountFinal,

          profileId: options.profileId,
          year: options.year,
        };
        this.push({type: 'accounting', record: accounting});
        callback();
      }
    },
  });
}
