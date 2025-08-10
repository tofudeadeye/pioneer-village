declare namespace Stable {}

declare interface UIRPC {
  ['stable.load-character-horses']: (characterId: number) => Horse.Data[];
}

declare interface UIEvents {}
