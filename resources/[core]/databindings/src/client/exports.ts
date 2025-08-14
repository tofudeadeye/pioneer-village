import { exports } from '@lib/client';
import DataManager from './managers/data-manager';

const bindRootData: Databindings.bindRootData = (index, data) => {
  DataManager.bindRootData(index, data);
};

const bindData: Databindings.bindData = (index, data) => {
  DataManager.bindData(index, data);
};

exports<'databindings'>('bindRootData', bindRootData);
exports<'databindings'>('bindData', bindData);