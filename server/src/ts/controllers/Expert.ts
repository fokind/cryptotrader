// import { ObjectID } from "mongodb";
// import { createQuery } from "odata-v4-mongodb";
import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { Expert } from "../models/Expert";
import { ObjectID } from "bson";
// import { Ticker } from "../models/Ticker";
// import { Strategy } from "../models/Strategy";
// import connect from "../connect";
// import * as market from "../../../market";

// const exchange = require('../../../exchange');

// const collectionName = "expert";

const experts = [];

@odata.type(Expert)
@Edm.EntitySet("Experts")
export class ExpertController extends ODataController {
  @odata.GET
  get(): Promise<Expert[]> {
    return new Promise(resolve => {
      resolve(experts);
    });
  }

  @odata.GET
  getById(@odata.key currency: string, @odata.key asset: string, @odata.key period: string): Promise<Expert> {
    return new Promise((resolve, reject) => {
      // добавить проверку на наличие символов и периодов
      // console.log(currency, asset, period, currency && asset && period);
      if (currency !== 'undefined' && asset !== 'undefined' &&  period !== 'undefined') {
        // console.log(1);
        let expert = experts.find(e => e.currency === currency && e.asset === asset && e.period === period);
        if (!expert) {
          expert = new Expert({
            currency,
            asset,
            period
          });
          experts.push();
        }
        expert.update(expert).then(() => {
          resolve(expert);  
        });
      } else {
        reject();
      }
    });
  }

  @odata.PATCH
  patch(@odata.key currency: string, @odata.key asset: string, @odata.key period: string, @odata.body delta: any): Promise<number> {
    return new Promise(resolve => {
      let expert = experts.find(e => e.currency === currency && e.asset === asset && e.period === period);
      delete delta.currency;
      delete delta.asset;
      delete delta.period;
      Object.assign(expert, delta);
      resolve(1);
    });
  }

  // @odata.GET("Ticker")
  // async getTicker(@odata.result result: any): Promise<Ticker> {
  //   const { currency, asset } = experts[0];
  //   return new Promise(resolve => {
  //     exchange.getTicker({
  //       currency,
  //       asset
  //     }, (err, ticker) => {
  //       ticker.currency = currency;
  //       ticker.asset = asset;
  //       resolve(<Ticker>ticker);
  //     });
  //   });
  // }

  // @odata.GET("Strategy")
  // async getStrategy(@odata.result result: Expert, @odata.query query: ODataQuery): Promise<Strategy> {
  //     const db = await connect();
  //     const mongodbQuery = createQuery(query);
  //     let catId;
  //     try{ catId = new ObjectID(result.strategyId); }catch(err){ catId = result.strategyId; }
  //     return db.collection("strategy").findOne({ _id: catId }, {
  //         fields: mongodbQuery.projection
  //     });
  // }

  // @odata.POST("Strategy").$ref
  // @odata.PUT("Strategy").$ref
  // @odata.PATCH("Strategy").$ref
  // async setStrategy( @odata.key key: string, @odata.link link: string): Promise<number> {
  //     const db = await connect();
  //     let keyId;
  //     try{ keyId = new ObjectID(key); }catch(err){ keyId = key; }
  //     let linkId;
  //     try{ linkId = new ObjectID(link); }catch(err){ linkId = link; }
  //     return await db.collection("Products").updateOne({
  //         _id: keyId
  //     }, {
  //             $set: { CategoryId: linkId }
  //         }).then((result) => {
  //             return result.modifiedCount;
  //         });
  // }

  // @odata.DELETE("Strategy").$ref
  // async unsetCategory( @odata.key key: string): Promise<number> {
  //     const db = await connect();
  //     let keyId;
  //     try{ keyId = new ObjectID(key); }catch(err){ keyId = key; }
  //     return await db.collection("Products").updateOne({
  //         _id: keyId
  //     }, {
  //             $unset: { CategoryId: 1 }
  //         }).then((result) => {
  //             return result.modifiedCount;
  //         });
  // }


  // constructor(jsonData: any) {
  //   super();
  //   this.data = [new Expert({})];
  //   Object.assign(this, jsonData);
  // }


  /*
  можно вычислить
  можно запустить или остановить

  сам следит за новыми свечами
  источник свечей пассивный

  сценарий использования:
  ключом может являться сочетание параметров, т.к. два эксперта с одним набором параметров не должно существовать одновременно
  элемент не нужно создавать, при обращении к несуществующему экземпляру он будет создан (в памяти без сохранения в базу данных)
  ключевые свойства изменить нельзя
  при обращении к новому эксперту, в том числе происходит получение статистики
  при обращении к новому экземпляру должны быть вычислены все свойства
  */


}
