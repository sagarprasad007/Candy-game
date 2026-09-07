# game-board



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description | Type                          | Default  |
| --------------- | ---------------- | ----------- | ----------------------------- | -------- |
| `activeEffects` | `active-effects` |             | `SpecialEffect[] \| string`   | `[]`     |
| `cols`          | `cols`           |             | `number`                      | `8`      |
| `disabled`      | `disabled`       |             | `boolean`                     | `false`  |
| `gridData`      | `grid-data`      |             | `BoardTileData[][] \| string` | `[]`     |
| `phase`         | `phase`          |             | `string`                      | `'idle'` |
| `rows`          | `rows`           |             | `number`                      | `8`      |
| `selectedCol`   | `selected-col`   |             | `number`                      | `-1`     |
| `selectedRow`   | `selected-row`   |             | `number`                      | `-1`     |
| `showFps`       | `show-fps`       |             | `boolean`                     | `false`  |
| `swapAnimation` | `swap-animation` |             | `SwapAnimation \| string`     | `null`   |


## Events

| Event                | Description | Type                                                                                       |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `game-tile-selected` |             | `CustomEvent<{ row: number; col: number; }>`                                               |
| `tile-swapped`       |             | `CustomEvent<{ from: { row: number; col: number; }; to: { row: number; col: number; }; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
